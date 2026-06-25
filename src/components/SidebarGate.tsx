import Sidebar from '@/components/Sidebar';
import { type Locale } from '@/i18n';

const AUTH_PATHS = ['/login', '/register'];

type SidebarUser = {
  id: number;
  name?: string | null;
  nickname?: string | null;
  email?: string;
  picture?: string | null;
  role?: 'user' | 'admin';
} | null;

type Props = {
  locale: string;
  pathname: string;
  user: SidebarUser;
};

export default function SidebarGate({ locale, pathname, user }: Props) {
  const isAuthRoute = AUTH_PATHS.some((p) => pathname.startsWith(p));
  if (isAuthRoute) return null;

  return <Sidebar locale={locale} pathname={pathname} user={user} />;
}
