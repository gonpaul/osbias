export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'claude' | 'openrouter';
  capabilities: string[];
  maxTokens?: number;
}

export interface UserAIPreferences {
  provider: 'openai' | 'claude' | 'openrouter';
  model: string;
  maxTokens: number;
}

export type ProviderName = 'openai' | 'claude' | 'openrouter';
