import type { User } from '@/models/user';

export type Provider = 'openai' | 'claude' | 'openrouter';

export function resolveApiKeyForUser(u: User, provider: Provider): string | null {
  if (u.role === 'admin' || u.is_test_user) {
    if (provider === 'openai') return process.env.OPENAI_API_KEY ?? null;
    if (provider === 'claude') return process.env.ANTHROPIC_API_KEY ?? null;
    if (provider === 'openrouter') return process.env.OPENROUTER_API_KEY ?? null;
    return null;
  }
  if (provider === 'openai') return u.openai_api_key ?? null;
  if (provider === 'claude') return u.anthropic_api_key ?? null;
  if (provider === 'openrouter') return u.openrouter_api_key ?? null;
  return null;
}


