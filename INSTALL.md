# DevFlow AI — Get Started in 3 Steps

## For Everyone (Context Snapshot)

**When Cursor, Claude Code, Copilot, or any AI hits a limit**, get back in seconds:

1. **Run** `npx devflow` (copies to clipboard)
2. **Paste** into Claude.ai or any AI chat — resume exactly where you left off

**No install. No API keys. No setup. Just works.**

Using the extension? Press `Cmd+Shift+D` (Mac) or `Ctrl+Shift+D` (Windows) instead.

Works with: **Cursor** · **Claude Code** · **GitHub Copilot** · any AI coding assistant

---

## For Proxy Users (Continue.dev, Roo Code, Cline)

Route through multiple AI providers with automatic failover when one hits its limit:

### Step 1: Add your API key

- Open Command Palette (`Cmd+Shift+P` / `Ctrl+Shift+P`)
- Type **"DevFlow: Add API Key"**
- Choose OpenAI or Anthropic → paste your key (stored securely)
- Add at least one key

### Step 2: Start the proxy

- Command Palette → **"DevFlow: Start Proxy"**
- Status bar shows: `DevFlow → Claude | 0k/100k`

### Step 3: Point your AI tool at DevFlow

**Continue.dev** — Edit `~/.continue/config.json`:
```json
{
  "models": [{
    "provider": "openai",
    "apiBase": "http://localhost:8080/v1",
    "apiKey": "devflow-local"
  }]
}
```

**Other tools** — Use:
- Endpoint: `http://localhost:8080/v1`
- API key: `devflow-local`

---

## Need Help?

- Command Palette → **"DevFlow: Get Started"** for the full guide
- Status bar shows proxy status — click to open dashboard
- **Port in use?** Run `lsof -ti:8080 | xargs kill -9` or change port in settings
