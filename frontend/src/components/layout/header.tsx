// src/components/layout/Header.tsx
import Link from 'next/link';
import { BrainCircuit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';

export function Header() {
  const { user, logout } = useAuth();

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
            <Link href="/assessment" className="text-slate-600 hover:text-blue-600 transition-colors">New Assessment</Link>
            <Link href="/results-history" className="text-slate-600 hover:text-blue-600 transition-colors">Results History</Link>
            <Link href="/about" className="text-slate-600 hover:text-blue-600 transition-colors">About</Link>
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