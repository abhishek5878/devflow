# Contributing to DevFlow AI

Thanks for your interest in contributing.

## Development Setup

```bash
git clone <repo-url>
cd devflow
npm install
npm run build
```

For extension development:
```bash
npm run ext:setup
# Open devflow-vscode in VS Code, press F5
```

## Project Structure

```
devflow/
├── src/                    # Core proxy + context engine
│   ├── index.ts            # Proxy server
│   ├── proxy.ts            # Provider routing, failover
│   ├── providers/          # Provider config
│   ├── context/            # Context engine (git, stack, rules)
│   └── cli/                # CLI entry point
├── devflow-vscode/         # VS Code extension
└── .github/workflows/      # CI
```

## Running Tests

```bash
npm test
```

Proxy failover test (requires proxy running):
```bash
DEVFLOW_MOCK_LIMITS=1 npm run dev   # terminal 1
npm run test:proxy                  # terminal 2
```

## Making Changes

1. Create a branch from `main`
2. Make your changes
3. Run `npm test` and ensure it passes
4. Submit a pull request

## Code Style

- TypeScript strict mode
- ESM modules (import/export)
- Prefer `const`/`let` over `var`

## Adding a New Provider

1. Add to `src/providers/index.ts` in `getDefaultProviders()`
2. Ensure `baseUrl` and `model` are set for OpenAI-compatible APIs
3. Add token tracking in `src/proxy.ts` (usage from API response)
4. Test with mock mode: set `simulateLimitAfter` to verify failover
