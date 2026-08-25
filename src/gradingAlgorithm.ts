import * as fs from 'fs';
import * as path from 'path';

// exported so reportGenerator can reference this type
export class SecurityIssue {
    issue: string;
    severity: number; // 1 (low) to 10 (high)
    file: string;     // absolute file path (string, not the browser File type)
    line: number;     // 1-based line number
    snippet: string;  // the matching line of code
    description: string;

    constructor(issue: string, severity: number, file: string, line: number, snippet: string, description: string) {
        this.issue = issue;
        this.severity = severity;
        this.file = file;
        this.line = line;
        this.snippet = snippet;
        this.description = description;
    }
}

class SecurityRule {
    pattern: RegExp;
    extensions: string[];
    severity: number;
    description: string;

    constructor(pattern: RegExp, extensions: string[], severity: number, description: string) {
        this.pattern = pattern;
        this.extensions = extensions;
        this.severity = severity;
        this.description = description;
    }
}

function loadSecurityRules(): SecurityRule[] {
    return [
        // --- Hardcoded Secrets ---
        new SecurityRule(/password\s*=\s*['"].+['"]/,     ['.js', '.ts', '.py', '.java'], 10, "Hardcoded password"),
        new SecurityRule(/apiKey\s*=\s*['"].+['"]/,       ['.js', '.ts', '.py', '.java'],  8, "Hardcoded API key"),
        new SecurityRule(/secret\s*=\s*['"].+['"]/,       ['.js', '.ts', '.py', '.java'],  8, "Hardcoded secret"),
        new SecurityRule(/token\s*=\s*['"].+['"]/,        ['.js', '.ts', '.py', '.java'],  8, "Hardcoded token"),
        new SecurityRule(/private_key\s*=\s*['"].+['"]/,  ['.js', '.ts', '.py', '.java'], 10, "Hardcoded private key"),

        // --- XSS (Cross-Site Scripting) ---
        new SecurityRule(/\.innerHTML\s*=/,         ['.js', '.ts', '.html'], 8, "Direct innerHTML assignment — dangerous if value contains user input"),
        new SecurityRule(/document\.write\s*\(/,    ['.js', '.ts', '.html'], 7, "document.write() is a common XSS vector"),
        new SecurityRule(/eval\s*\(/,               ['.js', '.ts'],          9, "eval() executes arbitrary code — high injection risk"),
        new SecurityRule(/dangerouslySetInnerHTML/, ['.js', '.ts', '.jsx', '.tsx'], 7, "dangerouslySetInnerHTML bypasses React's XSS protection"),

        // --- SQL Injection ---
        new SecurityRule(/"SELECT.*\+/,   ['.js', '.ts', '.py', '.java'], 9, "SQL query built with string concatenation — risk of SQL injection"),
        new SecurityRule(/`SELECT.*\${/,  ['.js', '.ts'],                  9, "SQL query with template literal interpolation — risk of SQL injection"),

        // --- Insecure Connections ---
        new SecurityRule(/http:\/\/(?!localhost)/, ['.js', '.ts', '.py', '.html', '.java'], 5, "HTTP used instead of HTTPS — data is sent unencrypted"),

        // --- Command Injection ---
        new SecurityRule(/require\s*\(\s*['"]child_process['"]\s*\)/, ['.js', '.ts'], 7, "Importing child_process — ensure user input never reaches exec/spawn"),
        new SecurityRule(/\.exec\s*\(/,  ['.js', '.ts', '.py'], 7, "exec() can run shell commands — dangerous with user-controlled input"),
        new SecurityRule(/Runtime\.getRuntime\(\)\.exec\(/, ['.java'], 7, "Runtime.exec() can lead to command injection"),

        // --- Weak Cryptography ---
        new SecurityRule(/Math\.random\s*\(/, ['.js', '.ts'], 3, "Math.random() is not cryptographically secure — use crypto.getRandomValues() instead"),
        new SecurityRule(/md5\s*\(/,           ['.js', '.ts', '.py'], 6, "MD5 is cryptographically broken — use SHA-256 or stronger"),
        new SecurityRule(/sha1\s*\(/,          ['.js', '.ts', '.py'], 6, "SHA-1 is cryptographically broken — use SHA-256 or stronger"),

        // --- Developer Oversights ---
        new SecurityRule(/TODO.*security/i,   ['.js', '.ts', '.py', '.java', '.html'], 2, "Unresolved security TODO comment"),
        new SecurityRule(/\/\/\s*password/i,  ['.js', '.ts'],                          5, "Commented-out password in source code"),
    ];
}

// accepts file paths (strings), reads each file using Node's fs module
function findIssues(filePaths: string[], rules: SecurityRule[]): SecurityIssue[] {
    let issues: SecurityIssue[] = [];

    for (let filePath of filePaths) {
        const ext = path.extname(filePath); // e.g. ".js", ".py"

        // read file as text; skip if unreadable (binary file, permission error, etc.)
        let content: string;
        try {
            content = fs.readFileSync(filePath, 'utf8');
        } catch {
            continue;
        }

        const lines = content.split('\n');

        for (let rule of rules) {
            if (!rule.extensions.includes(ext)) {
                continue; // skip rules that don't apply to this file type
            }

            for (let i = 0; i < lines.length; i++) {
                if (rule.pattern.test(lines[i])) {
                    issues.push(new SecurityIssue(
                        rule.description,
                        rule.severity,
                        filePath,
                        i + 1,           // i is 0-based; line numbers start at 1
                        lines[i].trim(), // the actual line of code that matched
                        rule.description
                    ));
                }
            }
        }
    }

    return issues;
}

// main entry point: scans all files and returns the grade + full issue list
export function calculateGrade(filePaths: string[]): { grade: string, issues: SecurityIssue[] } {
    const rules = loadSecurityRules();
    const issues = findIssues(filePaths, rules);

    // sum severity scores across all issues to determine overall grade
    const totalSeverity = issues.reduce((sum, issue) => sum + issue.severity, 0);

    let grade: string;
    if (totalSeverity === 0) {
        grade = 'A';
    } else if (totalSeverity <= 20) {
        grade = 'B';
    } else if (totalSeverity <= 40) {
        grade = 'C';
    } else if (totalSeverity <= 60) {
        grade = 'D';
    } else {
        grade = 'F';
    }

    return { grade, issues };
}
