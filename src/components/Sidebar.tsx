'use client';
import Link from 'next/link';
import { 
  FaSignOutAlt,
  FaUsersCog
} from 'react-icons/fa';
// import { sessionUtils } from '@/lib/session';
import { GoPencil } from "react-icons/go";
// import { GiProcessor } from "react-icons/gi";
import { PiGraphLight } from "react-icons/pi";
import { BiSolidPyramid } from "react-icons/bi";
import { GiMountainRoad } from "react-icons/gi";
import { FaCubes, FaRss } from "react-icons/fa";
import { clearUser } from '@/lib/redux/slices/authSlice';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Image from 'next/image';

const navigation = [
  { name: 'Editor', href: '/', icon: GoPencil},
  { name: 'Feed', href: '/feed', icon: FaRss},
  { name: 'Frameworks', href: '/frameworks', icon: FaCubes},
  // { name: 'Mental models', href: '/mental-models', icon: GiProcessor},
  // { name: 'Graph view', href: '/graph-view', icon: PiGraphLight},
  // { name: 'Belief system', href: '/belief-system', icon: BiSolidPyramid},
  // { name: 'Goals', href: '/goal-action', icon: GiMountainRoad},
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user = useSelector((state: any) => state.auth?.user)

  const handleSignOut = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {}
    dispatch(clearUser());
    if (typeof window !== 'undefined') {
      window.location.replace('/login')
    }
  };

//   const handleSignOut = () => {
//     sessionUtils.clearSession();
//     router.push('/auth');
//   };

  return (
    <div className="group bg-(--dark) w-30 hover:w-100 overflow-x-hidden h-screen sticky top-0 overflow-y-auto space-y-6 mt-0 pb-7 px-4 hover:px-7 transform -translate-x-full md:relative md:translate-x-0 transition-all duration-300 ease-in-out">
      <div className="text-2xl font-semibold text-start ms-3 my-10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        Osbias 
        {/* Qualia */}
      </div>
      
      <nav className="space-y-2 pe-4 border-r-(--secondary)/30 border-r-1">
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
            href="/admin/users"
            className={`flex items-center group-hover:w-fit group-hover:space-x-8 px-4 group-hover:px-4 py-4 rounded-lg transition-all duration-300 ${
              pathname === '/admin/users'
                ? 'bg-(--natural-gray)/40 text-white'
                : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            <FaUsersCog className="w-10 h-10 flex-shrink-0" />
            <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
              Admin
            </span>
          </Link>
        )}
      </nav>
      
      <div className="absolute bottom-6 left-0 right-0 px-4 group-hover:px-2">
        {user && (
          <div className="mx-3 mb-12 ps-4 opacity-0 group-hover:opacity-100 hover:bg-(--natural-gray)/40 rounded-xl p-2 transition-colors duration-300">
            <Link href="/profile" className="block">
              <div className="grid grid-cols-4 grid-rows-2 items-center">
                {/* Image: spans two rows in first column */}
                <div className="row-span-2 col-span-1 me-3 flex items-center justify-center">
                  {user.picture ? (
                    <Image
                      src={user.picture}
                      alt={user.name || "Profile"}
                      className="w-14 h-14 rounded-full object-cover border-2 border-(--golden)/60"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-gray-600 flex items-center justify-center text-xl text-white border-2 border-(--golden)/60">
                      {user.name ? user.name[0] : "?"}
                    </div>
                  )}
                </div>
                {/* Name: second column, first row */}
                <div className="col-span-3 row-span-1 text-base font-semibold text-(--foreground)">
                  {user.name}
                </div>
                {/* Nickname: second column, second row */}
                <div className="col-span-3 row-span-1 text-xs text-(--secondary)">
                  {user.nickname || user.email}
                </div>
              </div>
            </Link>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center px-7 group-hover:ml-4 group-hover:w-80 group-hover:space-x-8 group-hover:px-7 py-6 rounded-lg transition-all duration-300 cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <FaSignOutAlt className="w-7 h-7 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}