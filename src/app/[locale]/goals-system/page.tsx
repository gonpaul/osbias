'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { fetchMeClient, getGoals } from '@/lib/goals-actions';
import GoalsClient from '@/components/goals/GoalsClient';

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

export default function GoalsSystemPage() {
  const t = useTranslations('Goals');
  const [goals, setGoals] = useState<Goal[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const me = await fetchMeClient();
      if (!me) {
        setLoading(false);
        return;
      }
      setUserId(me.id);
      const data = (await getGoals(me.id)) as Goal[];
      setGoals(data);
      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="max-w-4xl px-20 pb-20 mt-10 rounded-t-2xl mx-auto min-h-screen overflow-y-scroll overflow-x-hidden bg-(--darkelbg) p-4">
        <h2 className="text-4xl mt-10 text-center">{t('title')}</h2>
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="max-w-4xl px-20 pb-20 mt-10 rounded-t-2xl mx-auto min-h-screen overflow-y-scroll overflow-x-hidden bg-(--darkelbg) p-4">
        <h2 className="text-4xl mt-10 text-center">{t('title')}</h2>
        <p className="text-center mt-4">Please log in to view goals.</p>
      </div>
    );
  }

  return <GoalsClient goals={goals} userId={userId} />;
}
