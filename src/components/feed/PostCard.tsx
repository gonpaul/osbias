'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaTrash } from 'react-icons/fa';
import MarkdownContent from '@/components/common/MarkdownContent';

type Author = { id: number; name: string | null };

type Props = {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content?: string;
  reactions?: { like: number; dislike: number };
  author: Author;
  created_at: string;
  currentUserId?: number;
  mine?: null | 'like' | 'dislike';
};

export default function PostCard({
  slug,
  title,
  excerpt,
  content,
  reactions,
  author,
  created_at,
  currentUserId,
  mine: initialMine,
}: Props) {
  const router = useRouter();
  const date = new Date(created_at).toLocaleDateString();
  const [expanded, setExpanded] = useState(false);
  const X = 100; // number of words for excerpt
  // Use server-provided excerpt (markdown stripped) for preview to avoid heading bleed
  const previewSource = excerpt || '';
  const words = previewSource.split(/\s+/).filter(Boolean);
  const short = words.slice(0, X).join(' ');
  const hasMore = words.length > X;
  const displayed = hasMore ? `${short} …` : short;
  const [likeCount, setLikeCount] = useState(reactions?.like ?? 0);
  const [dislikeCount, setDislikeCount] = useState(reactions?.dislike ?? 0);
  const [mine, setMine] = useState<null | 'like' | 'dislike'>(initialMine ?? null);
  const [voting, setVoting] = useState(false);
  const fullScore = likeCount - dislikeCount;
  const displayScore = (() => {
    const sign = fullScore < 0 ? '-' : '';
    const abs = Math.abs(fullScore);
    if (abs < 10000) return String(fullScore);
    return sign + String(abs).slice(0, 4);
  })();

  const sendReaction = async (reaction: 'like' | 'dislike') => {
    if (!currentUserId) return; // ignore when not logged in
    if (voting) return;
    const prevMine = mine;
    const prevLike = likeCount;
    const prevDislike = dislikeCount;

    // Toggle off if clicking the same reaction again
    if (prevMine === reaction) {
      if (!currentUserId) return;
      const prevLike = likeCount;
      const prevDislike = dislikeCount;
      const newLike = reaction === 'like' ? Math.max(0, prevLike - 1) : prevLike;
      const newDislike = reaction === 'dislike' ? Math.max(0, prevDislike - 1) : prevDislike;
      setMine(null);
      setLikeCount(newLike);
      setDislikeCount(newDislike);
      try {
        setVoting(true);
        const res = await fetch(`/api/posts/${slug}/reactions`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ reaction })
        });
        if (!res.ok) {
          // revert on failure
          setMine(prevMine);
          setLikeCount(prevLike);
          setDislikeCount(prevDislike);
          return;
        }
        const data = await res.json();
        if (typeof data.like === 'number') setLikeCount(data.like);
        if (typeof data.dislike === 'number') setDislikeCount(data.dislike);
        if (data.mine === 'like' || data.mine === 'dislike' || data.mine === null) setMine(data.mine);
      } finally {
        setVoting(false);
      }
      return;
    }

    // Apply optimistic change
    let nextLike = prevLike;
    let nextDislike = prevDislike;
    if (reaction === 'like') {
      nextLike += 1;
      if (prevMine === 'dislike') nextDislike -= 1;
    } else {
      nextDislike += 1;
      if (prevMine === 'like') nextLike -= 1;
    }
    setMine(reaction);
    setLikeCount(nextLike);
    setDislikeCount(nextDislike);

    try {
      setVoting(true);
      const res = await fetch(`/api/posts/${slug}/reactions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ reaction })
      });
      if (!res.ok) {
        // revert
        setMine(prevMine);
        setLikeCount(prevLike);
        setDislikeCount(prevDislike);
        return;
      }
      const data = await res.json();
      if (typeof data.like === 'number') setLikeCount(data.like);
      if (typeof data.dislike === 'number') setDislikeCount(data.dislike);
      if (data.mine === 'like' || data.mine === 'dislike' || data.mine === null) setMine(data.mine);
    } finally {
      setVoting(false);
    }
  };
  const canDelete = currentUserId && author && currentUserId === author.id;
  const [deleting, setDeleting] = useState(false);
  const onDelete = async () => {
    if (!confirm('Delete this post?')) return;
    try {
      setDeleting(true);
      const res = await fetch(`/api/posts/${slug}`, { method: 'DELETE', credentials: 'include' });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setDeleting(false);
    }
  };
  return (
    <article
      className="relative py-6 px-16 rounded-xl border-1 border-(--golden)/30 bg-(--darkelbg) pb-10 min-w-[300px] w-full max-w-[600px] max-h-[800px] shadow-sm hover:shadow-(--golden)/10 transition-shadow"
    >
      <div className="absolute right-6 top-4 flex items-center gap-3">
        {canDelete && (
          <button
            onClick={() => void onDelete()}
            disabled={deleting}
            className="text-red-400 hover:text-red-300 transition-colors duration-300 cursor-pointer disabled:opacity-60"
            title="Delete post"
          >
            <FaTrash className="w-6 h-6 me-3" />
          </button>
        )}
        <Link href={`/p/${slug}`} className="text-(--secondary) mt-2 hover:text-(--golden)" title="Open in new page">
          ↗
        </Link>
      </div>
      <div className="flex mt-10 h-full gap-4">
        <div className="flex-1 flex flex-col gap-4">
        <header className="space-y-2">
          <div className="h-1 w-14 bg-(--golden)/60 rounded-full" />
          <h2 className="text-2xl font-semibold leading-snug text-(--foreground)">
            <Link href={`/p/${slug}`} className="hover:text-(--golden) transition-colors">{title}</Link>
          </h2>
          <p className="text-sm text-(--secondary)">
            {author.name || 'Anonymous'} · {date}
          </p>
        </header>
          <section className="flex-1 w-full pb-5 max-h-full overflow-hidden">
            <div className="pr-2 overflow-hidden">
              {!expanded ? (
                <p className="text-(--foreground) text-base leading-relaxed whitespace-pre-wrap">
                  {displayed}
                </p>
              ) : (
                <MarkdownContent content={(content && content.length > 0 ? content : excerpt) || ''} />
              )}
            </div>
          </section>
          <footer className="pt-1">
            {hasMore && (
              <button
                onClick={() => setExpanded(!expanded)}
                className="text-(--golden) underline underline-offset-2 hover:opacity-80"
              >
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            )}
          </footer>
        </div>
        {/* Reactions panel outside on the left */}
        <div className="absolute -left-35 top-3/7">
          <div className="flex items-center gap-5 bg-(--panelbg, transparent) rounded-md">
            <div className="flex flex-col items-center -mb-0.5 select-none">
              <button
                className={`text-lg cursor-pointer ${mine === 'like' ? 'text-(--golden)' : 'text-(--secondary)'} hover:text-(--golden) transition-colors duration-300`}
                title="Upvote"
                disabled={voting}
                onClick={() => void sendReaction('like')}
              >
                ▲
              </button>
              <button
                className={`text-lg cursor-pointer ${mine === 'dislike' ? 'text-(--golden)' : 'text-(--secondary)'} hover:text-(--golden) transition-colors duration-300`}
                title="Downvote"
                disabled={voting}
                onClick={() => void sendReaction('dislike')}
              >
                ▼
              </button>
            </div>
            <div className="text-sm md:text-base font-semibold text-(--foreground) min-w-[4ch] text-start tabular-nums" title={fullScore.toLocaleString()}>
              {displayScore}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
}


