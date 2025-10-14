import { NextRequest, NextResponse } from 'next/server';
import { handleAuthz, requireAuth } from '@/lib/authz';
import { getReactionCounts, getUserReaction, setReaction } from '@/models/post';
import db from '@/lib/db';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleAuthz(async () => {
    const { slug } = await params;
    const post = await db('posts').where({ slug }).first();
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const postId = post.id as number;
    const counts = await getReactionCounts([postId]);
    const data = counts.get(postId) || { like: 0, dislike: 0 };
    return NextResponse.json(data);
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { slug } = await params;
    const post = await db('posts').where({ slug }).first();
    if (!post) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    const postId = post.id as number;
    const { reaction } = await req.json();
    if (!['like', 'dislike'].includes(reaction)) {
      return NextResponse.json({ error: 'Invalid reaction' }, { status: 400 });
    }
    const counts = await setReaction(postId, user.id, reaction);
    const mine = await getUserReaction(postId, user.id);
    return NextResponse.json({ ...counts, mine });
  });
}


