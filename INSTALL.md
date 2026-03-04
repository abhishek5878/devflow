# DevFlow AI — Get Started in 3 Steps

## For Everyone (Context Snapshot)

**When Cursor, Claude Code, Copilot, or any AI hits a limit**, get back in seconds:

1. **Run** `npx github:abhishek5878/devflow` (copies to clipboard)
2. **Paste** into Claude.ai or any AI chat — resume exactly where you left off

**No install. No API keys. No setup. Just works.** First run may take ~30s (npx installs deps).

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

### Step 3: Connect your AI tool to DevFlow

After starting the proxy, click **Connect AI Tool** in the notification, or run Command Palette → "DevFlow: Connect Continue.dev / Roo Code / Cline" → select your tool. Then **reload the window** and select "DevFlow Router" from the model dropdown.

**Manual** — Edit your tool's config (e.g. `~/.continue/config.json`) to add:
```json
{
  "models": [{
    "provider": "openai",
    "apiBase": "http://localhost:8080/v1",
    "apiKey": "devflow-local"
  }]
}
```

**Dashboard** — Open `http://localhost:8080/dashboard` to see token usage.

---

## Need Help?

- Command Palette → **"DevFlow: Get Started"** for the full guide
- Status bar shows proxy status — click to open dashboard
- **Port in use?** Run `lsof -ti:8080 | xargs kill -9` or change port in settings
- **npx nothing happens?** Try `npx github:abhishek5878/devflow` (explicit). Or `DEVFLOW_DEBUG=1 npx ...` to see errors.
