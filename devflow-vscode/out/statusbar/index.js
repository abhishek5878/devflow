"use strict";
/**
 * DevFlow Status Bar
 * Shows proxy status and token usage
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
exports.DevFlowStatusBar = void 0;
const vscode = __importStar(require("vscode"));
class DevFlowStatusBar {
    statusBarItem;
    warnedProviders = new Set();
    constructor() {
        this.statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        this.statusBarItem.command = 'devflow.viewDashboard';
        this.update();
        this.statusBarItem.show();
    }
    getProxyUrl() {
        const port = vscode.workspace
            .getConfiguration('devflow')
            .get('proxyPort', 8080);
        return `http://localhost:${port}`;
    }
    async update() {
        const url = `${this.getProxyUrl()}/status`;
        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 1000);
            const response = await fetch(url, { signal: controller.signal });
            clearTimeout(timeout);
            if (!response.ok)
                throw new Error('Not OK');
            const data = (await response.json());
            const provider = data.activeProvider || 'none';
            const usage = data.tokenUsage;
            if (usage && usage.limit !== Infinity) {
                const usedK = (usage.used / 1000).toFixed(0);
                const limitK = (usage.limit / 1000).toFixed(0);
                const percentUsed = usage.used / usage.limit;
                this.statusBarItem.text = `$(pulse) DevFlow → ${provider} | ${usedK}k/${limitK}k`;
                if (percentUsed >= 1) {
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
                }
                else if (percentUsed >= 0.9) {
                    this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.warningBackground');
                    if (!this.warnedProviders.has(provider)) {
                        this.warnedProviders.add(provider);
                        const action = await vscode.window.showWarningMessage(`DevFlow: ${provider} at ${Math.round(percentUsed * 100)}% capacity. Add another key for stronger fallback.`, 'Add API Key');
                        if (action === 'Add API Key') {
                            vscode.commands.executeCommand('devflow.addApiKey');
                        }
                    }
                }
                else {
                    this.statusBarItem.backgroundColor = undefined;
                }
            }
            else {
                this.statusBarItem.text = `$(pulse) DevFlow → ${provider} | ∞`;
                this.statusBarItem.backgroundColor = undefined;
            }
        }
        catch {
            this.statusBarItem.text = '$(circle-slash) DevFlow: Not running';
            this.statusBarItem.backgroundColor = new vscode.ThemeColor('statusBarItem.errorBackground');
        }
    }
    dispose() {
        this.statusBarItem.dispose();
    }
}
exports.DevFlowStatusBar = DevFlowStatusBar;
//# sourceMappingURL=index.js.map