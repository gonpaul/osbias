import Link from 'next/link';
import { FaUsersCog } from 'react-icons/fa';
import { GoPencil } from 'react-icons/go';
import { BiSolidPyramid } from 'react-icons/bi';
import { GiMountainRoad } from 'react-icons/gi';
import { FaCubes, FaRss } from 'react-icons/fa';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import SignOutButton from '@/components/SignOutButton';

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

export default function Sidebar({ locale, pathname, user }: Props) {
  const t = useTranslations('Nav');

  const navigation = [
    { name: t('editor'), href: `/${locale}`, icon: GoPencil },
    { name: t('feed'), href: `/${locale}/feed`, icon: FaRss },
    { name: t('frameworks'), href: `/${locale}/frameworks`, icon: FaCubes },
    { name: t('goals'), href: `/${locale}/goals-system`, icon: GiMountainRoad },
  ];

  return (
    <div className="group bg-(--dark) absolute top-0 left-0 h-screen w-30 hover:w-100 overflow-x-hidden overflow-y-auto space-y-6 mt-0 pb-7 px-4 hover:px-7 transition-all duration-300 ease-in-out z-30">
      <div className="text-2xl font-semibold text-start ms-3 my-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Osbias
      </div>

      <div className="flex justify-center w-30 px-5 ms-3 mb-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <LanguageSwitcher />
      </div>

      <nav className="space-y-2 pe-4 border-r-(--secondary)/30 border-r-1 group-hover:border-r-0">
        {navigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center group-hover:w-fit group-hover:space-x-8 px-4 group-hover:px-4 py-4 rounded-lg transition-all duration-300 ${
                isActive
                  ? 'bg-(--natural-gray)/40 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-10 h-10 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
        {user?.role === 'admin' && (
          <Link
            href={`/${locale}/admin/users`}
            className={`flex items-center group-hover:w-fit group-hover:space-x-8 px-4 group-hover:px-4 py-4 rounded-lg transition-all duration-300 ${
              pathname === `/${locale}/admin/users`
                ? 'bg-(--natural-gray)/40 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FaUsersCog className="w-10 h-10 flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              {t('admin')}
            </span>
          </Link>
        )}
      </nav>

      <div className="absolute bottom-6 left-0 right-0 px-4 group-hover:px-2">
        {user && (
          <div className="mx-3 mb-12 ps-4 opacity-0 group-hover:opacity-100 hover:bg-(--natural-gray)/40 rounded-xl p-2 transition-colors duration-300">
            <Link href={`/${locale}/profile`} className="block">
              <div className="grid grid-cols-4 grid-rows-2 items-center">
                <div className="row-span-2 col-span-1 me-3 flex items-center justify-center">
                  {user.picture ? (
                    <Image
                      src={user.picture}
                      alt={user.name || 'Profile'}
                      className="w-14 h-14 rounded-full object-cover border-2 border-(--golden)/60"
                      width={56}
                      height={56}
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl text-white border-2 border-(--golden)/60">
                      {user.name ? user.name[0] : '?'}
                    </div>
                  )}
                </div>
                <div className="col-span-3 row-span-1 text-base font-semibold text-(--foreground)">
                  {user.name}
                </div>
                <div className="col-span-3 row-span-1 text-xs text-(--secondary)">
                  {user.nickname || user.email}
                </div>
              </div>
            </Link>
          </div>
        )}
        <SignOutButton user={user} />
      </div>
    </div>
  );
}
