// src/components/layout/Header.tsx
import Link from 'next/link';
import { useRouter } from 'next/router';
import { BrainCircuit, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleChatClick = () => {
    router.push('/chat');
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-indigo-100 bg-white/70 backdrop-blur-sm">
      <div className="container flex h-14 max-w-screen-2xl items-center justify-between">
        <div className="flex items-center space-x-2">
          <BrainCircuit className="h-6 w-6 text-blue-600" />
          <span className="font-bold text-lg text-slate-800">AlzAware</span>
        </div>
        
        {user && (
          <nav className="flex items-center space-x-6">
            <Link href="/" className="text-slate-600 hover:text-blue-600 transition-colors">Dashboard</Link>
            {user.role === 'patient' && (
              <>
                <Link href="/assessment" className="text-slate-600 hover:text-blue-600 transition-colors">New Assessment</Link>
                <Link href="/view-doctors" className="text-slate-600 hover:text-blue-600 transition-colors">View Doctors</Link>
                <Link href="/results-history" className="text-slate-600 hover:text-blue-600 transition-colors">Results History</Link>
              </>
            )}
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">About</Link>
            
            {/* Chat Button - Available for both patients and doctors */}
            <a 
              onClick={handleChatClick}
              className="flex items-center text-green-700 hover:text-green-800 transition-colors font-medium cursor-pointer"
            >
              <MessageCircle size={18} className="mr-1" />
              Chat
            </a>
          </nav>
        )}

        <div>
          {user ? (
            <div className="flex items-center space-x-4">
              <span className="text-sm text-slate-600">Welcome, {user.full_name}!</span>
              <Button variant="outline" onClick={logout}>Logout</Button>
            </div>
          ) : (
            <Link href="/login">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">Login</Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}