/**
 * DevFlow: API Key Setup - No .env editing required
 */

import * as vscode from 'vscode';

const PROVIDERS = [
  { id: 'openai', label: 'OpenAI (GPT-4)', key: 'devflow.openai_key', env: 'OPENAI_KEY' },
  { id: 'anthropic', label: 'Anthropic (Claude)', key: 'devflow.anthropic_key', env: 'ANTHROPIC_KEY' },
  { id: 'gemini', label: 'Google (Gemini)', key: 'devflow.gemini_key', env: 'GEMINI_KEY' },
] as const;

export async function addApiKeyCommand(context: vscode.ExtensionContext): Promise<void> {
  const choice = await vscode.window.showQuickPick(
    PROVIDERS.map((p) => ({ label: p.label, provider: p })),
    {
      title: 'Add API key for provider',
      placeHolder: 'Select which provider to add',
    }
  );

  if (!choice) return;

  const { provider } = choice;
  const key = await vscode.window.showInputBox({
    title: `Add ${provider.label} API Key`,
    placeHolder: `Paste your ${provider.env} (stored securely)`,
    password: true,
    ignoreFocusOut: true,
    validateInput: (v) => (v.trim().length < 10 ? 'Key seems too short' : null),
  });

  if (!key?.trim()) return;

  await context.secrets.store(provider.key, key.trim());
  vscode.window.showInformationMessage(
    `✓ ${provider.label} key saved. Start the proxy to use it.`
  );
}

export async function getStoredKeys(context: vscode.ExtensionContext): Promise<Record<string, string>> {
  const env: Record<string, string> = {};
  for (const p of PROVIDERS) {
    const val = await context.secrets.get(p.key);
    if (val) env[p.env] = val;
  }
  return env;
}

export async function hasAnyKeys(context: vscode.ExtensionContext): Promise<boolean> {
  const keys = await getStoredKeys(context);
  return Object.keys(keys).length > 0;
}
