import { NextRequest } from 'next/server';
import { getAI, type ProviderName } from '@/lib/services/ai';
import { getUserFromRequest } from '@/lib/auth';
import { resolveApiKeyForUser } from '@/lib/ai/keys';
import { checkAndConsume } from '@/lib/rateLimit';
import { getMessages } from '@/models/chat';

export const runtime = 'nodejs';

function buildTranscript(
  history: Array<{ role: 'user'|'assistant'; content: string }>,
  maxTurns = 10
): string {
  const turns = history.slice(-maxTurns);
  const lines = turns.map(m =>
    (m.role === 'user' ? 'User: ' : 'Assistant: ') + m.content
  );
  return lines.join('\n');
}

export async function POST(req: NextRequest) {
  const { provider = 'openai', model, prompt, system, maxTokens, sessionId } =
    await req.json();

  if (!prompt || typeof prompt !== 'string') {
    return new Response('Missing prompt', { status: 400 });
  }

  const user = await getUserFromRequest(req);
  if (!user) return new Response('Unauthorized', { status: 401 });

  const rl = await checkAndConsume(user);
  if (!rl.allowed) {
    const headers = new Headers();
    headers.set('Retry-After', Math.ceil((rl.retryAfterMs || 0) / 1000).toString());
    headers.set('X-RateLimit-Limit', 'user');
    headers.set('X-RateLimit-Remaining', '0');
    return new Response(JSON.stringify({ error: 'Rate limit exceeded' }), {
      status: 429,
      headers,
    });
  }

  const key = resolveApiKeyForUser(user, (provider as ProviderName) ?? 'openai');
  if (!key) return new Response('No API key configured', { status: 402 });

  const ai = getAI((provider as ProviderName) ?? 'openai', key);

  // Load recent history and build a transcript prefix
  let transcript = '';
  if (Number.isFinite(Number(sessionId))) {
    try {
      const rows = await getMessages(Number(sessionId), user.id);
      const history = rows.map(r => ({ role: r.role, content: r.content }));
      transcript = buildTranscript(history, 12); // last 12 turns (tune as needed)
    } catch {
      // ignore history on error
    }
  }

  const systemPrefix = system ? `System: ${system}\n` : '';
  const promptWithContext =
    `${systemPrefix}${transcript ? transcript + '\n' : ''}User: ${prompt}\nAssistant:`;

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const send = (data: unknown) => {
        const payload = typeof data === 'string' ? data : JSON.stringify(data);
        controller.enqueue(encoder.encode(`data: ${payload}\n\n`));
      };
      try {
        for await (const chunk of ai.streamComplete({
          prompt: promptWithContext,
          system,          // harmless; some providers ignore in completion mode
          maxTokens,
          model,
          stream: true
        })) {
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
      'X-Accel-Buffering': 'no',
      'X-RateLimit-Remaining': String(rl.remaining),
    }
  });
}


