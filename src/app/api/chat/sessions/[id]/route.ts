import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, handleAuthz } from '@/lib/authz';
import { deleteChatSession } from '@/models/chat';

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
    const deleted = await deleteChatSession(sessionId, user.id);
    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }
    return new NextResponse(null, { status: 204 });
  });
}


