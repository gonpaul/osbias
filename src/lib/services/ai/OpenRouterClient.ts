import OpenAI from 'openai';
import type { AIProvider, AIRequest, AIResponseChunk } from './AIProvider';

export default class OpenRouterClient implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  constructor(apiKey = process.env.OPENROUTER_API_KEY) {
    if (!apiKey) throw new Error('OPENROUTER_API_KEY is not set');
    this.client = new OpenAI({
      apiKey,
      baseURL: 'https://openrouter.ai/api/v1',
      defaultHeaders: {
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        'X-Title': 'Osbias',
      },
    });
  }

  async complete({ prompt, system, maxTokens = 512, model = 'openrouter/auto' }: AIRequest): Promise<string> {
    const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? '';
  }

  async *streamComplete({ prompt, system, maxTokens = 512, model = 'openrouter/auto' }: AIRequest): AsyncIterable<AIResponseChunk> {
    const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model,
      messages,
      max_tokens: maxTokens,
      stream: true,
    });

    for await (const event of stream) {
      const delta = event?.choices?.[0]?.delta?.content;
      if (delta) {
        yield { text: delta };
      }
    }
    yield { text: '', done: true };
  }

  getAvailableModels(): string[] {
    return [
      'openrouter/auto',
      'anthropic/claude-sonnet-4',
      'anthropic/claude-3.5-haiku',
      'openai/gpt-4o',
      'openai/gpt-4o-mini',
      'google/gemini-2.5-pro',
      'google/gemini-2.5-flash',
      'meta-llama/llama-4-maverick',
      'deepseek/deepseek-r1',
      'deepseek/deepseek-chat',
    ];
  }
}
