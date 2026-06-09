import type { Metadata } from 'next';
import { headers } from 'next/headers';
import MarkdownContent from '@/components/common/MarkdownContent';

async function buildBaseUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || 'http';
  return host ? `${proto}://${host}` : '';
}

async function fetchPost(slug: string) {
  const base = await buildBaseUrl();
  const res = await fetch(`${base}/api/posts/${slug}`, { cache: 'no-store' });
  if (!res.ok) return null;
  return res.json();
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const post = await fetchPost(params.slug);
  if (!post) return { title: 'Post not found' };
  const description = (post.content || '').replace(/[#>*_`\-\[\]\(\)!]/g, ' ').slice(0, 140);
  const url = `${process.env.NEXT_PUBLIC_BASE_URL || ''}/p/${post.slug}`;
  return {
    title: post.title,
    description,
    openGraph: {
      title: post.title,
      description,
      url,
      type: 'article',
    },
    alternates: { canonical: url },
  };
}

export default async function PostPage({ params }: { params: { slug: string } }) {
  const post = await fetchPost(params.slug);
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


