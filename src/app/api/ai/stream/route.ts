import { NextRequest } from 'next/server';
import { getAI, type ProviderName } from '@/lib/services/ai';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const { provider = 'openai', model, prompt, system, maxTokens } = await req.json();
  if (!prompt || typeof prompt !== 'string') {
    return new Response('Missing prompt', { status: 400 });
  }

  const ai = getAI((provider as ProviderName) ?? 'openai');

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };
      try {
        for await (const chunk of ai.streamComplete({ prompt, system, maxTokens, model, stream: true })) {
          if (chunk.text) send({ text: chunk.text });
          if (chunk.done) send({ done: true });
        }
      } catch (err) {
        send({ error: err instanceof Error ? err.message : 'stream_error' });
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no'
    }
  });
}


