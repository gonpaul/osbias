import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { ReactNode } from 'react';
import SidebarGate from '@/components/SidebarGate';
import ReduxProvider from '@/lib/redux/ReduxProvider';
import SessionBootstrap from '@/lib/redux/SessionBootstrap';
import ShortcutsHelp from '@/components/ShortcutsHelp';
import { locales, defaultLocale } from '@/i18n';

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

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;

  if (!locales.includes(locale as any)) {
    notFound();
  }

  const messages = await getMessages();

  return (
    <NextIntlClientProvider messages={messages}>
      <ReduxProvider>
        <SessionBootstrap />
        <ShortcutsHelp />
        <SidebarGate />
        <div className="flex-1 flex flex-col overflow-hidden">
          <main className="flex-1 overflow-x-hidden overflow-y-auto">
            {children}
          </main>
        </div>
      </ReduxProvider>
    </NextIntlClientProvider>
  );
}
