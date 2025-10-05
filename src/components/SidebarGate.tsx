'use client';

import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

const AUTH_PREFIXES = [
//   '/auth',
  '/login',
//   '/signin',
//   '/signup',
  '/register',
//   '/forgot-password',
//   '/reset-password',
//   '/verify-email',
];

export default function SidebarGate() {
  const pathname = usePathname();

  const isAuthRoute = AUTH_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (isAuthRoute) return null;

  return <Sidebar />;
}


