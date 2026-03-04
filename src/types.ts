/**
 * DevFlow AI - Type definitions
 * OpenAI-compatible API types for proxy compatibility
 */

export interface ProviderConfig {
  name: string;
  key: string | null;
  tokens: number;
  limit: number;
  /** Base URL for OpenAI-compatible API (OpenAI, Anthropic, etc.) */
  baseUrl?: string;
  /** Model ID to use for this provider */
  model?: string;
  /** In test mode: return 429 after this many requests */
  simulateLimitAfter?: number;
}

export interface UsageInfo {
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
}

export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: { role: string; content: string | null };
    finish_reason: string;
  }>;
  usage?: UsageInfo;
}

export type ProviderStatus = 'ok' | 'near_limit' | 'exhausted';

export interface ProviderState {
  config: ProviderConfig;
  status: ProviderStatus;
  requestCount: number;
}
