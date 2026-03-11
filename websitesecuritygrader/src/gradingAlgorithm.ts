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
        new SecurityRule(/password\s*=\s*['"].+['"]/, ['.js', '.py', '.java'], 10, "Hardcoded password found"),
        new SecurityRule(/apiKey\s*=\s*['"].+['"]/, ['.js', '.py', '.java'], 8, "Hardcoded API key found"),
        new SecurityRule(/eval\(/, ['.js'], 7, "Use of eval() can lead to code injection vulnerabilities"),
        new SecurityRule(/exec\(/, ['.py'], 7, "Use of exec() can lead to code injection vulnerabilities"),
        new SecurityRule(/Runtime\.getRuntime\(\)\.exec\(/, ['.java'], 7, "Use of Runtime.exec() can lead to code injection vulnerabilities")
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
    } else if (totalSeverity <= 10) {
        grade = 'B';
    } else if (totalSeverity <= 20) {
        grade = 'C';
    } else if (totalSeverity <= 30) {
        grade = 'D';
    } else {
        grade = 'F';
    }

    return { grade, issues };
}
