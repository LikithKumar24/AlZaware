// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AssignDoctor from '@/components/patient/AssignDoctor';
import { Button } from '@/components/ui/button';
import { Users, FileText, History } from 'lucide-react';

export function Sidebar() {
  const { user } = useAuth();

  return (
    <aside className="hidden md:block w-64 min-h-[calc(100vh-4rem)] bg-white/30 backdrop-blur-sm p-6">
      <Link href="/profile">
        <div className="w-32 h-32 bg-blue-200 rounded-full flex items-center justify-center mx-auto cursor-pointer overflow-hidden">
          {user && user.profile_photo_url ? (
            <img
              src={user.profile_photo_url}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-blue-700 font-medium">Profile</span>
          )}
        </div>
      </Link>
      {user && (
        <div className="text-center mt-4">
          <p className="font-bold text-slate-800">{user.full_name}</p>
          <p className="text-sm text-slate-500">{user.email}</p>
          <p className="text-xs text-slate-400 mt-1 capitalize">{user.role}</p>
        </div>
      )}
      
      {user?.role === 'patient' && (
        <div className="mt-8 space-y-3">
          <Link href="/view-doctors" className="block">
            <Button variant="outline" className="w-full justify-start gap-2 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300">
              <Users className="h-4 w-4" />
              View Doctors
            </Button>
          </Link>
          <Link href="/assessment" className="block">
            <Button variant="outline" className="w-full justify-start gap-2 hover:bg-green-50 hover:text-green-600 hover:border-green-300">
              <FileText className="h-4 w-4" />
              New Assessment
            </Button>
          </Link>
          <Link href="/results-history" className="block">
            <Button variant="outline" className="w-full justify-start gap-2 hover:bg-purple-50 hover:text-purple-600 hover:border-purple-300">
              <History className="h-4 w-4" />
              Results History
            </Button>
          </Link>
          <div className="mt-6">
            <AssignDoctor />
          </div>
        </div>
      )}
    </aside>
  );
}