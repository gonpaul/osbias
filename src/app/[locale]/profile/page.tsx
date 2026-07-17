import { redirect } from 'next/navigation';
import ProfileClient from '@/components/profile/ProfileClient';
import { verifyToken } from '@/lib/auth';
import db from '@/lib/db';
import type { User } from '@/models/user';
import { cookies } from 'next/headers';

async function fetchUserData() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token')?.value;
    if (!token) return { profile: null, preferences: { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 } };
    
    const payload = verifyToken(token);
    if (!payload) return { profile: null, preferences: { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 } };
    
    const user = await db<User>('users').where({ id: payload.id }).first();
    if (!user) return { profile: null, preferences: { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 } };
    
    const profile = { id: user.id, name: user.name, email: user.email };
    const prefs = user.preferences ? JSON.parse(user.preferences) : {};
    return { profile, preferences: prefs };
  } catch {
    return { profile: null, preferences: { theme: 'system', aiProvider: 'openrouter', aiModel: 'gpt-4o-mini', aiMaxTokens: 512 } };
  }
}

export default async function ProfilePage() {
  const { profile, preferences } = await fetchUserData();

  if (!profile) {
    redirect('/en/login');
  }

  return <ProfileClient profile={profile} preferences={preferences} />;
}