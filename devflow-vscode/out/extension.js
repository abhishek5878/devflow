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
const connect_1 = require("./commands/connect");
let statusBar;
function showGetStarted(context) {
    const panel = vscode.window.createWebviewPanel('devflowGetStarted', 'DevFlow: Get Started', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = getStartedHtml(panel.webview);
    panel.webview.onDidReceiveMessage((msg) => {
        if (msg.command === 'run') {
            vscode.commands.executeCommand(msg.id);
        }
    });
}
function getStartedHtml(webview) {
    const run = (cmd) => `runCommand('${cmd}')`;
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<style>
  body{font-family:var(--vscode-font-family);padding:24px;line-height:1.6;max-width:560px}
  code{background:var(--vscode-textBlockQuote-background);padding:2px 6px;border-radius:4px}
  h2{margin-top:28px;margin-bottom:8px}
  .btn{display:inline-block;background:var(--vscode-button-background);color:var(--vscode-button-foreground);
    padding:8px 16px;border-radius:4px;cursor:pointer;margin:4px 8px 4px 0;font-size:13px;border:none}
  .btn:hover{opacity:0.9}
  .tip{background:var(--vscode-textBlockQuote-background);padding:12px 16px;border-radius:6px;margin:16px 0;font-size:14px}
  .steps{list-style:none;padding:0}
  .steps li{margin:12px 0;padding-left:24px;position:relative}
  .steps li::before{content:"→";position:absolute;left:0;color:var(--vscode-textLink-foreground)}
</style>
</head>
<body>
<h1>DevFlow: Never Lose Your AI Context</h1>

<h2>Context Snapshot (No setup)</h2>
<p>Hit a limit in Cursor, Claude Code, or Copilot? Press <code>Cmd+Shift+D</code>. Paste into Claude.ai. Done.</p>
<button class="btn" onclick="${run('devflow.generateSnapshot')}">Generate Context Now</button>

<h2>Proxy Routing (Continue.dev, Roo Code, Cline)</h2>
<p><strong>One key is enough.</strong> DevFlow adds Ollama as free fallback when you run <code>ollama run llama3.2</code>.</p>
<ul class="steps">
  <li><button class="btn" onclick="${run('devflow.addApiKey')}">Add API Key</button></li>
  <li><button class="btn" onclick="${run('devflow.startProxy')}">Start Proxy</button></li>
  <li><button class="btn" onclick="${run('devflow.connectContinue')}">Connect Your Tool</button></li>
</ul>

<div class="tip">
  <strong>After connecting:</strong> Reload your AI tool (or window), then select "DevFlow Router" from the model dropdown.
</div>

<button class="btn" onclick="${run('devflow.openDashboard')}">Open Dashboard</button>

<hr style="margin-top:32px">
<p style="font-size:12px;color:var(--vscode-descriptionForeground)">Context snapshot needs no keys. Proxy needs at least one (OpenAI or Anthropic).</p>
</body>
<script>
  const vscode = acquireVsCodeApi();
  function runCommand(id) { vscode.postMessage({ command: 'run', id }); }
</script>
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
    context.subscriptions.push(vscode.commands.registerCommand('devflow.connectContinue', connect_1.connectContinueCommand));
    context.subscriptions.push(vscode.commands.registerCommand('devflow.openDashboard', () => {
        const port = vscode.workspace.getConfiguration('devflow').get('proxyPort', 8080);
        vscode.env.openExternal(vscode.Uri.parse(`http://localhost:${port}/dashboard`));
    }));
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