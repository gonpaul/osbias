export async function fetchMeClient(): Promise<{ id: number; name: string | null } | null> {
  try {
    const res = await fetch('/api/auth/me', { cache: 'no-store', credentials: 'include' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getGoals(userId: number) {
  try {
    const res = await fetch(`/api/goals?user_id=${userId}`, { cache: 'no-store', credentials: 'include' });
    if (!res.ok) throw new Error('Failed to fetch goals');
    return await res.json();
  } catch {
    return [];
  }
}

export async function addGoal(goal: {
  user_id: number; title: string; description?: string | null;
  status: string; target_date?: string | null;
}) {
  try {
    const res = await fetch('/api/goals', {
      method: 'POST', cache: 'no-store', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });
    if (!res.ok) throw new Error('Failed to create goal');
    return await res.json();
  } catch {
    return null;
  }
}

export async function updateGoal(id: number, updates: Record<string, unknown>) {
  try {
    const res = await fetch(`/api/goals/${id}` as const, {
      method: 'PUT', cache: 'no-store', credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    return await res.json();
  } catch {
    return null;
  }
}

export async function deleteGoal(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/goals/${id}` as const, {
      method: 'DELETE', cache: 'no-store', credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}
