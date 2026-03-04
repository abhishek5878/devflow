#!/usr/bin/env node
/**
 * DevFlow AI - Test Client
 * Simple client to verify proxy connectivity and basic completion
 */

const ENDPOINT = process.env.DEVFLOW_ENDPOINT || 'http://localhost:8080/v1';
const API_KEY = process.env.DEVFLOW_API_KEY || 'devflow-local';

async function testChat() {
  console.log(`\n🔵 DevFlow Test Client`);
  console.log(`   Endpoint: ${ENDPOINT}`);
  console.log(`   Sending test request...\n`);

  const res = await fetch(`${ENDPOINT}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: JSON.stringify({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: 'Reply with exactly: DevFlow proxy is working.',
        },
      ],
      max_tokens: 50,
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    console.error('❌ Error:', res.status, err);
    process.exit(1);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data?.choices?.[0]?.message?.content ?? '(no content)';
  console.log('✅ Response:', content);
  console.log('\n');
}

testChat().catch((err) => {
  console.error('Fatal:', err.message);
  if (err.cause?.code === 'ECONNREFUSED') {
    console.error('\n  Is the DevFlow server running? Start with: npm run dev');
  }
  process.exit(1);
});
