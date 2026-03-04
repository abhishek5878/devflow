/**
 * DevFlow AI - Provider Registry
 * Manages provider configurations with token tracking and priority
 */

import type { ProviderConfig, ProviderStatus } from '../types.js';

export function getDefaultProviders(env: NodeJS.ProcessEnv): ProviderConfig[] {
  const mockMode = env.DEVFLOW_MOCK_LIMITS === '1';
  // In mock mode: use fake providers that simulate 429 after low token counts
  if (mockMode) {
    return [
      {
        name: 'claude',
        key: 'mock',
        tokens: 0,
        limit: 100_000,
        baseUrl: 'http://mock',
        model: 'claude-sonnet-4',
        simulateLimitAfter: 80,
      },
      {
        name: 'gpt4',
        key: 'mock',
        tokens: 0,
        limit: 80_000,
        baseUrl: 'http://mock',
        model: 'gpt-4o',
        simulateLimitAfter: 500,
      },
    ];
  }

  const providers: ProviderConfig[] = [
    {
      name: 'claude',
      key: env.ANTHROPIC_KEY || null,
      tokens: 0,
      limit: 100_000,
      baseUrl: 'https://api.anthropic.com/v1',
      model: 'claude-sonnet-4-20250514',
    },
    {
      name: 'gpt4',
      key: env.OPENAI_KEY || null,
      tokens: 0,
      limit: 80_000,
      baseUrl: 'https://api.openai.com/v1',
      model: 'gpt-4o',
    },
    {
      name: 'gemini',
      key: env.GEMINI_KEY || null,
      tokens: 0,
      limit: 90_000,
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai',
      model: 'gemini-2.0-flash',
    },
    {
      name: 'amazon-q',
      key: null,
      tokens: 0,
      limit: Infinity,
      // Placeholder - integrates with AWS CodeWhisperer
    },
    {
      name: 'codeium',
      key: null,
      tokens: 0,
      limit: Infinity,
      // Placeholder - free tier API
    },
  ];

  return providers;
}

/** Get status based on token usage percentage */
export function getProviderStatus(config: ProviderConfig): ProviderStatus {
  if (config.limit === Infinity) return 'ok';
  const pct = (config.tokens / config.limit) * 100;
  if (pct >= 100) return 'exhausted';
  if (pct >= 90) return 'near_limit';
  return 'ok';
}

/** Get available providers sorted by priority (best paid first, then free) */
export function getAvailableProviders(
  providers: ProviderConfig[],
  statusFn: (p: ProviderConfig) => ProviderStatus
): ProviderConfig[] {
  return providers
    .filter((p) => p.key !== null && p.baseUrl) // Has API key and is configured
    .filter((p) => statusFn(p) !== 'exhausted')
    .sort((a, b) => {
      // Paid providers first (finite limit), then free (infinite)
      if (a.limit === Infinity && b.limit !== Infinity) return 1;
      if (a.limit !== Infinity && b.limit === Infinity) return -1;
      // Among paid: higher limit = higher priority
      return b.limit - a.limit;
    });
}
