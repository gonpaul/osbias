'use client';
import GoalCard from "@/components/goals/GoalCard";
// import { fetchMeClient } from "@/lib/utils";
import { useEffect, useState, type FormEvent } from "react";

type GoalStatus = "planned" | "active" | "blocked" | "done" | "dropped";

interface Goal {
  id: number;
  created_at: string;
  user_id: number;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
}


export async function fetchMeClient(): Promise<{ id: number; name: string | null } | null> {
  try {
    const res = await fetch('/api/auth/me', {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data as { id: number; name: string | null };
  } catch {
    return null;
  }
}

export async function getGoals(userId: number): Promise<Goal[]> {
  try {
    const res = await fetch(`/api/goals?user_id=${userId}`, {
      cache: 'no-store',
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Failed to fetch goals');
    const data = await res.json();
    return data as Goal[];
  } catch {
    return [];
  }
}

/**
 * Create a new goal for the given user.
 * @param goal - An object matching the CreateGoalRequest schema:
 *   {
 *     user_id: number,
 *     title: string,
 *     description?: string | null,
 *     status: "planned" | "active" | "blocked" | "done" | "dropped",
 *     target_date?: string | null, // format: date ("YYYY-MM-DD")
 *   }
 * @returns The created Goal object, or null on failure.
 */
export async function addGoal(goal: {
  user_id: number;
  title: string;
  description?: string | null;
  status: GoalStatus;
  target_date?: string | null;
}): Promise<Goal | null> {
  try {
    const res = await fetch('/api/goals', {
      method: 'POST',
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(goal),
    });

    if (!res.ok) throw new Error('Failed to create goal');
    const data = await res.json();
    return data as Goal;
  } catch {
    return null;
  }
}

export async function updateGoal(
  id: number,
  updates: Partial<{
    title: string;
    description: string | null;
    status: GoalStatus;
    target_date: string | null;
  }>
): Promise<Goal | null> {
  try {
    const res = await fetch(`/api/goals/${id}` as const, {
      method: 'PUT',
      cache: 'no-store',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Failed to update goal');
    const data = await res.json();
    return data as Goal;
  } catch {
    return null;
  }
}

export async function deleteGoal(id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/goals/${id}` as const, {
      method: 'DELETE',
      cache: 'no-store',
      credentials: 'include',
    });
    return res.ok;
  } catch {
    return false;
  }
}


export default function GoalsSystemPage() {
    const [goals, setGoals] = useState<Goal[]>([]);
    const [me, setMe] = useState<{ id: number; name: string | null } | null>(null);

    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [status, setStatus] = useState<GoalStatus>("planned");
    const [targetDate, setTargetDate] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        fetchMeClient().then(setMe);
    }, []);

    useEffect(() => {
        if (!me?.id) return;
        getGoals(me.id).then(setGoals);
    }, [me?.id]);

    async function handleAddGoal(e: FormEvent) {
        e.preventDefault();
        if (!me?.id || !title.trim()) return;
        setIsSubmitting(true);
        const created = await addGoal({
            user_id: me.id,
            title: title.trim(),
            description: description.trim() ? description.trim() : null,
            status,
            target_date: targetDate || null,
        });
        setIsSubmitting(false);
        if (created) {
            setGoals([created, ...goals]);
            setTitle("");
            setDescription("");
            setStatus("planned");
            setTargetDate("");
        }
    }

    async function handleDeleteGoal(id: number) {
        const ok = await deleteGoal(id);
        if (ok) {
            setGoals(goals.filter((g) => g.id !== id));
        }
    }

    async function handleUpdateGoal(
        id: number,
        updates: Partial<{
            title: string;
            description: string | null;
            status: GoalStatus;
            target_date: string | null;
        }>
    ) {
        const updated = await updateGoal(id, updates);
        if (updated) {
            setGoals(goals.map((g) => (g.id === id ? updated : g)));
        }
    }

    return (
        <div className="max-w-4xl px-20 pb-20 mt-10 rounded-t-2xl mx-auto min-h-screen overflow-y-scroll overflow-x-hidden bg-(--darkelbg) p-4">
            <h2 className="text-4xl mt-10 text-center">Goals System</h2>
            <form onSubmit={handleAddGoal} className="rounded-2xl mt-10 bg-(--background)/30 border border-(--secondary)/40 p-6 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                    <input
                        className="md:col-span-2 rounded-md border border-(--secondary)/40 bg-transparent px-5 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                        placeholder="Goal title"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        maxLength={120}
                    />
                    <input
                        className="md:col-span-2 rounded-md border border-(--secondary)/40 bg-transparent px-5 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                        placeholder="Description (optional)"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        maxLength={500}
                    />
                    <div className="flex items-center gap-3 md:col-start-4 justify-end">
                        <select
                            className="rounded-md border border-(--secondary)/40 bg-transparent ps-4 py-3 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                            value={status}
                            onChange={(e) => setStatus(e.target.value as GoalStatus)}
                        >
                            <option value="planned">planned</option>
                            <option value="active">active</option>
                            <option value="blocked">blocked</option>
                            <option value="done">done</option>
                            <option value="dropped">dropped</option>
                        </select>
                        <input
                            type="date"
                            className="rounded-md border border-(--secondary)/40 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
                            value={targetDate}
                            onChange={(e) => setTargetDate(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="rounded-md cursor-pointer bg-(--emphasis) hover:bg-(--secondary) text-nowrap px-3 py-2 text-sm text-white disabled:opacity-60 transition-colors duration-300"
                            disabled={isSubmitting || !title.trim()}
                        >
                            {isSubmitting ? "Adding..." : "Add goal"}
                        </button>
                    </div>
                </div>
            </form>

            <div className="flex flex-col gap-3">
                {goals.map((g) => (
                    <GoalCard
                        key={g.id}
                        goal={g}
                        onDelete={() => handleDeleteGoal(g.id)}
                        onUpdate={(updates) => handleUpdateGoal(g.id, updates)}
                    />
                ))}
            </div>
        </div>
    );
}