// src/components/layout/Sidebar.tsx
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AssignDoctor from '@/components/patient/AssignDoctor';

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
        </div>
      )}
      {user?.role === 'patient' && <AssignDoctor />}
    </aside>
  );
}