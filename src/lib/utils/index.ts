import { headers } from "next/headers";

// Server-side only, for server components/routes
export async function buildBaseUrl() {
  const h = await headers();
  const host = h.get('x-forwarded-host') || h.get('host') || '';
  const proto = h.get('x-forwarded-proto') || 'http';
  return host ? `${proto}://${host}` : '';
}

// Server-side only, for server components/routes
export async function fetchMe() {
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
