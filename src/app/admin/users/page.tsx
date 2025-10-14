'use client';
import { useEffect, useMemo, useState } from 'react';

type Row = {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  is_test_user: boolean;
  rate_limit_quota: number | null;
  exempt_from_rate_limit: boolean;
  plan: string | null;
  created_at: string;
  updated_at: string;
  remaining_quota?: number;
  allow_posting?: boolean;
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState('');
  const [role, setRole] = useState<'user' | 'admin' | ''>('');
  const [isTest, setIsTest] = useState<'' | 'true' | 'false'>('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [limit] = useState(20);

  async function load() {
    setLoading(true);
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (role) params.set('role', role);
    if (isTest) params.set('is_test_user', isTest);
    params.set('page', String(page));
    params.set('limit', String(limit));
    const res = await fetch(`/api/users?${params.toString()}`, { credentials: 'include' });
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
  }, [q, role, isTest, page, limit]);

  async function saveRow(updated: Partial<Row> & { id: number }) {
    await fetch(`/api/users/${updated.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(updated),
    });
    await load();
  }

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / limit)), [total, limit]);

  return (
    <div className="bg-(--darkelbg) rounded-lg border border-(--secondary)/30 p-6">
      <h1 className="text-2xl font-semibold mb-4">Users</h1>
      <div className="flex flex-wrap gap-3 mb-5">
        <input
          className="px-3 py-2 rounded-md bg-(--background) border border-(--secondary)/30 placeholder-(--secondary) focus:outline-none focus:border-(--golden)"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => { setPage(1); setQ(e.target.value); }}
        />
        <select className="px-3 py-2 cursor-pointer rounded-md bg-(--background) border border-(--secondary)/30" value={role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setPage(1); setRole(e.target.value as 'user' | 'admin' | ''); }}>
          <option value="">All roles</option>
          <option value="user">User</option>
          <option value="admin">Admin</option>
        </select>
        <select className="px-3 py-2 cursor-pointer rounded-md bg-(--background) border border-(--secondary)/30" value={isTest} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => { setPage(1); setIsTest(e.target.value as '' | 'true' | 'false'); }}>
          <option value="">All users</option>
          <option value="true">Test users</option>
          <option value="false">Non-test users</option>
        </select>
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-(--secondary)/20">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left border-b border-(--secondary)/20 bg-(--background)">
                <th className="py-2 px-3">Name</th>
                <th className="py-2 pr-3">Email</th>
                <th className="py-2 pr-3">Role</th>
                <th className="py-2 pr-3">Test</th>
                <th className="py-2 pr-3">Can post</th>
                <th className="py-2 pr-3">Quota</th>
                <th className="py-2 pr-3">Exempt</th>
                <th className="py-2 pr-3">Plan</th>
                <th className="py-2 pr-3">Remaining</th>
                <th className="py-2 pr-3"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-b border-(--secondary)/10 align-center hover:bg-(--emphasis)">
                  <td className="py-2 px-3">
                    <input className="px-2 py-1 rounded w-full bg-transparent border border-(--secondary)/30 focus:outline-none focus:border-(--emphasis-light)" defaultValue={r.name} onBlur={(e) => saveRow({ id: r.id, name: e.target.value })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input className="px-2 py-1 rounded w-full bg-transparent border border-(--secondary)/30 focus:outline-none focus:border-(--emphasis-light)" defaultValue={r.email} onBlur={(e) => saveRow({ id: r.id, email: e.target.value })} />
                  </td>
                  <td className="py-2 pr-3">
                    <select className="px-2 py-1 rounded cursor-pointer bg-transparent border border-(--secondary)/30" defaultValue={r.role} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => saveRow({ id: r.id, role: e.target.value as 'user' | 'admin' })}>
                      <option value="user">User</option>
                      <option value="admin">Admin</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <input type="checkbox" defaultChecked={r.is_test_user} onChange={(e) => saveRow({ id: r.id, is_test_user: e.target.checked })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input type="checkbox" defaultChecked={r.allow_posting ?? false} onChange={(e) => saveRow({ id: r.id, allow_posting: e.target.checked })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input type="number" className="px-2 py-1 rounded w-40 bg-(--transparent) border border-(--secondary)/30 focus:outline-none focus:border-(--golden)" placeholder="default" defaultValue={r.rate_limit_quota ?? undefined} onBlur={(e) => saveRow({ id: r.id, rate_limit_quota: e.target.value ? parseInt(e.target.value) : null })} />
                  </td>
                  <td className="py-2 pr-3">
                    <input type="checkbox" defaultChecked={r.exempt_from_rate_limit} onChange={(e) => saveRow({ id: r.id, exempt_from_rate_limit: e.target.checked })} />
                  </td>
                  <td className="py-2 pr-3">
                    <select
                      className="px-2 py-1 rounded w-28 bg-transparent cursor-pointer border border-(--secondary)/30"
                      defaultValue={r.plan ?? ''}
                      onChange={e => saveRow({ id: r.id, plan: e.target.value || null })}
                    >
                      <option value="">No</option>
                      <option value="free">free</option>
                      <option value="pro">pro</option>
                    </select>
                  </td>
                  <td className="py-2 pr-3">
                    <span className="text-sm">{r.remaining_quota ?? '—'}</span>
                  </td>
                  <td className="py-2 pr-3 text-right text-sm text-gray-500">
                    <span>#{r.id}</span>
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


