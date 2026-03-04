#!/usr/bin/env node
/**
 * DevFlow AI - Limit Exhaustion Test
 * Simulates hitting provider limits and verifies silent failover.
 *
 * Uses mock providers with simulateLimitAfter to trigger 429 without real API calls.
 * Run with: npm run test:limits
 *
 * For real failover test: set OPENAI_KEY and ANTHROPIC_KEY, use test-providers.
 */

import 'dotenv/config';

const ENDPOINT = process.env.DEVFLOW_ENDPOINT || 'http://localhost:8080/v1';
const API_KEY = process.env.DEVFLOW_API_KEY || 'devflow-local';

async function chat(messages: { role: string; content: string }[]) {
  const res = await fetch(`${ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages,
      max_tokens: 20,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(
      `HTTP ${res.status}: ${(data as { error?: { message?: string } })?.error?.message ?? res.statusText}`
    );
  }

  return data as {
    choices?: Array<{ message?: { content?: string } }>;
    model?: string;
  };
}

async function runLimitTest() {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║  DevFlow - Limit Exhaustion & Failover Test                  ║
╚══════════════════════════════════════════════════════════════╝

This test requires the server running with MOCK providers that
simulate 429 after a low token threshold.

Start the server with: DEVFLOW_MOCK_LIMITS=1 npm run dev

Then run: npm run test:limits

`);
  const res = await fetch(`${ENDPOINT}/health`, {
    headers: { Authorization: `Bearer ${API_KEY}` },
  }).catch(() => null);

  if (!res?.ok) {
    const health = await fetch(`${ENDPOINT}/health`).catch(() => null);
    if (!health?.ok) {
      console.error('❌ Server not reachable at', ENDPOINT);
      console.error('   Start with: npm run dev');
      process.exit(1);
    }
  }

  console.log('Sending requests to exhaust first provider...\n');

  const messages = [
    { role: 'user', content: 'Say "Request 1" only.' },
  ];

  for (let i = 1; i <= 5; i++) {
    try {
      messages[messages.length - 1] = {
        role: 'user',
        content: `Say "Request ${i}" only.`,
      };
      const data = await chat(messages);
      const content = data.choices?.[0]?.message?.content ?? '(no content)';
      const model = data.model ?? 'unknown';
      console.log(`  Request ${i}: ${model} → "${content.trim().slice(0, 40)}..."`);
      messages.push(
        { role: 'assistant', content },
        { role: 'user', content: 'Continue.' }
      );
    } catch (err) {
      console.error(`  Request ${i} failed:`, (err as Error).message);
    }
  }

  console.log('\n✅ Test complete. Check server logs for failover messages.\n');
}

runLimitTest().catch((err) => {
  console.error('Fatal:', err);
  process.exit(1);
});
