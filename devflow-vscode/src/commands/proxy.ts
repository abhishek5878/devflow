/**
 * DevFlow: Start/Stop Proxy commands
 */

import * as vscode from 'vscode';
import { spawn, ChildProcess } from 'child_process';
import { join } from 'path';
import { existsSync } from 'fs';
import { getStoredKeys } from './setup';

let proxyProcess: ChildProcess | null = null;

export async function startProxyCommand(context: vscode.ExtensionContext): Promise<void> {
  if (proxyProcess) {
    vscode.window.showInformationMessage('DevFlow proxy already running');
    return;
  }

  // Dev path: parent of devflow-vscode. Packaged: node_modules/devflow-ai
  const bundledPath = join(context.extensionPath, 'node_modules', 'devflow-ai');
  const devPath = join(context.extensionPath, '..');
  const devflowPath = existsSync(join(bundledPath, 'dist', 'index.js'))
    ? bundledPath
    : devPath;

  const useBuilt = existsSync(join(devflowPath, 'dist', 'index.js'));
  const command = useBuilt ? 'node' : 'npm';
  const args = useBuilt ? ['dist/index.js'] : ['run', 'dev'];
  const port = vscode.workspace
    .getConfiguration('devflow')
    .get<number>('proxyPort', 8080);

  const storedKeys = await getStoredKeys(context);
  const hasKeys = Object.keys(storedKeys).length > 0;
  const env = {
    ...process.env,
    DEVFLOW_PORT: String(port),
    ...storedKeys,
  };

  if (!hasKeys) {
    const action = await vscode.window.showWarningMessage(
      'No API keys added yet. Add keys for proxy routing, or use context snapshot (Cmd+Shift+D) which needs no setup.',
      'Add API Key',
      'Start Anyway'
    );
    if (action === 'Add API Key') {
      await import('./setup').then((m) => m.addApiKeyCommand(context));
      return;
    }
  }

  proxyProcess = spawn(command, args, {
    cwd: devflowPath,
    shell: command === 'npm',
    env,
  });

  proxyProcess.stdout?.on('data', (data) => {
    console.log(`[DevFlow Proxy] ${data}`);
  });

  proxyProcess.stderr?.on('data', (data) => {
    console.error(`[DevFlow Proxy] ${data}`);
  });

  proxyProcess.on('exit', (code) => {
    proxyProcess = null;
    if (code !== 0 && code !== null) {
      console.log(`[DevFlow Proxy] exited with code ${code}`);
    }
  });

  vscode.window.showInformationMessage(
    `✓ DevFlow proxy started at localhost:${port}`
  );
}

export function stopProxyCommand(): void {
  if (!proxyProcess) {
    vscode.window.showWarningMessage('DevFlow proxy not running');
    return;
  }

  proxyProcess.kill();
  proxyProcess = null;

  vscode.window.showInformationMessage('✓ DevFlow proxy stopped');
}
