import { getRequestConfig } from 'next-intl/server';
import { notFound } from 'next/navigation';

export const locales = ['en', 'ru'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'en';

export default getRequestConfig(async ({ requestLocale }) => {
  const locale = (await requestLocale) ?? defaultLocale;

  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  const messages =
    locale === 'ru'
      ? (await import('../locales/ru.json')).default
      : (await import('../locales/en.json')).default;

  return { locale, messages };
});
