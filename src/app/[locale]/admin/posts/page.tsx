'use client';
import { useEffect, useMemo, useState } from 'react';

type Row = {
  id: number;
  author_id: number;
  entry_id: number | null;
  title: string;
  visibility: 'public' | 'unlisted' | 'private';
  slug: string;
  views?: number | null;
  created_at: string;
  updated_at: string;
};

export default function AdminPostsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [visibility, setVisibility] = useState<'' | 'public' | 'unlisted' | 'private'>('');
  const [authorId, setAuthorId] = useState<string>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (visibility) params.set('visibility', visibility);
    if (authorId) params.set('author_id', authorId);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await fetch(`/api/admin/posts?${params.toString()}`, { credentials: 'include' });
    if (res.ok) {
      const data = await res.json();
      setRows(data.rows || []);
      setTotal(data.total || 0);
    }
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, visibility, authorId, page, limit]);

  async function saveRow(updated: Partial<Row> & { id: number }) {
    await fetch(`/api/admin/posts/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated),
    });
    await load();
  }

  async function deleteRow(id: number) {
    if (!confirm('Delete this post?')) return;
    await fetch(`/api/admin/posts/${id}`, { method: 'DELETE', credentials: 'include' });
    await load();
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="bg-(--darkelbg) rounded-lg border border-(--secondary)/30 p-6">
      <h1 className="text-2xl font-semibold mb-4">Posts</h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          className="px-3 py-2 rounded-md bg-(--background) border border-(--secondary)/30 placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
          placeholder="Search title, content, slug"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select className="px-3 py-2 cursor-pointer rounded-md bg-(--background) border border-(--secondary)/30" value={visibility} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setPage(1); setVisibility(e.target.value as '' | 'public' | 'unlisted' | 'private'); }}>
          <option value="">All visibilities</option>
          <option value="public">Public</option>
          <option value="unlisted">Unlisted</option>
          <option value="private">Private</option>
        </select>
        <input
          className="px-3 py-2 rounded-md bg-(--background) border border-(--secondary)/30 placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
          placeholder="Author ID"
          value={authorId}
          onChange={(e) => { setPage(1); setAuthorId(e.target.value.replace(/[^0-9]/g, '')); }}
        />
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--secondary)/20">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-(--secondary)/20 bg-(--background)">
                <th className="py-2 px-3">Title</th>
                <th className="py-2 pr-3">Slug</th>
                <th className="py-2 pr-3">Visibility</th>
                <th className="py-2 pr-3">Author</th>
                <th className="py-2 pr-3">Views</th>
                <th className="py-2 pr-3">Created</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-(--secondary)/10 align-center hover:bg-(--emphasis)">
                  <td className="py-2 px-3">
                    <input className="px-2 py-1 rounded w-full bg-transparent border border-(--secondary)/30 focus:outline-none focus:border-(--emphasis-light)" defaultValue={r.title} onBlur={(e) => saveRow({ id: r.id, title: e.target.value })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input className="px-2 py-1 rounded w-full bg-transparent border border-(--secondary)/30 focus:outline-none focus:border-(--emphasis-light)" defaultValue={r.slug} onBlur={(e) => saveRow({ id: r.id, slug: e.target.value })} />
                  </td>
                  <td className="py-2 pr-3">
                    <select className="px-2 py-1 rounded cursor-pointer bg-transparent border border-(--secondary)/30" defaultValue={r.visibility} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => saveRow({ id: r.id, visibility: e.target.value as Row['visibility'] })}>
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" className="px-2 py-1 rounded w-32 bg-transparent border border-(--secondary)/30 focus:outline-none focus:border-(--emphasis-light)" defaultValue={r.author_id} onBlur={(e) => saveRow({ id: r.id, author_id: e.target.value ? parseInt(e.target.value) : r.author_id })} />
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-sm">{r.views ?? 0}</span>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-sm">{new Date(r.created_at).toLocaleString()}</span>
                  </td>
                  <td className="py-2 pr-3 text-right">
                    <button className="px-2 py-1 text-red-400 hover:text-red-300" onClick={() => deleteRow(r.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex items-center gap-3 mt-4">
        <button className="px-3 py-1 rounded-md border border-(--secondary)/30 hover:border-(--golden)/50 transition-colors cursor-pointer disabled:opacity-50" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))}>Prev</button>
        <span className="text-(--secondary)">Page {page} / {totalPages}</span>
        <button className="px-3 py-1 rounded-md border border-(--secondary)/30 hover:border-(--golden)/50 transition-colors cursor-pointer disabled:opacity-50" disabled={page >= totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))}>Next</button>
      </div>
    </div>
  );
}


