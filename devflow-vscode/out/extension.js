"use strict";
/**
 * DevFlow AI - VS Code Extension
 * Entry point and activation
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
exports.activate = activate;
exports.deactivate = deactivate;
const vscode = __importStar(require("vscode"));
const snapshot_1 = require("./commands/snapshot");
const statusbar_1 = require("./statusbar");
const proxy_1 = require("./commands/proxy");
const panel_1 = require("./dashboard/panel");
const setup_1 = require("./commands/setup");
let statusBar;
function showGetStarted(_context) {
    const panel = vscode.window.createWebviewPanel('devflowGetStarted', 'DevFlow: Get Started', vscode.ViewColumn.One, { enableScripts: false });
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
let refreshInterval;
async function activate(context) {
    // Snapshot command (Cmd+Shift+D)
    context.subscriptions.push(vscode.commands.registerCommand('devflow.generateSnapshot', snapshot_1.generateSnapshotCommand));
    // Dashboard command
    context.subscriptions.push(vscode.commands.registerCommand('devflow.viewDashboard', () => {
        panel_1.DashboardPanel.createOrShow(context);
    }));
    context.subscriptions.push(vscode.commands.registerCommand('devflow.getStarted', () => {
        showGetStarted(context);
    }));
    // Switch provider (placeholder for now)
    context.subscriptions.push(vscode.commands.registerCommand('devflow.switchProvider', () => {
        vscode.window.showInformationMessage('Provider switching: Configure in Continue.dev or point to localhost:8080');
    }));
    // Setup & Proxy
    context.subscriptions.push(vscode.commands.registerCommand('devflow.addApiKey', () => (0, setup_1.addApiKeyCommand)(context)));
    context.subscriptions.push(vscode.commands.registerCommand('devflow.startProxy', () => (0, proxy_1.startProxyCommand)(context)));
    context.subscriptions.push(vscode.commands.registerCommand('devflow.stopProxy', proxy_1.stopProxyCommand));
    // Status bar
    statusBar = new statusbar_1.DevFlowStatusBar();
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
            .showInformationMessage('DevFlow: Press Cmd+Shift+D anytime to generate context for AI handoff. Need help?', 'Get Started')
            .then((action) => {
            if (action === 'Get Started')
                showGetStarted(context);
        });
    }
}
function deactivate() {
    if (refreshInterval) {
        clearInterval(refreshInterval);
        refreshInterval = undefined;
    }
}
//# sourceMappingURL=extension.js.map