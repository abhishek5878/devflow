"use strict";
/**
 * DevFlow: Start/Stop Proxy commands
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
exports.startProxyCommand = startProxyCommand;
exports.stopProxyCommand = stopProxyCommand;
const vscode = __importStar(require("vscode"));
const child_process_1 = require("child_process");
const path_1 = require("path");
const fs_1 = require("fs");
const setup_1 = require("./setup");
let proxyProcess = null;
async function startProxyCommand(context) {
    if (proxyProcess) {
        vscode.window.showInformationMessage('DevFlow proxy already running');
        return;
    }
    // Dev path: parent of devflow-vscode. Packaged: node_modules/devflow-ai
    const bundledPath = (0, path_1.join)(context.extensionPath, 'node_modules', 'devflow-ai');
    const devPath = (0, path_1.join)(context.extensionPath, '..');
    const devflowPath = (0, fs_1.existsSync)((0, path_1.join)(bundledPath, 'dist', 'index.js'))
        ? bundledPath
        : devPath;
    const useBuilt = (0, fs_1.existsSync)((0, path_1.join)(devflowPath, 'dist', 'index.js'));
    const command = useBuilt ? 'node' : 'npm';
    const args = useBuilt ? ['dist/index.js'] : ['run', 'dev'];
    const port = vscode.workspace
        .getConfiguration('devflow')
        .get('proxyPort', 8080);
    const storedKeys = await (0, setup_1.getStoredKeys)(context);
    const hasKeys = Object.keys(storedKeys).length > 0;
    const env = {
        ...process.env,
        DEVFLOW_PORT: String(port),
        ...storedKeys,
    };
    if (!hasKeys) {
        const action = await vscode.window.showWarningMessage('No API keys added yet. Add keys for proxy routing, or use context snapshot (Cmd+Shift+D) which needs no setup.', 'Add API Key', 'Start Anyway');
        if (action === 'Add API Key') {
            await Promise.resolve().then(() => __importStar(require('./setup'))).then((m) => m.addApiKeyCommand(context));
            return;
        }
    }
    proxyProcess = (0, child_process_1.spawn)(command, args, {
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
    vscode.window.showInformationMessage(`✓ DevFlow proxy running at localhost:${port}`, 'Connect AI Tool', 'Open Dashboard').then((action) => {
        if (action === 'Connect AI Tool') {
            vscode.commands.executeCommand('devflow.connectContinue');
        }
        else if (action === 'Open Dashboard') {
            vscode.commands.executeCommand('devflow.openDashboard');
        }
    });
}
function stopProxyCommand() {
    if (!proxyProcess) {
        vscode.window.showWarningMessage('DevFlow proxy not running');
        return;
    }
    proxyProcess.kill();
    proxyProcess = null;
    vscode.window.showInformationMessage('✓ DevFlow proxy stopped');
}
//# sourceMappingURL=proxy.js.map