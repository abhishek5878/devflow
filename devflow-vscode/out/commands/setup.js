"use strict";
/**
 * DevFlow: API Key Setup - No .env editing required
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
exports.addApiKeyCommand = addApiKeyCommand;
exports.getStoredKeys = getStoredKeys;
exports.hasAnyKeys = hasAnyKeys;
const vscode = __importStar(require("vscode"));
const PROVIDERS = [
    { id: 'openai', label: 'OpenAI (GPT-4)', key: 'devflow.openai_key', env: 'OPENAI_KEY' },
    { id: 'anthropic', label: 'Anthropic (Claude)', key: 'devflow.anthropic_key', env: 'ANTHROPIC_KEY' },
    { id: 'gemini', label: 'Google (Gemini)', key: 'devflow.gemini_key', env: 'GEMINI_KEY' },
];
async function addApiKeyCommand(context) {
    const choice = await vscode.window.showQuickPick(PROVIDERS.map((p) => ({ label: p.label, provider: p })), {
        title: 'Add API key for provider',
        placeHolder: 'Select which provider to add',
    });
    if (!choice)
        return;
    const { provider } = choice;
    const key = await vscode.window.showInputBox({
        title: `Add ${provider.label} API Key`,
        placeHolder: `Paste your ${provider.env} (stored securely)`,
        password: true,
        ignoreFocusOut: true,
        validateInput: (v) => (v.trim().length < 10 ? 'Key seems too short' : null),
    });
    if (!key?.trim())
        return;
    await context.secrets.store(provider.key, key.trim());
    const action = await vscode.window.showInformationMessage(`✓ ${provider.label} key saved. Start the proxy to use it.`, 'Start Proxy');
    if (action === 'Start Proxy') {
        vscode.commands.executeCommand('devflow.startProxy');
    }
}
async function getStoredKeys(context) {
    const env = {};
    for (const p of PROVIDERS) {
        const val = await context.secrets.get(p.key);
        if (val)
            env[p.env] = val;
    }
    return env;
}
async function hasAnyKeys(context) {
    const keys = await getStoredKeys(context);
    return Object.keys(keys).length > 0;
}
//# sourceMappingURL=setup.js.map