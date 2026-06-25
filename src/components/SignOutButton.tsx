'use client';

import { FaSignOutAlt } from 'react-icons/fa';
import { useDispatch } from 'react-redux';
import { clearUser } from '@/lib/redux/slices/authSlice';
import { useTranslations } from 'next-intl';

type SidebarUser = {
  id: number;
  name?: string | null;
  nickname?: string | null;
  email?: string;
  picture?: string | null;
  role?: 'user' | 'admin';
} | null;

export default function SignOutButton({ user }: { user: SidebarUser }) {
  const dispatch = useDispatch();
  const t = useTranslations('Nav');

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    dispatch(clearUser());
    if (typeof window !== 'undefined') {
      window.location.replace('/login');
    }
  };

  return (
    <button
      onClick={handleSignOut}
      className="flex items-center px-7 group-hover:ml-4 group-hover:w-80 group-hover:space-x-8 group-hover:px-7 py-6 rounded-lg transition-all duration-300 cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
    >
      <FaSignOutAlt className="w-7 h-7 flex-shrink-0" />
      <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
        {t('signOut')}
      </span>
    </button>
  );
}
