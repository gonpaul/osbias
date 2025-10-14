import { NextRequest, NextResponse } from "next/server";
import { handleAuthz, requireAuth } from "@/lib/authz";
import db from "@/lib/db";
import { uniquePostSlugFromTitle } from "@/lib/text";
import type { Post, PostVisibility } from "@/models/post";
import { rateLimitOk, rateLimitRemaining } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  return handleAuthz(async () => {
    const user = await requireAuth(req);
    if (!user.allow_posting) {
      return NextResponse.json({ error: "Posting not allowed" }, { status: 403 });
    }

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "ip:unknown";
    const key = `publish:${user.id}:${ip}`;
    const limit = 10;
    const windowMs = 60_000;
    if (!rateLimitOk(key, limit, windowMs)) {
      const { resetIn } = rateLimitRemaining(key, limit, windowMs);
      return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429, headers: { "Retry-After": String(Math.ceil(resetIn / 1000)) } });
    }

    const body = await req.json();
    const { entry_id, title, visibility }: { entry_id: number; title?: string; visibility: PostVisibility } = body;
    const validVis = ["public", "unlisted", "private"] as const;
    if (!entry_id || (visibility && !validVis.includes(visibility))) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const entry = await db("journal_entries").where({ id: entry_id, user_id: user.id }).first();
    if (!entry) return NextResponse.json({ error: "Entry not found" }, { status: 404 });

    const finalTitle = (title && String(title).trim()) || entry.title || "Untitled";
    if (finalTitle.length > 240) {
      return NextResponse.json({ error: "Title too long" }, { status: 400 });
    }

    const slug = await uniquePostSlugFromTitle(finalTitle);
    const newPost: Omit<Post, "id" | "created_at" | "updated_at"> = {
      author_id: user.id,
      entry_id: entry.id,
      title: finalTitle,
      content: entry.content,
      visibility: visibility ?? "public",
      slug,
    };

    const [id] = await db<Post>("posts").insert(newPost);
    const created = await db<Post>("posts").where({ id }).first();
    return NextResponse.json(created, { status: 201 });
  });
}


