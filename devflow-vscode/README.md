# DevFlow AI - VS Code Extension

VS Code integration for DevFlow: context snapshots, proxy status, and token dashboard.

## Features

- **Cmd+Shift+D** — Generate `context.md` for AI handoff (paste into Claude.ai, etc.)
- **Status Bar** — Current proxy status and token usage (updates every 5s)
- **Dashboard** — Token usage across all providers
- **Start/Stop Proxy** — Control the local proxy from the command palette

## Installation (Development)

**Option A – from repo root** (`/Users/abhishekvyas/devflow`):
```bash
npm run ext:setup
```

**Option B – from this folder** (`devflow-vscode`):
```bash
npm run setup
```

**Then:** Open this folder in VS Code and press **F5** to launch the Extension Development Host.

**Test:** In the new window, open any project folder and press **Cmd+Shift+D** to generate context.

## Requirements

- DevFlow proxy (run via **DevFlow: Start Proxy** or `npm run dev` in parent directory) for status bar and dashboard
- Workspace folder open for snapshot generation

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `devflow.skipTypeCheck` | `false` | Skip TypeScript check during snapshot (faster on large projects) |
| `devflow.proxyPort` | `8080` | Port for the local proxy server |
| `devflow.contextOutputPath` | `${workspaceFolder}/context.md` | Output path for context snapshot |

## Packaging as .vsix

Requires **Node 20+**:
```bash
npm run package
# Creates devflow-0.1.0.vsix
```
