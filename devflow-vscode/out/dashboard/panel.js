"use strict";
/**
 * DevFlow Dashboard Webview
 * Token usage across providers
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.DashboardPanel = void 0;
const vscode = __importStar(require("vscode"));
class DashboardPanel {
    static currentPanel;
    panel;
    constructor(panel) {
        this.panel = panel;
        this.panel.onDidDispose(() => {
            DashboardPanel.currentPanel = undefined;
        });
        this.update();
    }
    static createOrShow(_context) {
        if (DashboardPanel.currentPanel) {
            DashboardPanel.currentPanel.panel.reveal();
            return;
        }
        const panel = vscode.window.createWebviewPanel('devflowDashboard', 'DevFlow Dashboard', vscode.ViewColumn.One, { enableScripts: true });
        DashboardPanel.currentPanel = new DashboardPanel(panel);
    }
    getProxyUrl() {
        const port = vscode.workspace
            .getConfiguration('devflow')
            .get('proxyPort', 8080);
        return `http://localhost:${port}`;
    }
    async update() {
        try {
            const response = await fetch(`${this.getProxyUrl()}/status`);
            const data = (await response.json());
            const providers = data.providers ?? [];
            this.panel.webview.html = this.getHtmlContent(providers);
        }
        catch {
            this.panel.webview.html = this.getErrorHtml();
        }
    }
    getHtmlContent(providers) {
        const rows = providers
            .filter((p) => p.name)
            .map((p) => {
            const usedK = (p.tokens / 1000).toFixed(0);
            const limitK = p.limit === Infinity || p.limit === '∞'
                ? '∞'
                : (Number(p.limit) / 1000).toFixed(0);
            const percent = p.limit === Infinity || p.limit === '∞'
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
    getErrorHtml() {
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
exports.DashboardPanel = DashboardPanel;
//# sourceMappingURL=panel.js.map