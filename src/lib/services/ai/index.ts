import OpenAIClient from './OpenAIClient';
import ClaudeClient from './ClaudeClient';
import OpenRouterClient from './OpenRouterClient';

export type ProviderName = 'openai' | 'claude' | 'openrouter';

export function getAI(provider: ProviderName = 'openai', apiKey?: string) {
  switch (provider) {
    case 'claude':
      return new ClaudeClient(apiKey);
    case 'openrouter':
      return new OpenRouterClient(apiKey);
    default:
      return new OpenAIClient(apiKey);
  }
}


