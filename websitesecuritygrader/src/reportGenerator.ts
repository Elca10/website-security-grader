import { SecurityIssue } from './gradingAlgorithm';
import { AiAnalysisResult } from './aiAPI';

// escapes special HTML characters so code snippets can't break the page layout
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// builds the full HTML string displayed in the VS Code webview panel
export function getReportHtml(
    result: { grade: string, issues: SecurityIssue[] },
    aiResults: AiAnalysisResult[]
): string {
    // --- regex findings section ---
    const issueRows = result.issues.map(issue => `
        <div class="issue">
            <strong>${issue.issue}</strong> &mdash; severity ${issue.severity}/10<br>
            <span class="location">${issue.file} : line ${issue.line}</span><br>
            <code>${escapeHtml(issue.snippet)}</code>
        </div>
    `).join('');

    const regexSummary = result.issues.length === 0
        ? '<p style="color: green;">No pattern-based issues found.</p>'
        : `<p>${result.issues.length} issue(s) found.</p>`;

    // --- AI findings section ---
    // build a block for each file the AI analyzed
    const aiFileBlocks = aiResults.map(fileResult => {
        // build a card for each issue within that file
        const fileIssues = fileResult.issues.map(issue => `
            <div class="ai-issue severity-${issue.severity}">
                <strong>${issue.title}</strong> [${issue.severity}]
                ${issue.line ? `— line ${issue.line}` : ''}<br>
                <em>${issue.description}</em><br>
                ${issue.snippet ? `<code>${escapeHtml(issue.snippet)}</code>` : ''}
            </div>
        `).join('');

        const noIssues = fileResult.issues.length === 0
            ? '<p style="color: green; margin: 4px 0;">No issues found.</p>'
            : '';

        return `
            <div class="ai-file">
                <h3>${fileResult.fileName}</h3>
                <p class="summary">${fileResult.summary}</p>
                ${noIssues}
                ${fileIssues}
            </div>
        `;
    }).join('');

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Codebase Security Report</title>
            <style>
                body { font-family: sans-serif; padding: 20px; max-width: 900px; }
                h1 { border-bottom: 2px solid #ccc; padding-bottom: 8px; }
                h2 { border-bottom: 1px solid #ddd; padding-bottom: 6px; margin-top: 32px; }
                h3 { margin: 0 0 4px 0; font-size: 1em; }
                .grade { font-size: 48px; font-weight: bold; }
                .issue {
                    background: #f5f5f5;
                    border-left: 4px solid #e74c3c;
                    margin: 12px 0;
                    padding: 10px 14px;
                    border-radius: 4px;
                }
                .ai-file {
                    background: #f9f9f9;
                    border: 1px solid #ddd;
                    border-radius: 6px;
                    padding: 14px 18px;
                    margin: 16px 0;
                }
                /* color-coded left border based on severity */
                .ai-issue {
                    margin: 10px 0;
                    padding: 8px 12px;
                    border-radius: 4px;
                    border-left: 4px solid #ccc;
                }
                .severity-critical { border-left-color: #e74c3c; background: #fff5f5; }
                .severity-high     { border-left-color: #e67e22; background: #fff8f0; }
                .severity-medium   { border-left-color: #f39c12; background: #fffbf0; }
                .severity-low      { border-left-color: #3498db; background: #f0f8ff; }
                .summary  { color: #555; font-style: italic; margin: 4px 0 8px 0; }
                .location { color: #666; font-size: 0.9em; }
                code {
                    display: block;
                    margin-top: 6px;
                    background: #eee;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 0.85em;
                    white-space: pre-wrap;
                }
            </style>
        </head>
        <body>
            <h1>Codebase Security Report</h1>
            <p>Grade: <span class="grade">${result.grade}</span></p>

            <h2>Pattern-Based Scan</h2>
            ${regexSummary}
            ${issueRows}

            <h2>AI Analysis</h2>
            ${aiResults.length === 0
                ? '<p>No files were analyzed.</p>'
                : aiFileBlocks
            }
        </body>
    </html>
    `;
}
