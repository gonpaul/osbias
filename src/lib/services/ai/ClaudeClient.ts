import Anthropic from '@anthropic-ai/sdk';
import type { AIProvider, AIRequest } from './AIProvider';

export default class ClaudeClient implements AIProvider {
  private client: Anthropic;
  constructor(apiKey = process.env.ANTHROPIC_API_KEY) {
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set');
    this.client = new Anthropic({ apiKey });
  }

  async complete({ prompt, system, maxTokens = 512 }: AIRequest): Promise<string> {
    const res = await this.client.messages.create({
      model: 'claude-3-5-sonnet-20240620',
      system,
      max_tokens: maxTokens,
      messages: [{ role: 'user', content: prompt }],
    });
    const content = res.content?.[0];
    if (content && content.type === 'text') return content.text;
    return '';
  }
}


