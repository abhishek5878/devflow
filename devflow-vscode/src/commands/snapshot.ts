/**
 * DevFlow: Generate Context Snapshot command
 * Cmd+Shift+D - wires Phase 2 context engine to VS Code
 */

import * as vscode from 'vscode';
import { readFileSync } from 'fs';
import { join } from 'path';

export async function generateSnapshotCommand(): Promise<void> {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];

  if (!workspaceFolder) {
    vscode.window.showErrorMessage(
      'DevFlow: No workspace folder open. Open a project first.'
    );
    return;
  }

  const projectPath = workspaceFolder.uri.fsPath;

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: 'DevFlow: Generating context snapshot...',
      cancellable: false,
    },
    async () => {
      const startTime = Date.now();

      try {
        // Dynamic import for ESM module from devflow-ai
        const ext = vscode.extensions.getExtension('devflow.devflow');
        const basePath = ext?.extensionPath
          ? join(ext.extensionPath, 'node_modules', 'devflow-ai', 'dist', 'cli', 'snapshot.js')
          : join(__dirname, '..', '..', '..', 'dist', 'cli', 'snapshot.js');
        const { generateSnapshot } = await import(
          /* webpackIgnore: true */ basePath
        );
        const config = vscode.workspace.getConfiguration('devflow');
        const skipTypeCheck = config.get<boolean>('skipTypeCheck', false);
        const outputPathTemplate = config.get<string>(
          'contextOutputPath',
          '${workspaceFolder}/context.md'
        );
        const outputPath = outputPathTemplate.replace(
          '${workspaceFolder}',
          projectPath
        );

        await generateSnapshot(projectPath, {
          skipTypeCheck,
          outputPath,
        });

        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

        const action = await vscode.window.showInformationMessage(
          `✓ context.md generated (${elapsed}s)`,
          'Open File',
          'Copy to Clipboard'
        );

        if (action === 'Open File') {
          const doc = await vscode.workspace.openTextDocument(outputPath);
          await vscode.window.showTextDocument(doc);
        } else if (action === 'Copy to Clipboard') {
          const content = readFileSync(outputPath, 'utf-8');
          await vscode.env.clipboard.writeText(content);
          vscode.window.showInformationMessage(
            'DevFlow: Copied context.md to clipboard'
          );
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error';
        vscode.window.showErrorMessage(`DevFlow: ${message}`);
      }
    }
  );
}
