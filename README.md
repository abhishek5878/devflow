# DevFlow AI

> **Never lose your AI context when token limits hit.**

DevFlow has two modes—use one or both:

| Use Case | Setup | How |
|----------|-------|-----|
| **Context recovery** (Cursor, Copilot, Claude Code, any AI) | **Zero** | Run `npx abhishek5878/devflow` → paste into Claude.ai (copies to clipboard) |
| **Proxy routing** (Continue.dev, Roo Code, Cline) | Add API key, start proxy | Auto-failover across Claude, GPT-4, Gemini when one hits limit |

See [INSTALL.md](INSTALL.md) for step-by-step setup. Extension: Command Palette → **DevFlow: Get Started**.

**Landing page:** `landing/index.html` — deploy to Vercel, Netlify, or GitHub Pages. Preview: `npm run landing:serve` (http://localhost:3001).

---

## Phase 1: Local Proxy Router

OpenAI-compatible endpoint at `http://localhost:8080/v1` that:

- Routes requests across multiple AI providers (Claude, GPT-4, Gemini)
- Tracks token usage with exact accuracy
- Silently fails over on HTTP 429 (rate limit) without interrupting the developer

### Quick Start

```bash
# Install
npm install

# Configure (optional - copy .env.example to .env)
cp .env.example .env
# Add OPENAI_KEY, ANTHROPIC_KEY, etc.

# Run
npm run dev
```

### IDE Configuration

Point any OpenAI-compatible client at DevFlow:

```json
{
  "ai.endpoint": "http://localhost:8080/v1",
  "ai.apiKey": "devflow-local"
}
```

Works with: Continue.dev, Roo Code, Cline, and any tool accepting custom OpenAI endpoints.

### Test Failover (No API Keys Required)

```bash
# Terminal 1: Start with mock providers
DEVFLOW_MOCK_LIMITS=1 npm run dev

# Terminal 2: Run limit exhaustion test
npm run test:limits
```

You'll see Claude "exhaust" after ~2-3 requests, then silent failover to GPT-4.

### Full Test Suite

```bash
npm test          # Build, context, extension
npm run test:all  # Above + proxy failover + client (starts proxy automatically)
npm run test:userflow  # End-to-end user flow (Context Snapshot + Proxy)
```

For manual proxy test:
```bash
DEVFLOW_MOCK_LIMITS=1 npm run dev   # terminal 1
npm run test:proxy                  # terminal 2
```

### Basic Connectivity Test

```bash
npm run dev    # terminal 1
npm run test:client   # terminal 2 (requires OPENAI_KEY or ANTHROPIC_KEY)
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/v1/chat/completions` | OpenAI-compatible chat completions (proxied) |
| GET | `/v1/models` | List available models |
| GET | `/v1/health` | Provider status & token usage |

### Provider Priority

1. Claude (100k limit)
2. GPT-4 (80k limit)
3. Gemini (90k limit)
4. Ollama (∞, local — run `ollama run llama3.2`)
5. Amazon Q, Codeium (∞, when integrated)

At 90% capacity: warning logged. At 100%: automatic failover. Ollama used as free fallback if running.

---

## Phase 2: Context Engine

Recovery tool for closed systems (Cursor, GitHub Copilot). Generate `context.md` for seamless handoff to any AI.

```bash
npx abhishek5878/devflow
```

**Default:** Copies to clipboard. Paste into Claude.ai. Done.

**Options:** `--no-copy` (just write file), `--skip-tsc` (faster on large TS projects), `--output path` (custom output)

**Output:** Git history, stack detection, project rules, "For the Next AI" handoff. One command. Zero friction.

---

## Phase 3: VS Code Extension

**From repo root** (`/Users/abhishekvyas/devflow`):

```bash
npm run ext:setup
```

Or step by step:
```bash
npm run build
cd devflow-vscode && npm install && npm run compile
```

Then open the `devflow-vscode` folder in VS Code and press **F5**.

- **Cmd+Shift+D** (Mac) / **Ctrl+Shift+D** (Win/Linux) — Generate context.md
- **Status bar** — Proxy status and token usage (click for dashboard)
- **Commands** — Start Proxy, Stop Proxy, View Dashboard

---

---

## Installation (from .vsix)

See **[INSTALL.md](INSTALL.md)** for Quick Start, configuration, and troubleshooting.

Package the extension (requires **Node 20+**):
```bash
cd devflow-vscode && npm install && npm run package
# Creates devflow-0.1.0.vsix
```
On Node 18, use the extension from source with F5 (see Phase 3 above).

---

## Roadmap

- **Phase 4:** Publish to VS Code Marketplace — see [PUBLISH.md](PUBLISH.md) for steps
