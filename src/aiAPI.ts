import Anthropic from '@anthropic-ai/sdk';
import * as fs from 'fs';
import * as path from 'path';

// shape of a single issue returned by the AI
export interface AiIssue {
    title: string;
    severity: 'critical' | 'high' | 'medium' | 'low';
    line: number | null;  // AI may not always know the exact line
    description: string;
    snippet: string;
}

// shape of the full result for one analyzed file
export interface AiAnalysisResult {
    fileName: string;
    issues: AiIssue[];
    summary: string;  // one-sentence verdict from the model
}

// only analyze these file types — others are unlikely to have web security issues
const SCANNABLE_EXTENSIONS = new Set(['.js', '.ts', '.jsx', '.tsx', '.html', '.php', '.py']);

// cap file content sent to the API to keep token costs predictable
const MAX_FILE_CHARS = 8000;

// cap total files analyzed per run to avoid too many API calls
const MAX_FILES = 10;

// analyzes one file's content — called internally by analyzeFiles
async function analyzeFile(
    fileName: string,
    content: string,
    client: Anthropic,
    model: string
): Promise<AiAnalysisResult> {
    // truncate if the file is very large
    const truncated = content.length > MAX_FILE_CHARS
        ? content.slice(0, MAX_FILE_CHARS) + '\n\n[...file truncated...]'
        : content;

    // the prompt instructs the model to return structured JSON only
    const prompt = `You are a security code reviewer. Analyze the following file for security vulnerabilities.

File: ${fileName}

\`\`\`
${truncated}
\`\`\`

Return ONLY a raw JSON object — no markdown, no explanation. Use this exact structure:
{
  "issues": [
    {
      "title": "brief issue name",
      "severity": "critical" or "high" or "medium" or "low",
      "line": <integer line number, or null if not identifiable>,
      "description": "what the vulnerability is and how to fix it",
      "snippet": "the relevant line(s) of code"
    }
  ],
  "summary": "one sentence describing this file's overall security posture"
}

If no issues are found, return: {"issues": [], "summary": "No security issues detected."}`;

    const message = await client.messages.create({
        model,
        max_tokens: 1024,
        messages: [{ role: 'user', content: prompt }]
    });

    // filter to text blocks only (responses can also contain tool_use blocks in other contexts)
    const responseText = message.content
        .filter((block): block is Anthropic.TextBlock => block.type === 'text')
        .map(block => block.text)
        .join('');

    // parse the JSON response; return a safe empty result if it isn't valid JSON
    try {
        const parsed = JSON.parse(responseText);
        return {
            fileName,
            issues: parsed.issues ?? [],
            summary: parsed.summary ?? ''
        };
    } catch {
        return { fileName, issues: [], summary: 'Could not parse AI response.' };
    }
}

// public entry point: filters file list, reads files, and calls analyzeFile for each
export async function analyzeFiles(
    filePaths: string[],
    apiKey: string,
    model: string
): Promise<AiAnalysisResult[]> {
    const client = new Anthropic({ apiKey });

    // filter to scannable types and cap the total count
    const toAnalyze = filePaths
        .filter(fp => SCANNABLE_EXTENSIONS.has(path.extname(fp).toLowerCase()))
        .slice(0, MAX_FILES);

    // analyze all selected files in parallel
    const results = await Promise.all(
        toAnalyze.map(async fp => {
            let content: string;
            try {
                content = fs.readFileSync(fp, 'utf8');
            } catch {
                return null; // skip files that can't be read
            }
            return analyzeFile(path.basename(fp), content, client, model);
        })
    );

    // remove nulls from skipped files
    return results.filter((r): r is AiAnalysisResult => r !== null);
}
