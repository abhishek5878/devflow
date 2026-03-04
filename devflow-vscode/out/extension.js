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
const setup_2 = require("./commands/setup");
let statusBar;
async function showGetStarted(context) {
    const port = vscode.workspace.getConfiguration('devflow').get('proxyPort', 8080);
    const hasKeys = await (0, setup_2.hasAnyKeys)(context);
    let proxyRunning = false;
    try {
        const ac = new AbortController();
        setTimeout(() => ac.abort(), 800);
        const res = await fetch(`http://localhost:${port}/status`, { signal: ac.signal });
        if (res.ok)
            proxyRunning = true;
    }
    catch { /* not running */ }
    const panel = vscode.window.createWebviewPanel('devflowGetStarted', 'DevFlow: Get Started', vscode.ViewColumn.One, { enableScripts: true });
    panel.webview.html = getStartedHtml(panel.webview, { hasKeys, proxyRunning });
    panel.webview.onDidReceiveMessage(async (msg) => {
        if (msg.command === 'run') {
            vscode.commands.executeCommand(msg.id);
        }
        if (msg.command === 'refresh') {
            panel.dispose();
            await showGetStarted(context);
        }
    });
}
function getStartedHtml(webview, state) {
    const run = (cmd) => `runCommand('${cmd}')`;
    const s1 = state.hasKeys ? ' ✓' : '';
    const s2 = state.proxyRunning ? ' ✓' : '';
    return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8">
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap">
<style>
  :root{--bg:#0a0a0a;--surface:#141414;--text:#fafafa;--muted:#737373;--accent:#22c55e;--border:#262626}
  *{box-sizing:border-box;margin:0;padding:0}
  body{font-family:'Inter',system-ui,sans-serif;background:var(--bg);color:var(--text);padding:24px;line-height:1.6;max-width:560px;-webkit-font-smoothing:antialiased}
  code{background:var(--surface);color:var(--accent);padding:2px 6px;border-radius:4px;font-size:0.9em}
  h1{font-size:1.5rem;margin-bottom:20px}
  h2{margin-top:28px;margin-bottom:8px;font-size:1.1rem}
  .btn{display:inline-block;background:var(--accent);color:var(--bg);padding:8px 16px;border-radius:6px;
    cursor:pointer;margin:4px 8px 4px 0;font-size:13px;font-weight:600;border:none;text-decoration:none}
  .btn:hover{opacity:0.9}
  .btn-ghost{background:transparent;color:var(--muted);border:1px solid var(--border)}
  .tip{background:var(--surface);border:1px solid var(--border);padding:12px 16px;border-radius:8px;margin:16px 0;font-size:14px;color:var(--muted)}
  .tip strong{color:var(--text)}
  .steps{list-style:none;padding:0}
  .steps li{margin:12px 0;padding-left:24px;position:relative}
  .steps li::before{content:"→";position:absolute;left:0;color:var(--accent)}
  .done{color:var(--accent)}
  hr{border:none;border-top:1px solid var(--border);margin:24px 0}
  .muted{font-size:12px;color:var(--muted)}
</style>
</head>
<body>
<h1>DevFlow: Never Lose Your AI Context</h1>

<h2>Context Snapshot (No setup)</h2>
<p>Hit a limit in Cursor, Claude Code, or Copilot? Press <code>Cmd+Shift+D</code>. Paste into Claude.ai. Done.</p>
<button class="btn" onclick="${run('devflow.generateSnapshot')}">Generate Context Now (Cmd+Shift+D)</button>
<button class="btn btn-ghost" onclick="${run('devflow.copyAndOpenClaude')}">Copy & Open Claude</button>

<h2>Proxy Routing (Continue.dev, Roo Code, Cline)</h2>
<p><strong>One key is enough.</strong> DevFlow adds Ollama as free fallback when you run <code>ollama run llama3.2</code>.</p>
<ul class="steps">
  <li class="done">1. Add API Key${s1} <button class="btn" onclick="${run('devflow.addApiKey')}">Add API Key</button></li>
  <li class="done">2. Start Proxy${s2} <button class="btn" onclick="${run('devflow.startProxy')}">Start Proxy</button></li>
  <li>3. Connect Your Tool <button class="btn" onclick="${run('devflow.connectContinue')}">Connect</button></li>
</ul>

<div class="tip">
  <strong>After connecting:</strong> Reload your AI tool (or window), then select "DevFlow Router" from the model dropdown.
</div>

<button class="btn" onclick="${run('devflow.openDashboard')}">Open Dashboard</button>
<button class="btn btn-ghost" onclick="vscode.postMessage({command:'refresh'})">Refresh progress</button>

<hr>
<p class="muted">Context snapshot needs no keys. Proxy needs at least one (OpenAI or Anthropic).</p>
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
    // Copy & open Claude.ai
    context.subscriptions.push(vscode.commands.registerCommand('devflow.copyAndOpenClaude', async () => {
        await (0, snapshot_1.generateSnapshotCommand)();
        vscode.env.openExternal(vscode.Uri.parse('https://claude.ai/new'));
    }));
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