import * as vscode from 'vscode';
import { calculateGrade } from './gradingAlgorithm';
import { getReportHtml } from './reportGenerator';

export async function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('websitesecuritygrader.generateReport', async () => {
        // find all workspace files, skipping build artifacts and dependencies
        const fileUris = await vscode.workspace.findFiles(
            '**/*',
            '{**/node_modules/**,**/.git/**,**/out/**,**/dist/**}'
        );
        const filePaths = fileUris.map(uri => uri.fsPath);

        // run the regex-based scan
        const result = calculateGrade(filePaths);

        // open the webview and render the report
        const panel = vscode.window.createWebviewPanel(
            'report',
            'Codebase Security Report',
            vscode.ViewColumn.One,
            {}
        );
        panel.webview.html = getReportHtml(result);

        vscode.window.showInformationMessage(`Scan complete — Grade: ${result.grade}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
