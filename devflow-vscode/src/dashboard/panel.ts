/**
 * DevFlow Dashboard Webview
 * Token usage across providers
 */

import * as vscode from 'vscode';

interface ProviderStatus {
  name: string;
  used: number;
  limit: number | '∞';
  available?: boolean;
}

export class DashboardPanel {
  public static currentPanel: DashboardPanel | undefined;
  private readonly panel: vscode.WebviewPanel;

  private constructor(panel: vscode.WebviewPanel) {
    this.panel = panel;
    this.panel.onDidDispose(() => {
      DashboardPanel.currentPanel = undefined;
    });
    this.update();
  }

  public static createOrShow(_context: vscode.ExtensionContext): void {
    if (DashboardPanel.currentPanel) {
      DashboardPanel.currentPanel.panel.reveal();
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      'devflowDashboard',
      'DevFlow Dashboard',
      vscode.ViewColumn.One,
      { enableScripts: true }
    );

    DashboardPanel.currentPanel = new DashboardPanel(panel);
  }

  private getProxyUrl(): string {
    const port = vscode.workspace
      .getConfiguration('devflow')
      .get<number>('proxyPort', 8080);
    return `http://localhost:${port}`;
  }

  private async update(): Promise<void> {
    try {
      const response = await fetch(`${this.getProxyUrl()}/status`);
      const data = (await response.json()) as {
        providers?: Array<{
          name: string;
          tokens: number;
          limit: number | string;
          available?: boolean;
        }>;
      };

      const providers = data.providers ?? [];
      this.panel.webview.html = this.getHtmlContent(providers);
    } catch {
      this.panel.webview.html = this.getErrorHtml();
    }
  }

  private getHtmlContent(
    providers: Array<{
      name: string;
      tokens: number;
      limit: number | string;
      available?: boolean;
    }>
  ): string {
    const rows = providers
      .filter((p) => p.name)
      .map((p) => {
        const usedK = (p.tokens / 1000).toFixed(0);
        const limitK =
          p.limit === Infinity || p.limit === '∞'
            ? '∞'
            : (Number(p.limit) / 1000).toFixed(0);
        const percent =
          p.limit === Infinity || p.limit === '∞'
            ? '—'
            : ((p.tokens / Number(p.limit)) * 100).toFixed(0) + '%';
        const status = p.available !== false ? '🟢 OK' : '🔴 FULL';

        return `
        <tr>
          <td>${p.name}</td>
          <td>${usedK}k</td>
          <td>${limitK}k</td>
          <td>${percent}</td>
          <td>${status}</td>
        </tr>
      `;
      })
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: var(--vscode-font-family);
      padding: 20px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
    }
    th, td {
      text-align: left;
      padding: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
    }
    th {
      font-weight: bold;
    }
  </style>
</head>
<body>
  <h1>DevFlow Token Dashboard</h1>
  <table>
    <thead>
      <tr>
        <th>Provider</th>
        <th>Used</th>
        <th>Limit</th>
        <th>%</th>
        <th>Status</th>
      </tr>
    </thead>
    <tbody>
      ${rows || '<tr><td colspan="5">No providers configured</td></tr>'}
    </tbody>
  </table>
</body>
</html>`;
  }

  private getErrorHtml(): string {
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body>
  <h1>DevFlow Proxy Not Running</h1>
  <p>Start the proxy with: <strong>DevFlow: Start Proxy</strong> from the command palette, or run <code>npm run dev</code> in the devflow directory.</p>
</body>
</html>`;
  }
}
