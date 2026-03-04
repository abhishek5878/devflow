/**
 * DevFlow Status Bar
 * Shows proxy status and token usage
 */

import * as vscode from 'vscode';

export class DevFlowStatusBar {
  private statusBarItem: vscode.StatusBarItem;
  private warnedProviders = new Set<string>();

  constructor() {
    this.statusBarItem = vscode.window.createStatusBarItem(
      vscode.StatusBarAlignment.Right,
      100
    );
    this.statusBarItem.command = 'devflow.viewDashboard';
    this.update();
    this.statusBarItem.show();
  }

  private getProxyUrl(): string {
    const port = vscode.workspace
      .getConfiguration('devflow')
      .get<number>('proxyPort', 8080);
    return `http://localhost:${port}`;
  }

  async update(): Promise<void> {
    const url = `${this.getProxyUrl()}/status`;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);

      if (!response.ok) throw new Error('Not OK');

      const data = (await response.json()) as {
        activeProvider?: string;
        tokenUsage?: { used: number; limit: number };
      };

      const provider = data.activeProvider || 'none';
      const usage = data.tokenUsage;

      if (usage && usage.limit !== Infinity) {
        const usedK = (usage.used / 1000).toFixed(0);
        const limitK = (usage.limit / 1000).toFixed(0);
        const percentUsed = usage.used / usage.limit;

        this.statusBarItem.text = `$(pulse) DevFlow → ${provider} | ${usedK}k/${limitK}k`;

        if (percentUsed >= 1) {
          this.statusBarItem.backgroundColor = new vscode.ThemeColor(
            'statusBarItem.errorBackground'
          );
        } else if (percentUsed >= 0.9) {
          this.statusBarItem.backgroundColor = new vscode.ThemeColor(
            'statusBarItem.warningBackground'
          );
          if (!this.warnedProviders.has(provider)) {
            this.warnedProviders.add(provider);
            vscode.window.showWarningMessage(
              `DevFlow: ${provider} at ${Math.round(percentUsed * 100)}% capacity. Next provider will be used at limit.`
            );
          }
        } else {
          this.statusBarItem.backgroundColor = undefined;
        }
      } else {
        this.statusBarItem.text = `$(pulse) DevFlow → ${provider} | ∞`;
        this.statusBarItem.backgroundColor = undefined;
      }
    } catch {
      this.statusBarItem.text = '$(circle-slash) DevFlow: Not running';
      this.statusBarItem.backgroundColor = new vscode.ThemeColor(
        'statusBarItem.errorBackground'
      );
    }
  }

  dispose(): void {
    this.statusBarItem.dispose();
  }
}
