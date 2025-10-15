import { NextRequest, NextResponse } from "next/server";
import { handleAuthz, requireAuth, requireRole } from "@/lib/authz";
import db from "@/lib/db";

type Visibility = "public" | "unlisted" | "private";

export async function GET(req: NextRequest) {
  return handleAuthz(async () => {
    const authUser = await requireAuth(req);
    requireRole(authUser, "admin");

    const { searchParams } = new URL(req.url);
    const q = (searchParams.get("q") || "").trim();
    const visibility = searchParams.get("visibility");
    const authorId = searchParams.get("author_id");
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
    const offset = (page - 1) * limit;

    let query = db("posts").select(
      "id",
      "author_id",
      "entry_id",
      "title",
      "visibility",
      "slug",
      "views",
      "created_at",
      "updated_at"
    );

    if (q) {
      query = query.where((qb) => {
        qb.whereILike("title", `%${q}%`).orWhereILike("content", `%${q}%`).orWhereILike("slug", `%${q}%`);
      });
    }
    if (visibility === "public" || visibility === "unlisted" || visibility === "private") {
      query = query.andWhere({ visibility });
    }
    if (authorId) {
      const idNum = parseInt(authorId);
      if (!Number.isNaN(idNum)) query = query.andWhere({ author_id: idNum });
    }

    const [rows, [{ count }]] = await Promise.all([
      query.clone().orderBy("created_at", "desc").limit(limit).offset(offset),
      db("posts").count<{ count: number }>("id as count").first().then((r) => [r || { count: 0 }]),
    ]);

    return NextResponse.json({ page, limit, total: Number(count || 0), rows });
  });
}


