/**
 * DevFlow AI - VS Code Extension
 * Entry point and activation
 */

import * as vscode from 'vscode';
import { generateSnapshotCommand } from './commands/snapshot';
import { DevFlowStatusBar } from './statusbar';
import { startProxyCommand, stopProxyCommand } from './commands/proxy';
import { DashboardPanel } from './dashboard/panel';
import { addApiKeyCommand } from './commands/setup';

let statusBar: DevFlowStatusBar | undefined;

function showGetStarted(_context: vscode.ExtensionContext): void {
  const panel = vscode.window.createWebviewPanel(
    'devflowGetStarted',
    'DevFlow: Get Started',
    vscode.ViewColumn.One,
    { enableScripts: false }
  );
  panel.webview.html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><style>body{font-family:var(--vscode-font-family);padding:24px;line-height:1.6} code{background:var(--vscode-textBlockQuote-background);padding:2px 6px;border-radius:4px} h2{margin-top:24px} ol{padding-left:20px} .step{margin:16px 0}</style></head>
<body>
<h1>DevFlow: Never Lose Your AI Context</h1>
<p>Two ways to use DevFlow:</p>

<h2>1. Context Snapshot (Zero Setup)</h2>
<p><strong>For Cursor, Claude Code, Copilot, or any tool that hit limits:</strong></p>
<ol>
  <li>Press <code>Cmd+Shift+D</code> (Mac) or <code>Ctrl+Shift+D</code> (Windows)</li>
  <li>Get <code>context.md</code> in &lt;1 second</li>
  <li>Copy it and paste into Claude.ai or any AI to resume exactly where you left off</li>
</ol>
<p>No API keys. No proxy. Just works.</p>

<h2>2. Proxy Routing (For Continue.dev, Roo Code, Cline)</h2>
<p><strong>Route through multiple AI providers with automatic failover:</strong></p>
<ol>
  <li><strong>Add API Key</strong>: Command Palette → "DevFlow: Add API Key" → Add OpenAI and/or Anthropic key</li>
  <li><strong>Start Proxy</strong>: Command Palette → "DevFlow: Start Proxy"</li>
  <li><strong>Configure your tool</strong>: Point it at <code>http://localhost:8080/v1</code> with API key <code>devflow-local</code></li>
</ol>
<p>When one provider hits its limit, DevFlow silently switches to the next. You never notice.</p>

<hr>
<p><small>Questions? See README or INSTALL.md in the extension folder.</small></p>
</body>
</html>`;
}
let refreshInterval: ReturnType<typeof setInterval> | undefined;

export async function activate(context: vscode.ExtensionContext): Promise<void> {
  // Snapshot command (Cmd+Shift+D)
  context.subscriptions.push(
    vscode.commands.registerCommand(
      'devflow.generateSnapshot',
      generateSnapshotCommand
    )
  );

  // Dashboard command
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.viewDashboard', () => {
      DashboardPanel.createOrShow(context);
    })
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.getStarted', () => {
      showGetStarted(context);
    })
  );

  // Switch provider (placeholder for now)
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.switchProvider', () => {
      vscode.window.showInformationMessage(
        'Provider switching: Configure in Continue.dev or point to localhost:8080'
      );
    })
  );

  // Setup & Proxy
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.addApiKey', () =>
      addApiKeyCommand(context)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.startProxy', () =>
      startProxyCommand(context)
    )
  );
  context.subscriptions.push(
    vscode.commands.registerCommand('devflow.stopProxy', stopProxyCommand)
  );

  // Status bar
  statusBar = new DevFlowStatusBar();
  context.subscriptions.push({
    dispose: () => {
      statusBar?.dispose();
    },
  });

  refreshInterval = setInterval(() => {
    statusBar?.update();
  }, 5000);

  // First-run: suggest Get Started
  const seen = context.globalState.get('devflow.welcomeSeen', false);
  if (!seen) {
    context.globalState.update('devflow.welcomeSeen', true);
    vscode.window
      .showInformationMessage(
        'DevFlow: Press Cmd+Shift+D anytime to generate context for AI handoff. Need help?',
        'Get Started'
      )
      .then((action) => {
        if (action === 'Get Started') showGetStarted(context);
      });
  }
}

export function deactivate(): void {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = undefined;
  }
}
