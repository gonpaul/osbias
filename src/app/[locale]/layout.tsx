import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import SidebarGate from '@/components/SidebarGate';
import ClientProviders from '@/components/ClientProviders';
import { locales, type Locale } from '@/i18n';

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

async function fetchMe() {
  try {
    const res = await fetch('/api/auth/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
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
  const me = await fetchMe();

  const pathname = `/${locale}`;

  return (
    <NextIntlClientProvider messages={messages}>
      <ClientProviders>
        <SidebarGate locale={locale} pathname={pathname} user={me} />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </ClientProviders>
    </NextIntlClientProvider>
  );
}
