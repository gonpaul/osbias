'use client';

import { NextIntlClientProvider } from 'next-intl';
import { ReactNode } from 'react';

type Props = {
  children: ReactNode;
  locale: string;
  messages: Record<string, unknown>;
};

export default function IntlProvider({ children, locale, messages }: Props) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages as any}>
      {children}
    </NextIntlClientProvider>
  );
}
