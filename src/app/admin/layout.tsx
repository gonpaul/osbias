'use client';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/auth/me', {
          credentials: 'include',
        });
        if (!res.ok) {
          setIsAdmin(false);
          return;
        }
        const me = await res.json();
        setIsAdmin(me.role === 'admin');
      } catch {
        setIsAdmin(false);
      }
    })();
  }, []);

  if (isAdmin === null) {
    return <div className="p-6">Loading…</div>;
  }
  if (!isAdmin) {
    return (
      <div className="p-6">
        <p>Forbidden. Admins only.</p>
        <p>
          <Link className="underline" href="/">Go back</Link>
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--background) text-(--foreground)">
      <header className="px-6 py-4 border-b border-(--secondary)/30 bg-(--darkelbg) sticky top-0 z-40">
        <div className="max-w-[min(94vw,1400px)] mx-auto flex items-center justify-between">
          <h1 className="text-xl font-semibold">Admin</h1>
          {/* <nav className="flex gap-4">
            <Link className="px-3 py-2 rounded-md border border-(--secondary)/30 hover:border-(--golden)/50 transition-colors cursor-pointer" href="/admin/users">Users</Link>
          </nav> */}
        </div>
      </header>
      <main className="px-4 md:px-[4vw] lg:px-[6vw] py-6 max-w-[min(94vw,1400px)] mx-auto">{children}</main>
    </div>
  );
}


