import { NextResponse } from 'next/server';
import { getAI, type ProviderName } from '@/lib/services/ai';

/**
 * @swagger
 * /api/ai:
 *   post:
 *     summary: Get AI completion from the selected provider
 *     description: Returns a completion from OpenAI or Claude based on the prompt and system instructions.
 *     tags:
 *       - AI
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [openai, claude]
 *                 default: openai
 *                 description: The AI provider to use.
 *               model:
 *                 type: string
 *                 description: Optional model identifier to use for the completion.
 *               prompt:
 *                 type: string
 *                 description: The user prompt for the AI.
 *               system:
 *                 type: string
 *                 description: Optional system prompt for the AI.
 *               maxTokens:
 *                 type: integer
 *                 description: Maximum number of tokens in the response.
 *             required:
 *               - prompt
 *     responses:
 *       200:
 *         description: AI completion result
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 text:
 *                   type: string
 *                   description: The AI-generated completion.
 *       400:
 *         description: Missing or invalid prompt
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

export async function POST(req: Request) {
  try {
    const { provider = 'openai', model, prompt, system, maxTokens } = await req.json();
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Missing prompt' }, { status: 400 });
    }
    const ai = getAI((provider as ProviderName) ?? 'openai');
    const text = await ai.complete({ prompt, system, maxTokens, model });
    return NextResponse.json({ text });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Server error' }, { status: 500 });
  }
}
