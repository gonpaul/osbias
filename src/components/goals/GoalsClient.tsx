'use client';

import { useTranslations } from 'next-intl';
import GoalCard from '@/components/goals/GoalCard';
import { useState, type FormEvent } from 'react';
import { addGoal, updateGoal, deleteGoal } from '@/lib/goals-actions';

type GoalStatus = 'planned' | 'active' | 'blocked' | 'done' | 'dropped';

interface Goal {
  id: number;
  created_at: string;
  user_id: number;
  title: string;
  description: string | null;
  status: GoalStatus;
  target_date: string | null;
}

type Props = {
  goals: Goal[];
  userId: number;
};

export default function GoalsClient({ goals: initialGoals, userId }: Props) {
  const t = useTranslations('Goals');
  const [goals, setGoals] = useState<Goal[]>(initialGoals);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<GoalStatus>('planned');
  const [targetDate, setTargetDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAddGoal(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    setIsSubmitting(true);
    const created = await addGoal({
      user_id: userId, title: title.trim(),
      description: description.trim() ? description.trim() : null,
      status, target_date: targetDate || null,
    });
    setIsSubmitting(false);
    if (created) {
      setGoals([created, ...goals]);
      setTitle(''); setDescription(''); setStatus('planned'); setTargetDate('');
    }
  }

  async function handleDeleteGoal(id: number) {
    const ok = await deleteGoal(id);
    if (ok) setGoals(goals.filter((g) => g.id !== id));
  }

  async function handleUpdateGoal(id: number, updates: Partial<{
    title: string; description: string | null; status: GoalStatus; target_date: string | null;
  }>) {
    const updated = await updateGoal(id, updates);
    if (updated) setGoals(goals.map((g) => (g.id === id ? updated : g)));
  }

  return (
    <div className="max-w-4xl px-20 pb-20 mt-10 rounded-t-2xl mx-auto min-h-screen overflow-y-scroll overflow-x-hidden bg-(--darkelbg) p-4">
      <h2 className="text-4xl mt-10 text-center">{t('title')}</h2>
      <form onSubmit={handleAddGoal} className="rounded-2xl mt-10 bg-(--background)/30 border border-(--secondary)/40 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="md:col-span-2 rounded-md border border-(--secondary)/40 bg-transparent px-5 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
            placeholder={t('goalTitle')}
            value={title} onChange={(e) => setTitle(e.target.value)} maxLength={120}
          />
          <input
            className="md:col-span-2 rounded-md border border-(--secondary)/40 bg-transparent px-5 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
            placeholder={t('descriptionPlaceholder')}
            value={description} onChange={(e) => setDescription(e.target.value)} maxLength={500}
          />
          <div className="flex items-center gap-3 md:col-start-4 justify-end">
            <select
              className="rounded-md border border-(--secondary)/40 bg-transparent ps-4 py-3 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
              value={status} onChange={(e) => setStatus(e.target.value as GoalStatus)}
            >
              <option value="planned">{t('planned')}</option>
              <option value="active">{t('active')}</option>
              <option value="blocked">{t('blocked')}</option>
              <option value="done">{t('done')}</option>
              <option value="dropped">{t('dropped')}</option>
            </select>
            <input
              type="date"
              className="rounded-md border border-(--secondary)/40 bg-transparent px-2 py-2 text-sm focus:outline-none focus:ring-0 focus:border-(--emphasis)/80"
              value={targetDate} onChange={(e) => setTargetDate(e.target.value)}
            />
            <button
              type="submit"
              className="rounded-md cursor-pointer bg-(--emphasis) hover:bg-(--secondary) text-nowrap px-3 py-2 text-sm text-white disabled:opacity-60 transition-colors duration-300"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? t('adding') : t('addGoal')}
            </button>
          </div>
        </div>
      </form>

      <div className="flex flex-col gap-3">
        {goals.map((g) => (
          <GoalCard key={g.id} goal={g} onDelete={() => handleDeleteGoal(g.id)} onUpdate={(updates) => handleUpdateGoal(g.id, updates)} />
        ))}
      </div>
    </div>
  );
}
