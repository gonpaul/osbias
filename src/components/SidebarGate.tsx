'use client';

import { useEffect, useState } from 'react';
import Sidebar from '@/components/Sidebar';
import { usePathname } from 'next/navigation';

const AUTH_PATHS = ["/login", "/register"];

type SidebarUser = {
  id: number;
  name?: string | null;
  nickname?: string | null;
  email?: string;
  picture?: string | null;
  role?: "user" | "admin";
} | null;

type Props = {
  locale: string;
  user: SidebarUser;
};

export default function SidebarGate({ locale, user: initialUser }: Props) {
  const pathname = usePathname();
  const [user, setUser] = useState(initialUser);

  // Sync user state when auth changes (login/logout)
  useEffect(() => {
    let cancelled = false;
    fetch("/api/auth/me", { credentials: "include" })
      .then(res => res.ok ? res.json() : null)
      .then(data => { if (!cancelled) setUser(data); })
      .catch(() => { if (!cancelled) setUser(null); });
    return () => { cancelled = true; };
  }, [pathname]);

  if (!user) return null;

  const isAuthRoute = AUTH_PATHS.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (isAuthRoute) return null;

  return <Sidebar locale={locale} pathname={pathname} user={user} />;
}
