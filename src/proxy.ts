/**
 * DevFlow AI - Proxy Router
 * Forwards OpenAI-format requests to providers with failover on 429
 */

import OpenAI from 'openai';
import type { ProviderConfig, UsageInfo } from './types.js';
import { getProviderStatus, getAvailableProviders } from './providers/index.js';

export interface ProxyResult {
  response: unknown;
  provider: string;
  usage?: UsageInfo;
}

export interface ProxyError extends Error {
  status?: number;
  provider?: string;
}

/**
 * Execute chat completion via the best available provider.
 * Fails over to next provider on 429 (rate limit).
 */
export async function proxyChatCompletion(
  providers: ProviderConfig[],
  body: Record<string, unknown>,
  onProviderSwitch?: (from: string, to: string, reason: string) => void,
  onTokenUpdate?: (provider: string, tokens: number) => void
): Promise<ProxyResult> {
  const available = getAvailableProviders(providers, getProviderStatus);

  if (available.length === 0) {
    const ollamaTip =
      ' Open a new terminal and run: ollama run llama3.2 (free local fallback).';
    throw new Error(
      'All providers exhausted. Add API keys or wait for reset.' + ollamaTip
    );
  }

  const tryProvider = async (
    provider: ProviderConfig,
    attemptIndex: number
  ): Promise<ProxyResult> => {
    if (!provider.key || !provider.baseUrl) {
      throw new Error(`Provider ${provider.name} has no API key or base URL`);
    }

    // Test mode: simulate 429 after N tokens - trigger failover instead of throwing
    if (
      typeof provider.simulateLimitAfter === 'number' &&
      provider.tokens >= provider.simulateLimitAfter
    ) {
      provider.tokens = provider.limit;
      const next = available[attemptIndex + 1];
      if (next) {
        onProviderSwitch?.(
          provider.name,
          next.name,
          'Simulated rate limit (429)'
        );
        return tryProvider(next, attemptIndex + 1);
      }
      const err = new Error('All providers exhausted (simulated)') as ProxyError;
      err.status = 429;
      err.provider = provider.name;
      throw err;
    }

    // Mock provider: return fake completion without network call
    const isMock = provider.key === 'mock' || provider.baseUrl?.startsWith('http://mock');
    if (isMock) {
      const lastMsg = (body.messages as { role: string; content: string }[]).at(-1);
      const content = lastMsg?.content ?? 'OK';
      const usage = { prompt_tokens: 20, completion_tokens: 10, total_tokens: 30 };
      provider.tokens += usage.total_tokens;
      onTokenUpdate?.(provider.name, provider.tokens);
      return {
        response: {
          id: `devflow-mock-${Date.now()}`,
          object: 'chat.completion',
          created: Math.floor(Date.now() / 1000),
          model: provider.model || 'gpt-4o',
          choices: [
            {
              index: 0,
              message: { role: 'assistant', content: `[${provider.name}] Echo: ${content.slice(0, 50)}` },
              finish_reason: 'stop',
            },
          ],
          usage,
        },
        provider: provider.name,
        usage,
      };
    }

    const client = new OpenAI({
      apiKey: provider.key,
      baseURL: `${provider.baseUrl.replace(/\/$/, '')}/`,
    });

    const model = (body.model as string) || provider.model || 'gpt-4o';
    const messages = body.messages as OpenAI.Chat.ChatCompletionMessageParam[];
    const options = {
      model,
      messages,
      stream: body.stream as boolean | undefined,
      temperature: body.temperature as number | undefined,
      max_tokens: body.max_tokens as number | undefined,
    };

    try {
      const completion = await client.chat.completions.create(
        options as OpenAI.Chat.ChatCompletionCreateParamsNonStreaming
      );

      // Extract usage from response (exact token count)
      const usage = (completion as { usage?: UsageInfo }).usage;
      if (usage) {
        provider.tokens += usage.total_tokens;
        onTokenUpdate?.(provider.name, provider.tokens);
      }

      return {
        response: completion,
        provider: provider.name,
        usage,
      };
    } catch (err) {
      // OpenAI SDK APIError has .status; other clients may use .response.status
      const e = err as {
        status?: number;
        response?: { status?: number };
        message?: string;
      };
      const status = e?.status ?? e?.response?.status;
      const is429 =
        status === 429 ||
        (e?.message?.toLowerCase().includes('rate limit') ?? false) ||
        (e?.message?.includes('429') ?? false);

      if (is429) {
        // Mark as exhausted for this session
        provider.tokens = provider.limit;
        const next = available[attemptIndex + 1];
        if (next && onProviderSwitch) {
          onProviderSwitch(
            provider.name,
            next.name,
            'Rate limit exceeded (429)'
          );
          return tryProvider(next, attemptIndex + 1);
        }
      }

      // Connection errors (e.g. Ollama not running): try next provider
      const isConnError =
        (e?.message?.includes('ECONNREFUSED') ?? false) ||
        (e?.message?.includes('fetch failed') ?? false);
      if (isConnError) {
        const next = available[attemptIndex + 1];
        if (next) {
          onProviderSwitch?.(
            provider.name,
            next.name,
            'Unavailable (connection failed)'
          );
          return tryProvider(next, attemptIndex + 1);
        }
      }

      const proxyErr = new Error(
        (err as Error).message || 'Provider request failed'
      ) as ProxyError;
      proxyErr.status = status ?? 500;
      proxyErr.provider = provider.name;
      throw proxyErr;
    }
  };

  return tryProvider(available[0], 0);
}
