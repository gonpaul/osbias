import db from "@/lib/db";

export type PostVisibility = "public" | "unlisted" | "private";

export type Post = {
  id: number;
  author_id: number;
  entry_id: number | null;
  title: string;
  content: string;
  visibility: PostVisibility;
  slug: string;
  views?: number;
  created_at: string;
  updated_at: string;
};

export async function createPost(newPost: Omit<Post, "id" | "created_at" | "updated_at">): Promise<Post> {
  const [id] = await db<Post>("posts").insert(newPost);
  const created = await db<Post>("posts").where({ id }).first();
  if (!created) throw new Error("Failed to insert post");
  return created;
}

export async function getPublicPosts(page: number, pageSize: number, authorId?: number) {
  const q = db<Post>("posts")
    .where({ visibility: "public" })
    .orderBy("created_at", "desc")
    .offset((page - 1) * pageSize)
    .limit(pageSize);
  if (authorId) q.andWhere({ author_id: authorId });
  return q;
}

export async function getPostBySlug(slug: string) {
  return db<Post>("posts").where({ slug }).first();
}

export async function getMyPosts(authorId: number, page: number, pageSize: number) {
  return db<Post>("posts")
    .where({ author_id: authorId })
    .orderBy("created_at", "desc")
    .offset((page - 1) * pageSize)
    .limit(pageSize);
}

export async function getReactionCounts(postIds: number[]) {
  if (postIds.length === 0) return new Map<number, { like: number; dislike: number }>();
  const rows = await db('post_reactions')
    .select('post_id')
    .count({ cnt: '*' })
    .whereIn('post_id', postIds)
    .groupBy('post_id', 'reaction')
    .select('reaction');
  const map = new Map<number, { like: number; dislike: number }>();
  type ReactionRow = { post_id: number; cnt: string | number; reaction: 'like' | 'dislike' };
  for (const r of rows as ReactionRow[]) {
    const cur = map.get(r.post_id) || { like: 0, dislike: 0 };
    if (r.reaction === 'like') cur.like = Number(r.cnt);
    if (r.reaction === 'dislike') cur.dislike = Number(r.cnt);
    map.set(r.post_id, cur);
  }
  return map;
}

export async function setReaction(postId: number, userId: number, reaction: 'like' | 'dislike') {
  const existing = await db('post_reactions').where({ post_id: postId, user_id: userId }).first();
  if (!existing) {
    await db('post_reactions').insert({ post_id: postId, user_id: userId, reaction });
  } else {
    await db('post_reactions').where({ id: existing.id }).update({ reaction });
  }
  const counts = await getReactionCounts([postId]);
  return counts.get(postId) || { like: 0, dislike: 0 };
}

export async function getUserReaction(postId: number, userId: number) {
  const row = await db('post_reactions').where({ post_id: postId, user_id: userId }).first();
  return row ? (row.reaction as 'like' | 'dislike') : null;
}


