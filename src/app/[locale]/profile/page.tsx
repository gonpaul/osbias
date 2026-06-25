import { redirect } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';

async function fetchProfile() {
  try {
    const res = await fetch('/api/users/me', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

async function fetchPreferences() {
  try {
    const res = await fetch('/api/users/me/preferences', {
      credentials: 'include',
      cache: 'no-store',
    });
    if (!res.ok) return { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 };
    return await res.json();
  } catch {
    return { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 };
  }
}

export default async function ProfilePage() {
  const [profile, preferences] = await Promise.all([
    fetchProfile(),
    fetchPreferences(),
  ]);

  if (!profile) {
    redirect('/login');
  }

  return <ProfileClient profile={profile} preferences={preferences} />;
}
