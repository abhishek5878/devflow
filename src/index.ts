/**
 * DevFlow AI - Local Proxy Router
 * OpenAI-compatible endpoint at localhost:8080/v1
 */

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import {
  getDefaultProviders,
  getAvailableProviders,
} from './providers/index.js';
import { proxyChatCompletion } from './proxy.js';
import { getProviderStatus } from './providers/index.js';

const PORT = parseInt(process.env.DEVFLOW_PORT || '8080', 10);
const providers = getDefaultProviders(process.env);

const app = express();
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  if (req.path.startsWith('/v1')) {
    console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  }
  next();
});

/**
 * GET /v1/models - List models (required by some clients like Continue.dev)
 */
app.get('/v1/models', (_req, res) => {
  const active = providers.find(
    (p) => p.key && p.baseUrl && getProviderStatus(p) !== 'exhausted'
  );
  res.json({
    object: 'list',
    data: [
      {
        id: active?.model || 'gpt-4o',
        object: 'model',
        created: Date.now(),
        owned_by: 'devflow',
      },
    ],
  });
});

/**
 * POST /v1/chat/completions - Main proxy endpoint
 */
app.post('/v1/chat/completions', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({
      error: { message: 'Missing or invalid Authorization header', type: 'auth' },
    });
  }

  const body = req.body as Record<string, unknown>;
  if (!body.messages || !Array.isArray(body.messages)) {
    return res.status(400).json({
      error: { message: 'Missing messages array', type: 'invalid_request' },
    });
  }

  try {
    const result = await proxyChatCompletion(
      providers,
      body,
      (from, to, reason) => {
        console.log(`[DevFlow] Failover: ${from} → ${to} (${reason})`);
      },
      (provider, tokens) => {
        const p = providers.find((x) => x.name === provider);
        if (p) {
          const status = getProviderStatus(p);
          if (status === 'near_limit') {
            console.log(
              `[DevFlow] ⚠️ ${provider} at ${Math.round((tokens / p.limit) * 100)}% capacity`
            );
          }
        }
      }
    );

    res.json(result.response);
  } catch (err) {
    const proxyErr = err as { status?: number; message?: string; provider?: string };
    const status = proxyErr.status || 500;
    const message = proxyErr.message || 'Internal server error';
    console.error(`[DevFlow] Error (${proxyErr.provider || 'unknown'}):`, message);
    res.status(status).json({
      error: { message, type: 'api_error', provider: proxyErr.provider },
    });
  }
});

/**
 * GET /v1/health - Provider status (for status bar / dashboard)
 */
app.get('/v1/health', (_req, res) => {
  const status = providers.map((p) => ({
    name: p.name,
    status: getProviderStatus(p),
    tokens: p.tokens,
    limit: p.limit === Infinity ? '∞' : p.limit,
    available: !!(p.key && (p.baseUrl || p.limit === Infinity)),
  }));
  res.json({ providers: status });
});

/**
 * GET /status - VS Code extension status (active provider, token usage)
 */
app.get('/status', (_req, res) => {
  const available = getAvailableProviders(providers, getProviderStatus);
  const active = available[0];

  const tokenUsage = active
    ? {
        provider: active.name,
        used: active.tokens,
        limit: active.limit,
      }
    : null;

  res.json({
    running: true,
    activeProvider: active?.name ?? 'none',
    tokenUsage,
    providers: providers
      .filter((p) => p.key && p.baseUrl)
      .map((p) => ({
        name: p.name,
        tokens: p.tokens,
        limit: p.limit === Infinity ? '∞' : p.limit,
        available: getProviderStatus(p) !== 'exhausted',
      })),
  });
});

const server = app.listen(PORT, () => {
  console.log(`
┌─────────────────────────────────────────────────┐
│  DevFlow AI - Local Proxy Router                │
│  OpenAI-compatible: http://localhost:${PORT}/v1   │
│                                                 │
│  Configure your IDE:                            │
│    ai.endpoint: http://localhost:${PORT}/v1      │
│    ai.apiKey: devflow-local (or any key)       │
└─────────────────────────────────────────────────┘
`);
});

server.on('error', (err: NodeJS.ErrnoException) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`
[DevFlow] Port ${PORT} is already in use. Either:
  1. Stop the existing proxy: lsof -ti:${PORT} | xargs kill -9
  2. Use a different port: DEVFLOW_PORT=8081 npm run dev
`);
  } else {
    console.error('[DevFlow] Server error:', err.message);
  }
  process.exit(1);
});
