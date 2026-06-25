import { fetchMeClient, getGoals } from '@/lib/goals-actions';
import GoalsClient from '@/components/goals/GoalsClient';

export default async function GoalsSystemPage() {
  const me = await fetchMeClient();

  if (!me) {
    return (
      <div className="max-w-4xl px-20 pb-20 mt-10 rounded-t-2xl mx-auto min-h-screen overflow-y-scroll overflow-x-hidden bg-(--darkelbg) p-4">
        <h2 className="text-4xl mt-10 text-center">Goals</h2>
        <p className="text-center mt-4">Please log in to view goals.</p>
      </div>
    );
  }

  const goals = await getGoals(me.id);
  return <GoalsClient goals={goals} userId={me.id} />;
}
