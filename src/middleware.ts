import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import createMiddleware from 'next-intl/middleware';
import { defaultLocale, locales } from '@/i18n';

const intlMiddleware = createMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'always',
});

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // --- Determine route type ---

  // API routes and static assets — skip i18n middleware entirely
  if (pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname === '/favicon.ico' ||
    /\.(png|jpg|svg|ico|css|js|woff2?|ttf)$/.test(pathname)) {
    return NextResponse.next();
  }

  // Strip locale prefix for easier matching
  const parts = pathname.split('/').filter(Boolean);
  const first = parts[0] ?? '';
  const isLocalePrefixed = locales.includes(first as typeof locales[number]);
  const rawPath = isLocalePrefixed ? '/' + parts.slice(1).join('/') : pathname;

  // Public routes — accessible to guests without auth
  const isPublicRoute =
    rawPath.startsWith('/feed') ||
    rawPath.startsWith('/p/') ||
    rawPath.startsWith('/docs');

  // Auth routes — login/register (accessible to guests)
  const isAuthRoute =
    rawPath.startsWith('/login') ||
    rawPath.startsWith('/register');

  // --- Access control ---

  const token = req.cookies.get('auth_token')?.value;

  // No auth needed for public and auth routes
  if (isPublicRoute || isAuthRoute) {
    return intlMiddleware(req);
  }

  // Everything else requires authentication
  if (!token) {
    const locale = isLocalePrefixed ? first : defaultLocale;
    const loginUrl = new URL(`/${locale}/login`, req.url);
    return NextResponse.redirect(loginUrl);
  }

  return intlMiddleware(req);
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
