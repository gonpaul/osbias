import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import SidebarGate from '@/components/SidebarGate';
import ClientProviders from '@/components/ClientProviders';
import { locales, type Locale } from '@/i18n';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import type { User } from '@/models/user';
import { cookies } from 'next/headers';

type Props = {
  children: ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateMetadata() {
  return {
    title: 'Osbias',
    description: 'Tool designed to make people better thinkers',
  };
}

async function getMe() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return null;
    
    const payload = verifyToken(token);
    if (!payload) return null;
    
    const user = await db<User>('users').where({ id: payload.id }).first();
    return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null;
  } catch {
    return null;
  }
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages = await getMessages();
  const me = await getMe();

  return (
    <NextIntlClientProvider messages={messages}>
      <ClientProviders>
        <SidebarGate locale={locale} user={me} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </ClientProviders>
    </NextIntlClientProvider>
  );
}