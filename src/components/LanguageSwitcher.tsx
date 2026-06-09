'use client';

import { useLocale } from 'next-intl';
import { usePathname } from 'next/navigation';
import { locales, type Locale } from '@/i18n';

export default function LanguageSwitcher() {
  const currentLocale = useLocale() as Locale;
  const pathname = usePathname();

  const switchLocale = (locale: Locale) => {
    document.cookie = `NEXT_LOCALE=${locale};path=/;max-age=31536000;SameSite=Lax`;
    // Strip current locale prefix and replace with new one
    const parts = pathname.split('/').filter(Boolean);
    if (parts.length > 0 && locales.includes(parts[0] as Locale)) {
      parts[0] = locale;
    } else {
      parts.unshift(locale);
    }
    window.location.href = '/' + parts.join('/');
  };

  return (
    <div className="flex items-center gap-1 rounded-lg bg-(--secondary)/20 px-1 py-0.5">
      {locales.map((l) => (
        <button
          key={l}
          onClick={() => switchLocale(l)}
          className={`px-2 py-1 text-sm rounded-md transition-colors duration-200 cursor-pointer ${
            l === currentLocale
              ? 'bg-(--darkelbg) text-(--foreground) font-medium'
              : 'text-(--secondary) hover:text-(--foreground) hover:bg-(--secondary)/20'
          }`}
        >
          {l.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
