// src/components/layout/Header.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
  BrainCircuit,
  LayoutDashboard,
  ClipboardList,
  Stethoscope,
  History,
  Info,
  MessageSquare,
  LogOut,
  UserCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleChatClick = () => {
    router.push('/chat');
  };

  const navLinkClass = "flex items-center gap-2 px-4 py-2 rounded-full text-slate-600 font-medium transition-all duration-200 hover:bg-blue-50 hover:text-blue-600 hover:scale-105 active:scale-95";
  const iconClass = "w-4 h-4";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-gray-100 bg-white/80 backdrop-blur-md shadow-sm">
      <div className="container flex h-20 max-w-screen-2xl items-center justify-between px-4">
        {/* Logo Section */}
        <div className="flex items-center space-x-2.5">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-xl shadow-lg shadow-blue-500/20">
            <BrainCircuit className="h-6 w-6 text-white" />
          </div>
          <span className="font-bold text-2xl bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tight">
            AlzAware
          </span>
        </div>

        {user && (
          <nav className="hidden lg:flex items-center space-x-2">
            <Link href="/" className={navLinkClass}>
              <LayoutDashboard className={iconClass} />
              <span>Dashboard</span>
            </Link>

            {user.role === 'patient' && (
              <>
                <Link href="/assessment" className={navLinkClass}>
                  <ClipboardList className={iconClass} />
                  <span>New Assessment</span>
                </Link>
                <Link href="/view-doctors" className={navLinkClass}>
                  <Stethoscope className={iconClass} />
                  <span>View Doctors</span>
                </Link>
                <Link href="/results-history" className={navLinkClass}>
                  <History className={iconClass} />
                  <span>Results History</span>
                </Link>
              </>
            )}

            <Link href="/about" className={navLinkClass}>
              <Info className={iconClass} />
              <span>About</span>
            </Link>

            {/* Chat Button */}
            <button
              onClick={handleChatClick}
              className={navLinkClass}
            >
              <MessageSquare className={iconClass} />
              <span>Chat</span>
            </button>
          </nav>
        )}

        {/* User Area */}
        <div>
          {user ? (
            <div className="flex items-center">
              <div className="bg-gray-100 rounded-full pl-1.5 pr-4 py-1.5 flex items-center gap-3 border border-gray-200/50">
                {/* Avatar Circle */}
                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center shadow-sm text-blue-600">
                  <UserCircle className="h-5 w-5" />
                </div>

                {/* User Info */}
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-slate-700 leading-none">
                    {user.full_name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider leading-none mt-0.5">
                    {user.role}
                  </span>
                </div>

                {/* Separator */}
                <div className="h-4 w-px bg-gray-300 mx-1" />

                {/* Logout Button */}
                <button
                  onClick={logout}
                  className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50"
                  title="Logout"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Link href="/login">
                <Button variant="ghost" className="rounded-full px-6 text-slate-600 hover:text-blue-600 hover:bg-blue-50">
                  Login
                </Button>
              </Link>
              <Link href="/register">
                <Button className="rounded-full px-6 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all hover:scale-105 active:scale-95">
                  Register
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}