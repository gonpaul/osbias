'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { onUIEvent } from '@/lib/uiEvents';

export default function ShortcutsHelp() {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Shortcuts');

  useEffect(() => {
    const off = onUIEvent('toggle-shortcuts-help', () => setOpen(v => !v));
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey, true);
    return () => off();
  }, []);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <div className="bg-(--darkelbg) rounded-lg max-w-xl w-full overflow-hidden border border-(--secondary)/30">
        <div className="p-5 border-b border-(--secondary)/30 flex items-center justify-between">
          <div className="text-lg font-semibold text-(--foreground)">{t('title')}</div>
          <button className="text-(--secondary) hover:text-(--foreground) text-xl cursor-pointer" onClick={() => setOpen(false)}>×</button>
        </div>
        <div className="p-5 text-sm text-(--foreground)">
          <div className="mb-4">
            <div className="text-(--secondary) mb-2">{t('editor')}</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <span>{t('openChat')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Ctrl</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">K</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span>{t('paraphrase')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Ctrl</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">D</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">P</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span>{t('biasCheck')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Ctrl</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">D</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">C</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span>{t('templateChooser')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Ctrl</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">D</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">J</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span>{t('vimMode')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Alt</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">V</span>
                </span>
              </li>
              <li className="flex items-center gap-3">
                <span>{t('togglePreview')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Alt</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">P</span>
                </span>
              </li>
            </ul>
          </div>
          <div>
            <div className="text-(--secondary) mb-2">{t('help')}</div>
            <ul className="space-y-2">
              <li className="flex items-center gap-3">
                <span>{t('toggleHelp')}</span>
                <span className="flex items-center gap-1 text-(--secondary)">
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">Ctrl</span>
                  <span>+</span>
                  <span className="px-2 py-1 bg-(--background) border border-(--secondary)/30 rounded">/</span>
                </span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
