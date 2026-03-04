"use strict";
/**
 * DevFlow: One-click Connect to Continue.dev / Roo Code / Cline
 * Writes DevFlow proxy config to the tool's config file
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
exports.connectContinueCommand = connectContinueCommand;
const vscode = __importStar(require("vscode"));
const os_1 = require("os");
const path_1 = require("path");
const fs_1 = require("fs");
const CONTINUE_CONFIG = (0, path_1.join)((0, os_1.homedir)(), '.continue', 'config.json');
const ROO_CONFIG = (0, path_1.join)((0, os_1.homedir)(), '.roo-code', 'config.json');
const CLINE_CONFIG = (0, path_1.join)((0, os_1.homedir)(), '.cline', 'config.json');
const DEVFLOW_MODEL = {
    title: 'DevFlow Router',
    provider: 'openai',
    model: 'gpt-4o',
    apiBase: 'http://localhost:8080/v1',
    apiKey: 'devflow-local',
};
function getPort() {
    return vscode.workspace
        .getConfiguration('devflow')
        .get('proxyPort', 8080);
}
function ensureDevFlowModel(models) {
    const port = getPort();
    const devflow = {
        ...DEVFLOW_MODEL,
        apiBase: `http://localhost:${port}/v1`,
    };
    const withoutDevFlow = models.filter((m) => {
        if (typeof m !== 'object' || m === null)
            return true;
        const obj = m;
        if (obj.title === 'DevFlow Router')
            return false;
        if (obj.apiBase?.includes('localhost:') && obj.apiBase?.includes('/v1'))
            return false;
        return true;
    });
    return [devflow, ...withoutDevFlow];
}
async function tryConnect(configPath, toolName) {
    try {
        const dir = (0, path_1.join)(configPath, '..');
        if (!(0, fs_1.existsSync)(dir)) {
            (0, fs_1.mkdirSync)(dir, { recursive: true });
        }
        let config = {};
        if ((0, fs_1.existsSync)(configPath)) {
            const raw = (0, fs_1.readFileSync)(configPath, 'utf-8');
            config = JSON.parse(raw);
        }
        const models = Array.isArray(config.models) ? config.models : [];
        config.models = ensureDevFlowModel(models);
        (0, fs_1.writeFileSync)(configPath, JSON.stringify(config, null, 2), 'utf-8');
        return { ok: true };
    }
    catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { ok: false, error: msg };
    }
}
async function connectContinueCommand() {
    const port = getPort();
    const base = `http://localhost:${port}/v1`;
    const choices = [
        { label: 'Continue.dev', description: 'Recommended • writes to ~/.continue/config.json', path: CONTINUE_CONFIG },
        { label: 'Roo Code', description: 'May need manual Base URL in settings', path: ROO_CONFIG },
        { label: 'Cline', description: 'May need manual Base URL in settings', path: CLINE_CONFIG },
    ];
    const pick = await vscode.window.showQuickPick(choices, {
        title: 'Connect DevFlow to AI tool',
        placeHolder: 'Select which tool to configure',
        matchOnDescription: true,
    });
    if (!pick)
        return;
    const result = await tryConnect(pick.path, pick.label);
    if (result.ok) {
        let msg = `✓ Config written. Restart ${pick.label} (or reload window), then select "DevFlow Router" from the model dropdown.`;
        if (pick.label !== 'Continue.dev') {
            msg += ` If your tool ignores this file, set Base URL to http://localhost:${port}/v1 and API Key to devflow-local in its settings.`;
        }
        const action = await vscode.window.showInformationMessage(msg, 'Reload Window', 'Open Dashboard');
        if (action === 'Reload Window') {
            vscode.commands.executeCommand('workbench.action.reloadWindow');
        }
        else if (action === 'Open Dashboard') {
            vscode.commands.executeCommand('devflow.openDashboard');
        }
    }
    else {
        vscode.window.showErrorMessage(`DevFlow: Failed to write config: ${result.error}`);
    }
}
//# sourceMappingURL=connect.js.map