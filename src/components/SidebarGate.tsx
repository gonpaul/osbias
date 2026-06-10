'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';
import { type Locale, locales } from '@/i18n';

const AUTH_PATHS = ['/login', '/register'];

export default function SidebarGate() {
  const pathname = usePathname();

  // Strip locale prefix to get the raw path
  const parts = pathname?.split('/').filter(Boolean) ?? [];
  const first = parts[0] ?? '';
  const isLocale = locales.includes(first as Locale);
  const rawPath = isLocale ? '/' + parts.slice(1).join('/') : pathname;

  const isAuthRoute = AUTH_PATHS.some((p) => rawPath?.startsWith(p));
  if (isAuthRoute) return null;

  return <Sidebar />;
}
