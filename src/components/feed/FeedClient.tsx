'use client';

import { useState } from 'react';
import PostCard from '@/components/feed/PostCard';
import type { PostAnswer } from '@/types';

type Props = {
  initialItems: PostAnswer[];
  initialPage: number;
  pageSize: number;
  authorId?: number;
  currentUserId?: number;
};

export default function FeedClient({ initialItems, initialPage, pageSize, authorId, currentUserId }: Props) {
  const [items, setItems] = useState<PostAnswer[]>(initialItems || []);
  const [page, setPage] = useState<number>(initialPage);
  const [loading, setLoading] = useState(false);
  const [hasNext, setHasNext] = useState<boolean>((initialItems || []).length >= pageSize);

  const loadMore = async () => {
    if (loading || !hasNext) return;
    setLoading(true);
    try {
      const nextPage = page + 1;
      const qs = new URLSearchParams();
      qs.set('page', String(nextPage));
      qs.set('page_size', String(pageSize));
      if (authorId) qs.set('author_id', String(authorId));
      const res = await fetch(`/api/posts?${qs.toString()}`, {
        cache: 'no-store',
        credentials: 'include',
      });
      if (!res.ok) return;
      const data = await res.json();
      const newItems: PostAnswer[] = Array.isArray(data.items) ? data.items : [];
      setItems((prev) => prev.concat(newItems));
      setPage(nextPage);
      setHasNext(newItems.length >= pageSize);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-center items-center relative border-l-0 border-r-1 border-(--secondary)/40 px-10 space-y-4">
        {items.map((p) => (
          <PostCard key={p.id} {...p} currentUserId={currentUserId} />
        ))}
        {items.length === 0 && (
          <p className="text-(--muted)">No posts yet.</p>
        )}
      </div>
      <div className="flex justify-center mt-8">
        <button
          onClick={() => void loadMore()}
          disabled={!hasNext || loading}
          className={
            `px-4 py-2 rounded border-1 border-(--secondary) transition-colors cursor-pointer duration-300 hover:bg-(--darkelbg) ` +
            `${!hasNext ? 'opacity-50 pointer-events-none' : ''}`
          }
        >
          {loading ? 'Loading…' : 'Load'}
        </button>
      </div>
    </>
  );
}


