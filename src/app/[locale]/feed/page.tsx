'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';
import { PostAnswer } from '@/types';
import PostCard from '@/components/feed/PostCard';
import FeedClient from '@/components/feed/FeedClient';

type Search = {
  page?: string;
  author_id?: string;
  page_size?: string;
};

async function fetchFeed(page: number, pageSize: number, authorId?: number) {
  const qs = new URLSearchParams();
  qs.set('page', String(page));
  qs.set('page_size', String(pageSize));
  if (authorId) qs.set('author_id', String(authorId));
  const res = await fetch(`/api/posts?${qs.toString()}`, {
    cache: 'no-store',
    credentials: 'include',
  });
  if (!res.ok) throw new Error('Failed to load feed');
  return res.json();
}

async function getMe() {
  const res = await fetch('/api/auth/me', { credentials: 'include' });
  if (!res.ok) return null;
  return res.json();
}

export default function FeedPage({ searchParams }: { searchParams: Promise<Search> }) {
  const t = useTranslations('Feed');
  const [sp, setSp] = useState<Search>({});
  const [data, setData] = useState<{ items: PostAnswer[] } | null>(null);
  const [me, setMe] = useState<{ id: number } | null>(null);

  useEffect(() => {
    searchParams.then(setSp);
  }, [searchParams]);

  useEffect(() => {
    const authorId = sp?.author_id ? parseInt(sp.author_id) : undefined;
    fetchFeed(1, 6, authorId).then(setData);
    getMe().then(setMe);
  }, [sp?.author_id]);

  if (!data) return <div className="max-w-3xl mx-auto ps-4 py-8 pe-34">{t('loading')}</div>;

  const authorId = sp?.author_id ? parseInt(sp.author_id) : undefined;
  const pageSize = 6;

  return (
    <div className="max-w-3xl mx-auto ps-4 py-8 pe-34">
      <h1 className="text-2xl font-bold text-center mb-6">{t('title')}</h1>
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
              title={t('allPosts')}
            >
              {t('allPosts')}
            </Link>
            <Link
              href={`/feed?page=1&page_size=${pageSize}&author_id=${me.id}`}
              className={
                `px-4 py-1 rounded-full text-sm transition-colors duration-300 ` +
                `${authorId ? 'bg-(--panelbg) text-(--foreground) border border-(--golden)/40' :
                  'text-(--secondary) hover:text-(--golden)'}`
              }
              title={t('myPosts')}
            >
              {t('myPosts')}
            </Link>
          </div>
        </div>
      )}

      {authorId ? (
        <>
          <div className="flex flex-col justify-center items-center relative border-l-0 border-r-1 border-(--secondary)/40 px-10 space-y-4">
            {data.items.map((p: PostAnswer) => (
              <PostCard key={p.id} {...p} currentUserId={me?.id ?? undefined} />
            ))}
            {data.items.length === 0 && (
              <p className="text-(--muted)">{t('noPosts')}</p>
            )}
          </div>
        </>
      ) : (
        <FeedClient
          initialItems={data.items || []}
          initialPage={1}
          pageSize={pageSize}
          authorId={authorId}
          currentUserId={me?.id ?? undefined}
        />
      )}
    </div>
  );
}
