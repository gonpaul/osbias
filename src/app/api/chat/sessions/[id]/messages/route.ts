import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthz } from '@/lib/authz';
import { addMessage, getMessages, deleteMessages } from '@/models/chat';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
    }
    const messages = await getMessages(sessionId, user.id);
    return NextResponse.json(messages);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
    }
    const { role, content } = await req.json();
    if (!content || (role !== 'user' && role !== 'assistant')) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }
    const msg = await addMessage(sessionId, user.id, role, content);
    return NextResponse.json(msg, { status: 201 });
  });
}


export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { id } = await params;
    const sessionId = Number(id);
    if (!Number.isFinite(sessionId)) {
      return NextResponse.json({ error: 'Invalid session id' }, { status: 400 });
    }
    await deleteMessages(sessionId, user.id);
    return new NextResponse(null, { status: 204 });
  });
}

