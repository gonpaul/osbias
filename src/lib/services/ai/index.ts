import OpenAIClient from './OpenAIClient';
import ClaudeClient from './ClaudeClient';

export type ProviderName = 'openai' | 'claude';

export function getAI(provider: ProviderName = 'openai') {
  return provider === 'claude' ? new ClaudeClient() : new OpenAIClient();
}


