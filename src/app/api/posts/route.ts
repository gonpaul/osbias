import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/db";
import { getReactionCounts } from "@/models/post";
import { makeExcerpt } from "@/lib/text";

interface PostRow {
  id: number;
  slug: string;
  title: string;
  content: string;
  author_id: number;
  created_at: string;
}

interface PostWithScore extends PostRow {
  score: number;
  reactions: { like: number; dislike: number };
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const pageSize = Math.min(50, Math.max(1, parseInt(searchParams.get("page_size") || "10")));
  const authorId = searchParams.get("author_id") ? parseInt(searchParams.get("author_id") || "") : undefined;

  const sort = (searchParams.get("sort") || "top").toLowerCase();
  const q = db("posts").where({ visibility: "public" });
  if (authorId) q.andWhere({ author_id: authorId });
  
  let rows;
  if (sort === "recent") {
    q.orderBy("created_at", "desc");
    q.offset((page - 1) * pageSize).limit(pageSize);
    rows = await q.select("id", "slug", "title", "content", "author_id", "created_at");
  } else {
    // For "top" sorting, we need to calculate scores after getting reaction counts
    q.orderBy("created_at", "desc"); // Get recent posts first, then we'll sort by score
    const allRows = await q.select("id", "slug", "title", "content", "author_id", "created_at");
    
    // Get reaction counts for all posts
    const countsMap = await getReactionCounts(allRows.map((r: PostRow) => r.id));
    
    // Calculate Hacker News-style scores
    const now = Date.now();
    const postsWithScores: PostWithScore[] = allRows.map((row: PostRow) => {
      const reactions = countsMap.get(row.id) || { like: 0, dislike: 0 };
      const score = reactions.like - reactions.dislike;
      const ageInHours = (now - new Date(row.created_at).getTime()) / (1000 * 60 * 60);
      
      // Hacker News formula: score / (age + 2)^1.8
      const hnScore = score / Math.pow(ageInHours + 2, 1.8);
      
      return { ...row, score: hnScore, reactions };
    });
    
    // Sort by calculated score and take the requested page
    postsWithScores.sort((a: PostWithScore, b: PostWithScore) => b.score - a.score);
    rows = postsWithScores.slice((page - 1) * pageSize, page * pageSize);
  }
  const authors = await db("users").whereIn("id", rows.map((r: PostRow | PostWithScore) => r.author_id)).select("id", "name");
  const authorMap = new Map<number, { id: number; name: string | null }>();
  for (const a of authors) authorMap.set(a.id, { id: a.id, name: a.name || null });

  let items;
  if (sort === "recent") {
    // For recent sorting, we need to get reaction counts
    const countsMap = await getReactionCounts(rows.map((r: PostRow) => r.id));
    items = rows.map((r: PostRow) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: makeExcerpt(r.content),
      content: r.content,
      author: authorMap.get(r.author_id) || { id: r.author_id, name: null },
      created_at: r.created_at,
      reactions: countsMap.get(r.id) || { like: 0, dislike: 0 },
    }));
  } else {
    // For top sorting, reactions are already included in the rows
    items = rows.map((r: PostWithScore) => ({
      id: r.id,
      slug: r.slug,
      title: r.title,
      excerpt: makeExcerpt(r.content),
      content: r.content,
      author: authorMap.get(r.author_id) || { id: r.author_id, name: null },
      created_at: r.created_at,
      reactions: r.reactions,
    }));
  }

  return NextResponse.json({ page, page_size: pageSize, items });
}


