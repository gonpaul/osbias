'use client';

import { useEffect, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { emitUIEvent } from '@/lib/uiEvents';
import { FaSearch } from 'react-icons/fa';

type TemplateEntry = {
  id: number;
  title: string;
  content: string;
  tags: string | null;
};

export default function JournalTemplatesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const t = useTranslations('Editor');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [templates, setTemplates] = useState<TemplateEntry[]>([]);
  const [search, setSearch] = useState('');
  const [tag, setTag] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    void (async () => {
      setLoading(true);
      setError('');
      try {
        const qs = new URLSearchParams();
        if (search.trim()) qs.set('q', search.trim());
        if (tag.trim()) qs.set('tag', tag.trim());
        const res = await fetch(`/api/journal/templates?${qs.toString()}`, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to fetch templates');
        const data = await res.json();
        setTemplates(data as TemplateEntry[]);
      } catch {
        setError(t('loadError'));
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, search, tag, t]);

  const parsedTagsById = useMemo(() => {
    const map = new Map<number, string[]>();
    for (const t of templates) {
      try {
        const arr = t.tags ? JSON.parse(t.tags) : [];
        map.set(t.id, Array.isArray(arr) ? arr : []);
      } catch {
        map.set(t.id, []);
      }
    }
    return map;
  }, [templates]);

  const handleInsertAtCursor = (tpl: TemplateEntry) => {
    emitUIEvent('insert-text-at-cursor', { text: tpl.content });
    onClose();
  };

  const handleReplaceContent = (tpl: TemplateEntry) => {
    emitUIEvent('replace-current-content', { text: tpl.content });
    onClose();
  };

  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-(--darkelbg) rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-(--secondary)/30">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-(--foreground)">{t('journalTemplates')}</h2>
            </div>
            <button
              onClick={onClose}
              className="text-(--secondary) hover:text-(--foreground) text-2xl transition-colors duration-300 cursor-pointer"
            >
              ×
            </button>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-[1fr_240px] gap-3">
            <div className="relative">
              <FaSearch className="absolute left-5 top-1/2 transform -translate-y-1/2 text-(--secondary)" />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder={t('searchTemplates')}
                className="w-full pl-16 pr-4 py-3 bg-(--background) border border-(--secondary)/30 rounded-lg text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
              />
            </div>
            <input
              value={tag}
              onChange={e => setTag(e.target.value)}
              placeholder={t('tagFilter')}
              className="px-4 py-3 bg-(--background) border border-(--secondary)/30 rounded-lg text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
            />
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[70vh]">
          {loading ? (
            <div className="text-(--secondary)">{t('loading')}</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : templates.length === 0 ? (
            <div className="text-(--secondary)">{t('noTemplates')}</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {templates.map(tpl => (
                <li key={tpl.id} className="bg-(--background) rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 transition-all duration-300 hover:shadow-lg hover:shadow-(--golden)/10 p-6 flex flex-col gap-3">
                  <div className="font-semibold text-(--foreground)">{tpl.title || t('untitledTemplate')}</div>
                  <div className="text-(--secondary) text-sm line-clamp-3 whitespace-pre-wrap break-words flex-1">{tpl.content}</div>
                  <div className="flex flex-wrap gap-2">
                    {(parsedTagsById.get(tpl.id) || []).map((tg, i) => (
                      <span key={i} className="px-2 py-1 text-xs bg-(--emphasis)/20 text-(--emphasis-light) rounded-full">{tg}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-4 py-2 rounded-lg border border-(--secondary)/30 hover:border-(--golden)/50 text-(--foreground) transition-colors duration-300 cursor-pointer"
                      onClick={() => handleInsertAtCursor(tpl)}
                    >{t('insertAtCursor')}</button>
                    <button
                      className="px-4 py-2 rounded-lg bg-(--emphasis) text-white hover:bg-(--emphasis)/80 transition-colors duration-300 cursor-pointer"
                      onClick={() => handleReplaceContent(tpl)}
                    >{t('replaceContent')}</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
