import OpenAI from 'openai';
import type { AIProvider, AIRequest, AIResponseChunk } from './AIProvider';

export default class OpenAIClient implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    this.client = new OpenAI({ apiKey });
  }

  async complete({ prompt, system, maxTokens = 512, model = "gpt-4o-mini" }: AIRequest): Promise<string> {
    const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await this.client.chat.completions.create({
      model: model,
      messages,
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? '';
  }

  async *streamComplete({ prompt, system, maxTokens = 512, model = "gpt-4o-mini" }: AIRequest): AsyncIterable<AIResponseChunk> {
    const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const stream = await this.client.chat.completions.create({
      model: model,
      messages,
      max_tokens: maxTokens,
      stream: true,
    });

    // openai v5 streams are async iterables of events
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
      'gpt-4o-mini',
      'gpt-4o',
      'gpt-4-turbo',
      'gpt-3.5-turbo'
    ];
  }
}


