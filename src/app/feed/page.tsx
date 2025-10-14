import Link from 'next/link';
import { headers } from 'next/headers';
import PostCard from '@/components/feed/PostCard';
import { PostAnswer } from '@/types';

type Search = {
  page?: string;
  author_id?: string;
  page_size?: string;
};

async function buildBaseUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || 'http';
  return host ? `${proto}://${host}` : '';
}

async function fetchFeed(
  page: number,
  pageSize: number,
  authorId?: number
 ) {
  const base = await buildBaseUrl();
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('page_size', String(pageSize));
  if (authorId) qs.set('author_id', String(authorId));
  const res = await fetch(`${base}/api/posts?${qs.toString()}`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load feed');
  return res.json();
}

async function fetchMe() {
  const base = await buildBaseUrl();
  try {
    const h = await headers();
    const cookie = h.get('cookie') || '';
    const res = await fetch(`${base}/api/auth/me`, {
      cache: 'no-store',
      headers: cookie ? { cookie } : undefined,
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as { id: number; name: string | null };
  } catch {
    return null;
  }
}

export default async function FeedPage({
  searchParams,
}: {
  searchParams: Promise<Search>;
}) {
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp?.page || '1'));
  const pageSize = Math.min(
    50,
    Math.max(1, parseInt(sp?.page_size || '10'))
  );
  const authorId = sp?.author_id ? parseInt(sp.author_id) : undefined;

  const data = await fetchFeed(page, pageSize, authorId);
  const me = await fetchMe();

  const prevParams = new URLSearchParams();
  prevParams.set('page', String(Math.max(1, page - 1)));
  prevParams.set('page_size', String(pageSize));
  if (authorId) prevParams.set('author_id', String(authorId));

  const nextParams = new URLSearchParams();
  nextParams.set('page', String(page + 1));
  nextParams.set('page_size', String(pageSize));
  if (authorId) nextParams.set('author_id', String(authorId));

  const hasNext = Array.isArray(data.items) && data.items.length >= pageSize;

  return (
    <div className="max-w-3xl mx-auto ps-4 py-8 pe-34">
      <h1 className="text-2xl font-bold text-center mb-6">Public Feed</h1>
      {me && (
        <div className="flex justify-center mb-6">
          <div className="inline-flex items-center rounded-full border border-(--secondary)/30 bg-(--darkelbg) p-1">
            <Link
              href={`/feed?page=1&page_size=${pageSize}`}
              className={
                `px-4 py-1 rounded-full text-sm transition-colors duration-300 ` +
                `${authorId ? 'text-(--secondary) hover:text-(--golden)' :
                  'bg-(--panelbg) text-(--foreground) border border-(--golden)/40'}`
              }
              title="All public posts"
            >
              Feed
            </Link>
            <Link
              href={`/feed?page=1&page_size=${pageSize}&author_id=${me.id}`}
              className={
                `px-4 py-1 rounded-full text-sm transition-colors duration-300 ` +
                `${authorId ? 'bg-(--panelbg) text-(--foreground) border border-(--golden)/40' :
                  'text-(--secondary) hover:text-(--golden)'}`
              }
              title="Only my posts"
            >
              My Posts
            </Link>
          </div>
        </div>
      )}
      <div className="flex flex-col justify-center items-center relative border-l-0 border-r-1 border-(--secondary)/40 px-10 space-y-4">
        {data.items.map((p: PostAnswer) => (
          <PostCard key={p.id} {...p} currentUserId={me?.id ?? undefined} />
        ))}
        {data.items.length === 0 && (
          <p className="text-(--muted)">No posts yet.</p>
        )}
      </div>
      <div className="flex justify-center mt-8">
        <Link
          href={`/feed?${nextParams.toString()}`}
          className={
            `px-4 py-2 rounded border-1 border-(--secondary) ` +
            `${!hasNext ? 'opacity-50 pointer-events-none' : ''}`
          }
        >
          Load
        </Link>
      </div>
    </div>
  );
}


