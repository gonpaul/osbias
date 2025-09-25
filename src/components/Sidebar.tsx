'use client';
import Link from 'next/link';
import { 
  FaSignOutAlt 
} from 'react-icons/fa';
// import { sessionUtils } from '@/lib/session';
import { GoPencil } from "react-icons/go";
import { GiProcessor } from "react-icons/gi";
import { PiGraphLight } from "react-icons/pi";
import { BiSolidPyramid } from "react-icons/bi";
import { GiMountainRoad } from "react-icons/gi";
import { clearUser } from '@/lib/redux/slices/authSlice';
import { usePathname } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';

const navigation = [
  { name: 'Editor', href: '/', icon: GoPencil},
  { name: 'Mental models', href: '/mental-models', icon: GiProcessor},
  { name: 'Graph view', href: '/graph-view', icon: PiGraphLight},
  { name: 'Belief system', href: '/belief-system', icon: BiSolidPyramid},
  { name: 'Goals', href: '/goal-action', icon: GiMountainRoad},
];

export default function Sidebar() {
  const pathname = usePathname();
  const dispatch = useDispatch();
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
    <div className="group bg-(--dark) w-30 hover:w-100 focus-within:w-100 space-y-6 mt-10 pb-7 px-4 hover:px-7 focus-within:px-7 transform -translate-x-full md:relative md:translate-x-0 transition-all duration-300 ease-in-out">
      <div className="text-2xl font-semibold text-start ms-3 mb-6 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
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
              className={`flex items-center group-hover:w-fit group-hover:space-x-8 group-focus-within:space-x-8 px-4 group-hover:px-4 group-focus-within:px-4 py-4 rounded-lg transition-all duration-300 ${
                isActive 
                  ? 'bg-(--natural-gray)/40 text-white' 
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              }`}
            >
              <item.icon className="w-10 h-10 flex-shrink-0" />
              <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 whitespace-nowrap">
                {item.name}
              </span>
            </Link>
          );
        })}
      </nav>
      
      <div className="absolute bottom-6 left-0 right-0 px-4 group-hover:px-2 group-focus-within:px-2">
        {user && (
          <div className="mx-3 mb-12 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300">
            <Link
              href="/profile"
              className="flex items-center text-sm px-4 py-3 rounded-lg transition-all duration-300 text-gray-300 hover:bg-gray-700 hover:text-white"
            >
              {user.name} · Profile
            </Link>
            <div className="text-xs border-t-1 border-(--gray-500)/20 ms-4 pe-5 inline-block opacity-70">{user.email}</div>
          </div>
        )}
        <button
          onClick={handleSignOut}
          className="flex items-center px-7 group-hover:ml-4 group-hover:w-80 group-hover:space-x-8 group-focus-within:space-x-8 group-hover:px-7 group-focus-within:px-7 py-4 rounded-lg transition-all duration-300 cursor-pointer text-gray-300 hover:bg-gray-700 hover:text-white"
        >
          <FaSignOutAlt className="w-7 h-7 flex-shrink-0" />
          <span className="opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-300 whitespace-nowrap">
            Sign Out
          </span>
        </button>
      </div>
    </div>
  );
}