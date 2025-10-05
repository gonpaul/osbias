import db from "@/lib/db";

export function baseSlugify(input: string): string {
  const s = input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return s || "post";
}

export async function uniquePostSlugFromTitle(title: string): Promise<string> {
  const base = baseSlugify(title);
  let slug = base;
  let suffix = 2;
  // Check collisions in posts.slug
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await db("posts").where({ slug }).first();
    if (!exists) return slug;
    slug = `${base}-${suffix++}`;
  }
}

export function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/\[[^\]]*\]\([^\)]*\)/g, " ")
    .replace(/^>\s?/gm, "")
    .replace(/^#+\s+/gm, "")
    .replace(/[*_~`>#-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function makeExcerpt(md: string, maxLen = 240): string {
  const plain = stripMarkdown(md);
  if (plain.length <= maxLen) return plain;
  const slice = plain.slice(0, maxLen - 1);
  const lastSpace = slice.lastIndexOf(" ");
  return (lastSpace > 32 ? slice.slice(0, lastSpace) : slice).trim() + "…";
}


