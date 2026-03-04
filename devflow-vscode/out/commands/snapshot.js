"use strict";
/**
 * DevFlow: Generate Context Snapshot command
 * Cmd+Shift+D - wires Phase 2 context engine to VS Code
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
exports.generateSnapshotCommand = generateSnapshotCommand;
const vscode = __importStar(require("vscode"));
const fs_1 = require("fs");
const path_1 = require("path");
async function generateSnapshotCommand() {
    const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
    if (!workspaceFolder) {
        vscode.window.showErrorMessage('DevFlow: No workspace folder open. Open a project first.');
        return;
    }
    const projectPath = workspaceFolder.uri.fsPath;
    await vscode.window.withProgress({
        location: vscode.ProgressLocation.Notification,
        title: 'DevFlow: Generating context snapshot...',
        cancellable: false,
    }, async () => {
        const startTime = Date.now();
        try {
            // Dynamic import for ESM module from devflow-ai
            const ext = vscode.extensions.getExtension('devflow.devflow');
            const basePath = ext?.extensionPath
                ? (0, path_1.join)(ext.extensionPath, 'node_modules', 'devflow-ai', 'dist', 'cli', 'snapshot.js')
                : (0, path_1.join)(__dirname, '..', '..', '..', 'dist', 'cli', 'snapshot.js');
            const { generateSnapshot } = await Promise.resolve(`${
            /* webpackIgnore: true */ basePath}`).then(s => __importStar(require(s)));
            const config = vscode.workspace.getConfiguration('devflow');
            const skipTypeCheck = config.get('skipTypeCheck', false);
            const outputPathTemplate = config.get('contextOutputPath', '${workspaceFolder}/context.md');
            const outputPath = outputPathTemplate.replace('${workspaceFolder}', projectPath);
            await generateSnapshot(projectPath, {
                skipTypeCheck,
                outputPath,
            });
            const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
            const action = await vscode.window.showInformationMessage(`✓ context.md generated (${elapsed}s)`, 'Open File', 'Copy to Clipboard');
            if (action === 'Open File') {
                const doc = await vscode.workspace.openTextDocument(outputPath);
                await vscode.window.showTextDocument(doc);
            }
            else if (action === 'Copy to Clipboard') {
                const content = (0, fs_1.readFileSync)(outputPath, 'utf-8');
                await vscode.env.clipboard.writeText(content);
                vscode.window.showInformationMessage('DevFlow: Copied context.md to clipboard');
            }
        }
        catch (err) {
            const message = err instanceof Error ? err.message : 'Unknown error';
            vscode.window.showErrorMessage(`DevFlow: ${message}`);
        }
    });
}
//# sourceMappingURL=snapshot.js.map