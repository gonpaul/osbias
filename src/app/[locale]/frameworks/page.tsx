import FrameworkListClient from '@/components/frameworks/FrameworkListClient';

interface Framework {
  id: number;
  name: string;
  description: string;
  concepts: string[];
  is_system: boolean;
  created_at: string;
  updated_at: string;
  usage_stats?: {
    total_uses: number;
    unique_users: number;
    completion_rate: number;
    avg_rating: number;
  };
}

async function fetchFrameworks(): Promise<Framework[]> {
  try {
    const res = await fetch('/api/frameworks', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return [];
    const data = await res.json();
    const frameworksWithStats = await Promise.all(
      data.map(async (framework: Framework) => {
        try {
          const statsResponse = await fetch(`/api/frameworks/${framework.id}/stats`, {
            credentials: 'include',
            cache: 'no-store',
          });
          if (statsResponse.ok) {
            const stats = await statsResponse.json();
            return { ...framework, usage_stats: stats };
          }
        } catch {}
        return framework;
      })
    );
    return frameworksWithStats;
  } catch {
    return [];
  }
}

export default async function FrameworksPage() {
  const frameworks = await fetchFrameworks();
  return <FrameworkListClient initialFrameworks={frameworks} />;
}
