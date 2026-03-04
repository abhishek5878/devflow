/**
 * DevFlow: One-click Connect to Continue.dev / Roo Code / Cline
 * Writes DevFlow proxy config to the tool's config file
 */

import * as vscode from 'vscode';
import { homedir } from 'os';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';

const CONTINUE_CONFIG = join(homedir(), '.continue', 'config.json');
const ROO_CONFIG = join(homedir(), '.roo-code', 'config.json');
const CLINE_CONFIG = join(homedir(), '.cline', 'config.json');

const DEVFLOW_MODEL = {
  title: 'DevFlow Router',
  provider: 'openai',
  model: 'gpt-4o',
  apiBase: 'http://localhost:8080/v1',
  apiKey: 'devflow-local',
};

function getPort(): number {
  return vscode.workspace
    .getConfiguration('devflow')
    .get<number>('proxyPort', 8080);
}

function ensureDevFlowModel(models: unknown[]): unknown[] {
  const port = getPort();
  const devflow = {
    ...DEVFLOW_MODEL,
    apiBase: `http://localhost:${port}/v1`,
  };

  const withoutDevFlow = models.filter((m) => {
    if (typeof m !== 'object' || m === null) return true;
    const obj = m as { apiBase?: string; title?: string };
    if (obj.title === 'DevFlow Router') return false;
    if (obj.apiBase?.includes('localhost:') && obj.apiBase?.includes('/v1')) return false;
    return true;
  });
  return [devflow, ...withoutDevFlow];
}

async function tryConnect(
  configPath: string,
  toolName: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    const dir = join(configPath, '..');
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }

    let config: { models?: unknown[]; [k: string]: unknown } = {};
    if (existsSync(configPath)) {
      const raw = readFileSync(configPath, 'utf-8');
      config = JSON.parse(raw) as typeof config;
    }

    const models = Array.isArray(config.models) ? config.models : [];
    config.models = ensureDevFlowModel(models);

    writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf-8');
    return { ok: true };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: msg };
  }
}

export async function connectContinueCommand(): Promise<void> {
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

  if (!pick) return;

  const result = await tryConnect(pick.path, pick.label);

  if (result.ok) {
    let msg = `✓ Config written. Restart ${pick.label} (or reload window), then select "DevFlow Router" from the model dropdown.`;
    if (pick.label !== 'Continue.dev') {
      msg += ` If your tool ignores this file, set Base URL to http://localhost:${port}/v1 and API Key to devflow-local in its settings.`;
    }
    const action = await vscode.window.showInformationMessage(msg, 'Reload Window', 'Open Dashboard');
    if (action === 'Reload Window') {
      vscode.commands.executeCommand('workbench.action.reloadWindow');
    } else if (action === 'Open Dashboard') {
      vscode.commands.executeCommand('devflow.openDashboard');
    }
  } else {
    vscode.window.showErrorMessage(
      `DevFlow: Failed to write config: ${result.error}`
    );
  }
}
