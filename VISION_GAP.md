# Vision vs. Current Build

Aligned to your concept docs (AI Coding Assistant Aggregator + DevFlow AI).

## ✓ Working (Matches Vision)

| Vision | Status |
|--------|--------|
| **Part 1: Local Proxy** at localhost:8080/v1 | ✓ |
| OpenAI-compatible endpoint for Continue.dev, Roo Code, Cline | ✓ |
| Token tracking (exact for routed providers) | ✓ |
| Silent failover on 429 (rate limit) | ✓ |
| **Part 2: Context Engine** (closed tools: Cursor, Copilot) | ✓ |
| Cmd+Shift+D → context.md in <2 seconds | ✓ |
| Local git scripts only (zero API cost) | ✓ |
| npx devflow → copies to clipboard → paste into Claude.ai | ✓ |
| Git diffs, stack detection, .cursor/rules, errors | ✓ |
| VS Code extension: snapshot, status bar, proxy start/stop | ✓ |
| **Free fallback** — Ollama (local, if running) | ✓ Added |

## ✓ Newly Added

| Vision | Status |
|--------|--------|
| **Dashboard** | `http://localhost:8080/dashboard` — token usage in browser |
| **One-click Connect** | DevFlow: Connect Continue.dev / Roo Code / Cline → writes config |

## ⏳ Partial / Coming Soon

| Vision | Current | Notes |
|--------|---------|-------|
| Amazon Q as always-free fallback | Placeholder | Needs AWS Builder ID integration |
| Codeium as always-free fallback | Placeholder | Needs Codeium API integration |
| One-key + free fallbacks = unlimited | Works with Ollama | Add `ollama run llama3.2` for local fallback |
| Progressive key nudges | ✓ Built | 90% → "Add API Key" in status bar + dashboard nudge |
| Session history (searchable context.md) | Not built | Pro tier feature |

## Core Insight (From Your Docs)

> "The routing is a utility. The context is the product."

DevFlow’s Context Engine (git + stack + rules + errors → context.md) is the moat. The proxy is the enabler for open-API tools. Both exist and work.

## UX Improvements (Shipped)

| Area | Change |
|------|--------|
| **Landing** | Two paths: "Just need context recovery?" vs "Need proxy routing?" — primary CTA = Copy & Try |
| **Landing** | First-run note: npx may take ~30s |
| **Landing** | GitHub stars badge (social proof) |
| **Get Started** | Cmd+Shift+D on button, progress checkmarks, Refresh button |
| **Get Started** | Unified theme: Inter font, dark vars (matches landing) |
| **Dashboard** | Auto-refresh every 10s, Last updated; Inter + design tokens |
| **Key add** | Follow-up: "Start Proxy" action after saving key |
| **Exhausted** | Clearer Ollama tip: "Open a new terminal and run: ollama run llama3.2" |
| **Snapshot** | No-workspace: "Open a folder first: File → Open Folder" |
| **Progressive nudges** | 90% → "Add API Key" in status bar toast; dashboard nudge banner |
| **Roo/Cline** | "Copy Manual Config" button with Base URL + API Key |

## OpenClaw Integration

| Feature | Status |
|---------|--------|
| **DevFlow OpenClaw plugin** | ✓ `openclaw-devflow/` — registers `devflow_context_snapshot` tool for AI handoff from OpenClaw agent |
| **OpenClaw as DevFlow provider** | ✓ Optional `openclaw` provider in proxy (DEVFLOW_OPENCLAW_URL/DEVFLOW_OPENCLAW_MODEL) |

## Next Priorities (To Match Vision)

1. **Ollama as free fallback** — ✓ Done.
2. **Dashboard** — ✓ Done. `http://localhost:8080/dashboard`
3. **One-click Connect** — ✓ Done. DevFlow: Connect Continue.dev / Roo Code / Cline
4. **Amazon Q / Codeium** — Integrate when APIs are stable.
