export interface AIModel {
  id: string;
  name: string;
  description: string;
  provider: 'openai' | 'claude';
  capabilities: string[];
  maxTokens?: number;
}

export interface UserAIPreferences {
  provider: 'openai' | 'claude';
  model: string;
  maxTokens: number;
}

export type ProviderName = 'openai' | 'claude';
