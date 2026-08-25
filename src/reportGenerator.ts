import { SecurityIssue } from './gradingAlgorithm';

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

// maps a numeric severity to a CSS class for the left border color
function severityClass(severity: number): string {
    if (severity <= 3) { return 'sev-low'; }    // yellow
    if (severity <= 6) { return 'sev-medium'; } // orange
    return 'sev-high';                          // red
}

export function getReportHtml(result: { grade: string, issues: SecurityIssue[] }): string {
    const issueRows = result.issues.map(issue => `
        <div class="issue ${severityClass(issue.severity)}">
            <div class="issue-header">
                <span class="issue-title">${issue.issue}</span>
                <span class="issue-severity">severity ${issue.severity}/10</span>
            </div>
            <div class="issue-location">${issue.file} : line ${issue.line}</div>
            <code>${escapeHtml(issue.snippet)}</code>
        </div>
    `).join('');

    const summary = result.issues.length === 0
        ? '<p class="no-issues">No issues found!</p>'
        : `<p class="issue-count">${result.issues.length} issue(s) found</p>`;

    // pick a color for the grade letter itself
    const gradeColor =
        result.grade === 'A' ? '#2ecc71' :
        result.grade === 'B' ? '#27ae60' :
        result.grade === 'C' ? '#f39c12' :
        result.grade === 'D' ? '#e67e22' : '#e74c3c';

    return `
    <!DOCTYPE html>
    <html>
        <head>
            <title>Codebase Security Report</title>
            <style>
                body {
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
                    background: #1e1e1e;
                    color: #d4d4d4;
                    padding: 32px;
                    margin: 0;
                    line-height: 1.6;
                }

                h1 {
                    font-size: 1.6em;
                    font-weight: 600;
                    color: #ffffff;
                    border-bottom: 1px solid #3c3c3c;
                    padding-bottom: 12px;
                    margin-bottom: 24px;
                }

                .header-row {
                    display: flex;
                    align-items: center;
                    gap: 24px;
                    margin-bottom: 28px;
                }

                .grade {
                    font-size: 72px;
                    font-weight: 700;
                    color: ${gradeColor};
                    line-height: 1;
                }

                .header-meta {
                    display: flex;
                    flex-direction: column;
                    gap: 4px;
                }

                .issue-count {
                    font-size: 1em;
                    color: #9d9d9d;
                    margin: 0;
                }

                .no-issues {
                    color: #2ecc71;
                    font-weight: 500;
                    margin: 0;
                }

                /* each issue card */
                .issue {
                    background: #2d2d2d;
                    border-left: 5px solid #555;
                    border-radius: 6px;
                    margin: 12px 0;
                    padding: 14px 16px;
                }

                /* severity color bands */
                .sev-low    { border-left-color: #f1c40f; } /* yellow  1-3 */
                .sev-medium { border-left-color: #e67e22; } /* orange  4-6 */
                .sev-high   { border-left-color: #e74c3c; } /* red     7-10 */

                .issue-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: baseline;
                    margin-bottom: 4px;
                }

                .issue-title {
                    font-weight: 600;
                    color: #ffffff;
                    font-size: 0.95em;
                }

                .issue-severity {
                    font-size: 0.8em;
                    color: #888;
                }

                .issue-location {
                    font-size: 0.82em;
                    color: #888;
                    margin-bottom: 8px;
                    font-family: 'Menlo', 'Consolas', monospace;
                }

                code {
                    display: block;
                    background: #1a1a1a;
                    color: #ce9178;
                    padding: 8px 12px;
                    border-radius: 4px;
                    font-size: 0.85em;
                    font-family: 'Menlo', 'Consolas', monospace;
                    white-space: pre-wrap;
                    word-break: break-all;
                }
            </style>
        </head>
        <body>
            <h1>Codebase Security Report</h1>
            <div class="header-row">
                <div class="grade">${result.grade}</div>
                <div class="header-meta">
                    ${summary}
                </div>
            </div>
            ${issueRows}
        </body>
    </html>
    `;
}
