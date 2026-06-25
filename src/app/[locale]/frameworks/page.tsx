'use client';

import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
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

export default function FrameworksPage() {
  const t = useTranslations('Frameworks');
  const [frameworks, setFrameworks] = useState<Framework[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetchFrameworks().then(data => {
      setFrameworks(data);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-(--background) flex items-center justify-center">
        <div className="text-(--foreground) text-lg">{t('loading')}</div>
      </div>
    );
  }

  return <FrameworkListClient initialFrameworks={frameworks} />;
}
