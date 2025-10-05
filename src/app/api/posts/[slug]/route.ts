import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getReactionCounts } from "@/models/post";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await db("posts").where({ slug }).first();
  if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (post.visibility !== "public") {
    // Only expose public posts via this route; private/unlisted require direct URL but are still readable
    if (post.visibility === "private") {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    // unlisted is allowed when slug known; proceed
  }

  try {
    await db("posts").where({ id: post.id }).update({ views: db.raw("views + 1") });
  } catch {}

  const author = await db("users").where({ id: post.author_id }).first();
  const counts = await getReactionCounts([post.id]);
  return NextResponse.json({
    id: post.id,
    slug: post.slug,
    title: post.title,
    content: post.content,
    visibility: post.visibility,
    author: author ? { id: author.id, name: author.name } : { id: post.author_id, name: null },
    created_at: post.created_at,
    updated_at: post.updated_at,
    reactions: counts.get(post.id) || { like: 0, dislike: 0 },
  });
}


