'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import MarkdownContent from '@/components/common/MarkdownContent';

interface Post {
  id: number;
  slug: string;
  title: string;
  content: string;
  visibility: string;
  author?: { id: number; name: string };
  created_at: string;
  updated_at: string;
  reactions?: { like: number; dislike: number };
}

export default function PostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/posts/${slug}`, { credentials: 'include' })
      .then(res => res.ok ? res.json() : null)
      .then(data => setPost(data))
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <div className="max-w-4xl mx-auto px-8 py-16">Loading...</div>;
  if (!post) return <div className="max-w-4xl mx-auto px-8 py-16">Not found</div>;

  return (
    <article className="max-w-3xl mx-auto px-8 py-16">
      <header className="mb-12">
        <div className="h-1 w-16 bg-(--golden)/60 rounded-full mb-6" />
        <h1 className="text-4xl md:text-5xl font-bold leading-tight mb-4 text-(--foreground)">{post.title}</h1>
        <p className="text-(--secondary) text-base md:text-lg">{post.author?.name || 'Anonymous'} · {new Date(post.created_at).toLocaleDateString()}</p>
      </header>
      <div className="border-t border-(--secondary)/30 my-10" />
      <section className="prose prose-invert max-w-full">
        <MarkdownContent content={post.content} />
      </section>
    </article>
  );
}


