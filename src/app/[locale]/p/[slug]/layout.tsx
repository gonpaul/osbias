import type { Metadata } from 'next';
import { headers } from 'next/headers';

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

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = await fetchPost(slug);
  if (!post) return { title: 'Post not found' };
  const description = (post.content || '').replace(/[#>*_`\\-\\[\\]\\(\\)!]/g, ' ').slice(0, 140);
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

export default function PostLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
