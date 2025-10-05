import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthz } from '@/lib/authz';
import { createChatSession, getChatSessions } from '@/models/chat';

export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const sessions = await getChatSessions(user.id);
    return NextResponse.json(sessions);
  });
}

export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { name } = await req.json();
    if (!name || typeof name !== 'string') {
      return NextResponse.json({ error: 'Missing name' }, { status: 400 });
    }
    const session = await createChatSession(user.id, name);
    return NextResponse.json(session, { status: 201 });
  });
}


