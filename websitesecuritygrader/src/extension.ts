import * as vscode from 'vscode';
import { calculateGrade } from './gradingAlgorithm';
import { getReportHtml } from './reportGenerator';
import { analyzeFiles } from './aiAPI';

export async function activate(context: vscode.ExtensionContext) {
    const disposable = vscode.commands.registerCommand('websitesecuritygrader.generateReport', async () => {

        // read settings the user configured under Settings > WebsiteSecurityGrader
        const config = vscode.workspace.getConfiguration('websitesecuritygrader');
        const apiKey = config.get<string>('apiKey');
        const model = config.get<string>('model') ?? 'claude-sonnet-4-6';

        // stop early and tell the user what's missing
        if (!apiKey) {
            vscode.window.showErrorMessage(
                'No API key found. Add your Anthropic key in Settings under websitesecuritygrader.apiKey'
            );
            return;
        }

        // find all workspace files, skipping build artifacts and dependencies
        const fileUris = await vscode.workspace.findFiles(
            '**/*',
            '{**/node_modules/**,**/.git/**,**/out/**,**/dist/**}'
        );
        const filePaths = fileUris.map(uri => uri.fsPath);

        // run the fast regex-based scan first
        const regexResult = calculateGrade(filePaths);

        // run the AI analysis (slower — makes API calls for each file)
        vscode.window.showInformationMessage('Running AI security analysis...');
        const aiResults = await analyzeFiles(filePaths, apiKey, model);

        // open the webview panel and render the combined report
        const panel = vscode.window.createWebviewPanel(
            'report',
            'Codebase Security Report',
            vscode.ViewColumn.One,
            {}
        );
        panel.webview.html = getReportHtml(regexResult, aiResults);

        vscode.window.showInformationMessage(`Scan complete — Grade: ${regexResult.grade}`);
    });

    context.subscriptions.push(disposable);
}

export function deactivate() {}
