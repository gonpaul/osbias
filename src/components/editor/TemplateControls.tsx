'use client';

import { useEffect, useState } from 'react';

type CurrentEntryDetail = { id: number | null; title: string; content: string };

export default function TemplateControls() {
  const [entryId, setEntryId] = useState<number | null>(null);
  const [isTemplate, setIsTemplate] = useState(false);
  const [tagsText, setTagsText] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<CurrentEntryDetail>;
      setEntryId(ce.detail.id);
    };
    window.addEventListener('current-entry-response', handler);
    window.dispatchEvent(new CustomEvent('request-current-entry'));
    return () => window.removeEventListener('current-entry-response', handler);
  }, []);

  const handleSave = async () => {
    if (!entryId) {
      setMsg('No entry selected');
      return;
    }
    setSaving(true);
    setMsg(null);
    try {
      const tags = tagsText
        .split(',')
        .map(t => t.trim())
        .filter(Boolean);
      const res = await fetch(`/api/journal/${entryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ is_template: isTemplate, tags })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update template settings');
      }
      setMsg('Saved');
      setTimeout(() => setMsg(null), 1500);
    } catch (e: any) {
      setMsg(e?.message || 'Failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full mt-3 p-3 rounded-lg border border-(--secondary)/30 bg-(--darkelbg)">
      <div className="flex flex-wrap items-center gap-3">
        <label className="inline-flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isTemplate}
            onChange={(e) => setIsTemplate(e.target.checked)}
            className="w-5 h-5 text-(--golden) bg-(--background) border-(--secondary)/30 rounded focus:ring-(--golden)"
          />
          <span className="text-(--foreground)">Save as template</span>
        </label>
        <input
          type="text"
          value={tagsText}
          onChange={(e) => setTagsText(e.target.value)}
          placeholder="tags (comma separated)"
          className="flex-1 min-w-[220px] px-3 py-2 bg-(--background) border border-(--secondary)/30 rounded-md text-(--foreground) placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
        />
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 bg-(--emphasis) text-white rounded-md hover:bg-(--emphasis)/80 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-300 cursor-pointer"
        >
          {saving ? 'Saving...' : 'Save'}
        </button>
        {msg && <span className="text-(--secondary)">{msg}</span>}
      </div>
    </div>
  );
}


