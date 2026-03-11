import { SecurityIssue } from './gradingAlgorithm';

// escapes special HTML characters so code snippets can't break the page layout
function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// builds the full HTML string displayed in the VS Code webview panel
export function getReportHtml(result: { grade: string, issues: SecurityIssue[] }): string {
    // turn each issue into an HTML block; map returns an array, join collapses it to one string
    const issueRows = result.issues.map(issue => `
        <div class="issue">
            <strong>${issue.issue}</strong> &mdash; severity ${issue.severity}/10<br>
            <span class="location">${issue.file} : line ${issue.line}</span><br>
            <code>${escapeHtml(issue.snippet)}</code>
        </div>
    `).join('');

    const summary = result.issues.length === 0
        ? '<p style="color: green;">No issues found!</p>'
        : `<p>${result.issues.length} issue(s) found.</p>`;

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Codebase Security Report</title>
            <style>
                body { font-family: sans-serif; padding: 20px; }
                h1 { border-bottom: 2px solid #ccc; padding-bottom: 8px; }
                .grade { font-size: 48px; font-weight: bold; }
                .issue {
                    background: #f5f5f5;
                    border-left: 4px solid #e74c3c;
                    margin: 12px 0;
                    padding: 10px 14px;
                    border-radius: 4px;
                }
                .location { color: #666; font-size: 0.9em; }
                code {
                    display: block;
                    margin-top: 6px;
                    background: #eee;
                    padding: 4px 8px;
                    border-radius: 3px;
                    font-size: 0.85em;
                }
            </style>
        </head>
        <body>
            <h1>Codebase Security Report</h1>
            <p>Grade: <span class="grade">${result.grade}</span></p>
            ${summary}
            ${issueRows}
        </body>
    </html>
    `;
}
