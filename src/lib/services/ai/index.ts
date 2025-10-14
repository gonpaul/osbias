import OpenAIClient from './OpenAIClient';
import ClaudeClient from './ClaudeClient';

export type ProviderName = 'openai' | 'claude';

export function getAI(provider: ProviderName = 'openai', apiKey?: string) {
  return provider === 'claude' ? new ClaudeClient(apiKey) : new OpenAIClient(apiKey);
}


