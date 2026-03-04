# DevFlow AI

> "The routing is a utility. The context is the product."

DevFlow AI is a hybrid local proxy router and deterministic context engine that eliminates context loss when developers hit AI coding assistant limits.

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
4. Amazon Q (∞, when integrated)
5. Codeium (∞, when integrated)

At 90% capacity: warning logged. At 100%: automatic failover to next provider.

---

## Roadmap

- **Phase 2:** Context Engine (Cmd+Shift+D → context.md)
- **Phase 3:** Token dashboard & VS Code extension
