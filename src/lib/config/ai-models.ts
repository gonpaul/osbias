import type { AIModel } from '@/types/ai-preferences';

export const AI_MODELS: AIModel[] = [
  // OpenAI Models
  {
    id: 'gpt-4o-mini',
    name: 'GPT-4o Mini',
    description: 'Fast and cost-effective, good for most tasks',
    provider: 'openai',
    capabilities: ['text', 'reasoning', 'coding'],
    maxTokens: 128000
  },
  {
    id: 'gpt-4o',
    name: 'GPT-4o',
    description: 'Most capable model, best for complex reasoning',
    provider: 'openai',
    capabilities: ['text', 'reasoning', 'coding', 'analysis'],
    maxTokens: 128000
  },
  {
    id: 'gpt-4-turbo',
    name: 'GPT-4 Turbo',
    description: 'Balanced performance and cost',
    provider: 'openai',
    capabilities: ['text', 'reasoning', 'coding'],
    maxTokens: 128000
  },
  {
    id: 'gpt-3.5-turbo',
    name: 'GPT-3.5 Turbo',
    description: 'Fast and economical for simple tasks',
    provider: 'openai',
    capabilities: ['text', 'basic-reasoning'],
    maxTokens: 16384
  },
  
  // Claude Models
  {
    id: 'claude-opus-4-1-20250805',
    name: 'Claude Opus 4.1',
    description: 'Latest and most capable Claude model for complex reasoning',
    provider: 'claude',
    capabilities: ['text', 'reasoning', 'analysis', 'coding', 'creative', 'advanced-reasoning'],
    maxTokens: 200000
  },
  {
    id: 'claude-opus-4-20250514',
    name: 'Claude Opus 4',
    description: 'High-performance model for complex tasks and analysis',
    provider: 'claude',
    capabilities: ['text', 'reasoning', 'analysis', 'coding', 'creative'],
    maxTokens: 200000
  },
  {
    id: 'claude-sonnet-4-20250514',
    name: 'Claude Sonnet 4',
    description: 'Balanced performance, excellent for most tasks',
    provider: 'claude',
    capabilities: ['text', 'reasoning', 'analysis', 'coding'],
    maxTokens: 200000
  },
  {
    id: 'claude-3-7-sonnet-20250219',
    name: 'Claude 3.7 Sonnet',
    description: 'Enhanced Sonnet model with improved capabilities',
    provider: 'claude',
    capabilities: ['text', 'reasoning', 'analysis', 'coding'],
    maxTokens: 200000
  },
  {
    id: 'claude-3-5-haiku-20241022',
    name: 'Claude 3.5 Haiku',
    description: 'Fast and cost-effective, good for quick tasks',
    provider: 'claude',
    capabilities: ['text', 'basic-reasoning'],
    maxTokens: 200000
  },

  // OpenRouter Models
  {
    id: 'openrouter/auto',
    name: 'OpenRouter Auto',
    description: 'Automatically selects the best model for your request',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding', 'analysis'],
    maxTokens: 128000
  },
  {
    id: 'anthropic/claude-sonnet-4',
    name: 'Claude Sonnet 4 (via OpenRouter)',
    description: 'Balanced performance, excellent for most tasks',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'analysis', 'coding'],
    maxTokens: 200000
  },
  {
    id: 'anthropic/claude-3.5-haiku',
    name: 'Claude 3.5 Haiku (via OpenRouter)',
    description: 'Fast and cost-effective via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'basic-reasoning'],
    maxTokens: 200000
  },
  {
    id: 'openai/gpt-4o',
    name: 'GPT-4o (via OpenRouter)',
    description: 'Most capable OpenAI model via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding', 'analysis'],
    maxTokens: 128000
  },
  {
    id: 'openai/gpt-4o-mini',
    name: 'GPT-4o Mini (via OpenRouter)',
    description: 'Fast and cost-effective via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding'],
    maxTokens: 128000
  },
  {
    id: 'google/gemini-2.5-pro',
    name: 'Gemini 2.5 Pro (via OpenRouter)',
    description: 'Google\'s most capable model via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding', 'analysis', 'multimodal'],
    maxTokens: 1000000
  },
  {
    id: 'google/gemini-2.5-flash',
    name: 'Gemini 2.5 Flash (via OpenRouter)',
    description: 'Fast and cost-effective Google model via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding'],
    maxTokens: 1000000
  },
  {
    id: 'deepseek/deepseek-r1',
    name: 'DeepSeek R1 (via OpenRouter)',
    description: 'Advanced reasoning model, competitive with o1',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding', 'analysis', 'advanced-reasoning'],
    maxTokens: 65536
  },
  {
    id: 'deepseek/deepseek-chat',
    name: 'DeepSeek Chat (via OpenRouter)',
    description: 'General-purpose chat model via OpenRouter',
    provider: 'openrouter',
    capabilities: ['text', 'reasoning', 'coding'],
    maxTokens: 65536
  }
];

export const DEFAULT_AI_PREFERENCES = {
  provider: 'openai' as const,
  model: 'gpt-4o-mini',
  maxTokens: 512
};

export function getModelsByProvider(provider: 'openai' | 'claude' | 'openrouter'): AIModel[] {
  return AI_MODELS.filter(model => model.provider === provider);
}

export function getModelById(id: string): AIModel | undefined {
  return AI_MODELS.find(model => model.id === id);
}
