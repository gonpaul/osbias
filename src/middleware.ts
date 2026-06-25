import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed',
});

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Static assets — skip entirely
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|svg|ico|css|js|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Strip locale prefix for matching
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  const isLocalePrefixed = locales.includes(first as typeof locales[number]);
  const rawPath = isLocalePrefixed ? '/' + parts.slice(1).join('/') : pathname;

  const token = req.cookies.get('auth_token')?.value;

  // Auth routes — redirect to home if already logged in
  if ((rawPath === '/login' || rawPath === '/register' || rawPath.startsWith('/login/') || rawPath.startsWith('/register/')) && token) {
    const locale = isLocalePrefixed ? first : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/`, req.url));
  }

  // Protected routes — redirect to login if not authenticated
  const isProtected =
    rawPath === '/' ||
    rawPath.startsWith('/feed') ||
    rawPath.startsWith('/frameworks') ||
    rawPath.startsWith('/goals-system') ||
    rawPath.startsWith('/profile') ||
    rawPath.startsWith('/admin');

  if (isProtected && !token) {
    const locale = isLocalePrefixed ? first : defaultLocale;
    return NextResponse.redirect(new URL(`/${locale}/login`, req.url));
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
