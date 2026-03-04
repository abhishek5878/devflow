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
 * GET /favicon.ico - Avoid 404 when browser auto-requests it (icon is in HTML link)
 */
app.get('/favicon.ico', (_req, res) => res.status(204).end());

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
    let message = proxyErr.message || 'Internal server error';
    if (message.includes('All providers exhausted')) {
      message += ` Dashboard: http://localhost:${PORT}/dashboard`;
    }
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
 * GET /dashboard - Web dashboard (open in browser)
 */
app.get('/dashboard', (_req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>DevFlow Dashboard</title>
<link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'><rect width='32' height='32' rx='6' fill='%230a0a0a'/><text x='16' y='22' font-size='18' font-weight='bold' fill='%2322c55e' text-anchor='middle'>D</text></svg>">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0a;--surface:#141414;--text:#fafafa;--muted:#737373;--accent:#22c55e;--border:#262626}
*{box-sizing:border-box}
body{font-family:'Inter',system-ui,sans-serif;margin:24px;background:var(--bg);color:var(--text);-webkit-font-smoothing:antialiased}
h1{font-size:1.5rem;font-weight:600}
a{color:var(--accent);text-decoration:none}
a:hover{text-decoration:underline}
code{background:var(--surface);padding:2px 6px;border-radius:4px;font-size:0.9em}
table{border-collapse:collapse;width:100%;max-width:480px}
th,td{padding:10px 16px;text-align:left;border-bottom:1px solid var(--border)}
th{color:var(--muted);font-weight:500}
.ok{color:var(--accent)}.full{color:#ef4444}.warn{color:#f59e0b}
</style>
</head>
<body>
<h1>DevFlow Token Dashboard</h1>
<p><a href="/status">/status</a> &middot; Proxy: <code>http://localhost:${PORT}/v1</code></p>
<table><thead><tr><th>Provider</th><th>Used</th><th>Limit</th><th>Status</th></tr></thead>
<tbody id="t"></tbody></table>
<p id="updated" style="font-size:12px;color:#737373;margin-top:12px">Last updated: —</p>
<div id="nudge" style="display:none;margin-top:16px;padding:12px;background:var(--surface);border:1px solid var(--border);border-radius:8px;font-size:13px"></div>
<script>
function refresh(){
  fetch('/status').then(r=>r.json()).then(d=>{
    const t=d.providers||[];
    let nearLimit=false;
    document.getElementById('t').innerHTML=t.map(p=>{
      const u=p.tokens/1000|0;
      const lim=p.limit==='∞'?p.limit:(p.limit/1000|0)+'k';
      const pct=p.limit==='∞'?'—':((p.tokens/p.limit)*100|0)+'%';
      const s=p.available?'ok':'full';
      const c=s==='ok'?(pct!=='—'&&pct>90?'warn':'ok'):'full';
      if(pct!=='—'&&p.tokens/p.limit>0.9)nearLimit=true;
      return '<tr><td>'+p.name+'</td><td>'+u+'k</td><td>'+lim+'</td><td class="'+c+'">'+(s==='ok'?pct+' ✓':'Exhausted')+'</td></tr>';
    }).join('')||'<tr><td colspan="4">No providers. Add API keys and restart proxy.</td></tr>';
    document.getElementById('updated').textContent='Last updated: just now';
    const n=document.getElementById('nudge');
    if(nearLimit){n.style.display='block';n.innerHTML='⚠️ Provider near limit. Add another API key for stronger fallback: <strong>DevFlow: Add API Key</strong> in Command Palette.';}else{n.style.display='none';}
  }).catch(()=>{
    document.getElementById('t').innerHTML='<tr><td colspan="4">Proxy not responding. Start with: DevFlow: Start Proxy</td></tr>';
    document.getElementById('updated').textContent='Last updated: error';
    document.getElementById('nudge').style.display='none';
  });
}
refresh();
setInterval(refresh,10000);
</script>
</body>
</html>`);
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
      .filter((p) => p.baseUrl && (p.key || p.name === 'ollama'))
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
│  Dashboard: http://localhost:${PORT}/dashboard   │
│  Configure: apiBase → localhost:${PORT}/v1       │
│             apiKey → devflow-local               │
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
