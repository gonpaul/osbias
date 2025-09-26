import OpenAI from 'openai';
import type { AIProvider, AIRequest } from './AIProvider';

export default class OpenAIClient implements AIProvider {
  private client: any;
  constructor(apiKey = process.env.OPENAI_API_KEY) {
    if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
    this.client = new OpenAI({ apiKey });
  }

  async complete({ prompt, system, maxTokens = 512 }: AIRequest): Promise<string> {
    const messages = [] as Array<{ role: 'system' | 'user'; content: string }>;
    if (system) messages.push({ role: 'system', content: system });
    messages.push({ role: 'user', content: prompt });

    const res = await this.client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: maxTokens,
    });
    return res.choices[0]?.message?.content ?? '';
  }
}


