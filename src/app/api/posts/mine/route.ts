import { NextRequest, NextResponse } from "next/server";
import { handleAuthz, requireAuth } from "@/lib/authz";
import db from "@/lib/db";
import { makeExcerpt } from "@/lib/text";

export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("page_size") || "10")));

    const rows = await db("posts")
      .where({ author_id: user.id })
      .orderBy("created_at", "desc")
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .select("id", "slug", "title", "content", "visibility", "created_at");

    const items = rows.map((r) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      visibility: r.visibility,
      excerpt: makeExcerpt(r.content),
      created_at: r.created_at,
    }));

    return NextResponse.json({ page, page_size: pageSize, items });
  });
}


