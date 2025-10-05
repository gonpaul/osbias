'use client';

import { useEffect, useMemo, useState } from 'react';

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
        setError('Failed to load templates');
      } finally {
        setLoading(false);
      }
    })();
  }, [isOpen, search, tag]);

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
    window.dispatchEvent(new CustomEvent('insert-text-at-cursor', { detail: { text: tpl.content } }));
    onClose();
  };

  const handleReplaceContent = (tpl: TemplateEntry) => {
    window.dispatchEvent(new CustomEvent('replace-current-content', { detail: { text: tpl.content } }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-center">
      <div className="bg-(--background) border border-(--secondary)/30 rounded-xl mt-20 w-full max-w-4xl mx-4">
        <div className="flex items-center justify-between p-4 border-b border-(--secondary)/20">
          <div className="text-lg font-semibold">Journal templates</div>
          <button
            onClick={onClose}
            className="px-2 py-1 rounded hover:bg-(--dark) transition-colors duration-300 cursor-pointer"
          >
            Close
          </button>
        </div>
        <div className="p-4 flex gap-3">
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="flex-1 px-3 py-2 bg-(--darkelbg) border border-(--secondary)/30 rounded focus:outline-none focus:border-(--emphasis)/50 transition-colors duration-300"
          />
          <input
            value={tag}
            onChange={e => setTag(e.target.value)}
            placeholder="Tag filter"
            className="w-60 px-3 py-2 bg-(--darkelbg) border border-(--secondary)/30 rounded focus:outline-none focus:border-(--emphasis)/50 transition-colors duration-300"
          />
        </div>
        <div className="p-4">
          {loading ? (
            <div className="text-(--secondary)">Loading…</div>
          ) : error ? (
            <div className="text-red-400">{error}</div>
          ) : templates.length === 0 ? (
            <div className="text-(--secondary)">No templates found.</div>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {templates.map(tpl => (
                <li key={tpl.id} className="rounded-lg border border-(--secondary)/30 bg-(--darkelbg) p-4 flex flex-col gap-3">
                  <div className="font-semibold">{tpl.title || 'Untitled template'}</div>
                  <div className="text-(--secondary) text-sm line-clamp-3 whitespace-pre-wrap break-words">{tpl.content}</div>
                  <div className="flex flex-wrap gap-2">
                    {(parsedTagsById.get(tpl.id) || []).map((tg, i) => (
                      <span key={i} className="px-2 py-0.5 text-xs rounded bg-(--emphasis)/20 text-(--emphasis)">{tg}</span>
                    ))}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <button
                      className="px-3 py-2 rounded border border-(--secondary)/30 hover:bg-(--dark) transition-colors duration-300 cursor-pointer"
                      onClick={() => handleInsertAtCursor(tpl)}
                    >Insert at cursor</button>
                    <button
                      className="px-3 py-2 rounded bg-(--emphasis) text-white hover:bg-(--emphasis)/80 transition-colors duration-300 cursor-pointer"
                      onClick={() => handleReplaceContent(tpl)}
                    >Replace content</button>
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


