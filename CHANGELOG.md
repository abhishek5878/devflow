# Changelog

All notable changes to this project will be documented in this file.

## [0.1.0] - 2026-03-04

### Added

**Phase 1: Local Proxy Router**
- OpenAI-compatible `/v1/chat/completions` endpoint
- Multi-provider routing (Claude, GPT-4, Gemini)
- Token tracking from API responses
- Silent failover on HTTP 429
- `/v1/models`, `/v1/health`, `/status` endpoints
- Configurable port via `DEVFLOW_PORT`
- Mock mode for testing (`DEVFLOW_MOCK_LIMITS=1`)

**Phase 2: Context Engine**
- Git history scanner (diffs, commits, uncommitted)
- Stack detection (Node.js, Go, Rust, Python, Ruby)
- Project rules auto-detection (7 locations)
- Error capture (logs + TypeScript check)
- Project structure scanner
- Markdown generator with "For the Next AI"
- CLI: `npx devflow snapshot` with `--skip-tsc` and `--output`

**Phase 3: VS Code Extension**
- Cmd+Shift+D / Ctrl+Shift+D to generate context
- Status bar with live token usage
- Token dashboard webview
- Start/Stop Proxy commands
- 90% capacity toast notification
- Settings: `skipTypeCheck`, `proxyPort`, `contextOutputPath`

**Infrastructure**
- GitHub Actions CI
- Full test suite
- INSTALL.md, CONTRIBUTING.md
