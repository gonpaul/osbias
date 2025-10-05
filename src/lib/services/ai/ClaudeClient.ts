import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIRequest, AIResponseChunk } from './AIProvider';

export default class ClaudeClient implements AIProvider {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private client: any;
  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    this.client = new Anthropic({ apiKey });
  }

  async complete({ prompt, system, maxTokens = 512, model = 'claude-3-7-sonnet-20250219' }: AIRequest): Promise<string> {
    const res = await this.client.messages.create({
      model: model,
      system,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content?.[0];
    if (content && content.type === 'text') return content.text;
    return '';
  }

  async *streamComplete({ prompt, system, maxTokens = 512, model = 'claude-3-7-sonnet-20250219' }: AIRequest): AsyncIterable<AIResponseChunk> {
    const stream = await this.client.messages.stream({
      model: model,
      system,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });

    for await (const event of stream) {
      if (event.type === 'message_start') continue;
      if (event.type === 'message_delta') continue;
      if (event.type === 'message_stop') break;
      if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
        const text = event.delta.text ?? '';
        if (text) yield { text };
      }
    }
    yield { text: '', done: true };
  }

  getAvailableModels(): string[] {
    return [
      'claude-opus-4-1-20250805',
      'claude-opus-4-20250514',
      'claude-sonnet-4-20250514',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-haiku-20241022',
    ];
  }
}


