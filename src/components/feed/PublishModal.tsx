'use client';

import { useMemo, useState } from 'react';
import MarkdownContent from '@/components/common/MarkdownContent';

type Visibility = 'public' | 'unlisted' | 'private';

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onPublished?: (slug: string) => void;
  entryId: number | null;
  initialTitle: string;
  content: string;
};

export default function PublishModal({ isOpen, onClose, onPublished, entryId, initialTitle, content }: Props) {
  const [title, setTitle] = useState(initialTitle || '');
  const [visibility, setVisibility] = useState<Visibility>('public');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'details' | 'preview'>('details');

  const excerpt = useMemo(() => {
    const text = content
      .replace(/```[\s\S]*?```/g, ' ')
      .replace(/`[^`]*`/g, ' ')
      .replace(/!\[[^\]]*\]\([^\)]*\)/g, ' ')
      .replace(/\[[^\]]*\]\([^\)]*\)/g, ' ')
      .replace(/^>\s?/gm, '')
      .replace(/^#+\s+/gm, '')
      .replace(/[*_~`>#-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    const maxLen = 240;
    if (text.length <= maxLen) return text;
    const slice = text.slice(0, maxLen - 1);
    const lastSpace = slice.lastIndexOf(' ');
    return (lastSpace > 32 ? slice.slice(0, lastSpace) : slice).trim() + '…';
  }, [content]);

  const canSubmit = !!entryId && !!title && !submitting;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/posts/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ entry_id: entryId, title, visibility }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Failed: ${res.status}`);
      }
      const post = await res.json();
      onPublished?.(post.slug);
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Publish failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-(--darkelbg) w-full max-w-2xl p-6 rounded shadow-xl border-1 border-(--secondary)">
        <h2 className="text-xl font-semibold mb-4">Publish</h2>
        <div className="mb-4 flex items-center gap-3 border-b-1 border-(--secondary)/40 pb-2">
          <button
            className={`px-3 py-1 cursor-pointer rounded ${mode === 'details' ? 'bg-(--emphasis) text-white' : 'border-1 border-(--secondary)'}`}
            onClick={() => setMode('details')}
            disabled={submitting}
          >
            Details
          </button>
          <button
            className={`px-3 py-1 cursor-pointer rounded ${mode === 'preview' ? 'bg-(--emphasis) text-white' : 'border-1 border-(--secondary)'}`}
            onClick={() => setMode('preview')}
            disabled={submitting}
          >
            Preview
          </button>
        </div>

        {mode === 'details' && (
        <div className="mb-4">
        <div className="mb-3">
          <label className="block text-sm mb-1">Title</label>
          <input
            className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={240}
          />
        </div>
        <div className="mb-3">
          <label className="block text-sm mb-1">Visibility</label>
          <select
            className="w-full px-3 py-2 rounded bg-transparent border-1 border-(--secondary)"
            value={visibility}
            onChange={e => setVisibility(e.target.value as Visibility)}
          >
            <option value="public">Public</option>
            <option value="unlisted">Unlisted</option>
            <option value="private">Private</option>
          </select>
        </div>
        <div className="mb-4">
          <label className="block text-sm mb-1">Excerpt</label>
          <p className="text-(--muted)">{excerpt}</p>
        </div>
        </div>
        )}

        {mode === 'preview' && (
          <div className="mb-4">
            <div className="mb-2">
              <h3 className="text-lg font-semibold text-(--foreground)">{title || '(Untitled)'}</h3>
              <p className="text-xs text-(--secondary)">Visibility: {visibility}</p>
            </div>
            <div className="max-h-[50vh] overflow-y-auto pr-1">
              <MarkdownContent content={content} />
            </div>
          </div>
        )}
        {error && <p className="text-red-400 mb-3">{error}</p>}
        <div className="flex justify-end gap-2">
          <button
            className="px-3 py-2 cursor-pointer rounded bg-transparent border-1 border-(--secondary)"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            className="px-3 py-2 cursor-pointer rounded bg-(--emphasis) text-white disabled:opacity-60"
            onClick={handleSubmit}
            disabled={!canSubmit}
          >
            {submitting ? 'Publishing…' : 'Publish'}
          </button>
        </div>
      </div>
    </div>
  );
}


