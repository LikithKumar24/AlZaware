console.log("✅ Active PatientDashboard loaded");

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { FileText, History, Users, MessageCircle } from 'lucide-react';
import Notifications from '@/components/patient/Notifications';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/router';

const PatientDashboard = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [assignedDoctor, setAssignedDoctor] = useState<string | null>(null);
  const [doctorName, setDoctorName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      console.log('[ChatButton] Starting fetchUserData...');
      console.log('[ChatButton] User object:', user);
      console.log('[ChatButton] Token:', token ? 'Present' : 'Missing');
      
      // First check if user object has assigned_doctor
      if (user && (user as any).assigned_doctor) {
        const doctorEmail = (user as any).assigned_doctor;
        console.log('[ChatButton] Assigned doctor from user object:', doctorEmail);
        setAssignedDoctor(doctorEmail);
        fetchDoctorName(doctorEmail);
        setLoading(false);
        return;
      }

      // If not, fetch from API
      if (token && user?.email) {
        try {
          console.log('[ChatButton] Fetching user data from /users/me API...');
          const response = await axios.get('http://127.0.0.1:8000/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          
          console.log('[ChatButton] API Response:', response.data);
          console.log('[ChatButton] assigned_doctor field:', response.data.assigned_doctor);
          
          if (response.data.assigned_doctor) {
            const doctorEmail = response.data.assigned_doctor;
            console.log('[ChatButton] Assigned doctor:', doctorEmail);
            setAssignedDoctor(doctorEmail);
            fetchDoctorName(doctorEmail);
          } else {
            console.log('[ChatButton] No assigned doctor found in API response');
            setAssignedDoctor(null);
          }
        } catch (error) {
          console.error('[ChatButton] Error fetching user data:', error);
          setError('Failed to load doctor information');
        } finally {
          setLoading(false);
        }
      } else {
        console.log('[ChatButton] Cannot fetch - missing token or user email');
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, token]);

  const fetchDoctorName = async (email: string) => {
    try {
      // Extract and format name from email
      const namePart = email.split('@')[0];
      const formattedName = namePart
        .split('.')
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join(' ');
      setDoctorName(formattedName);
      console.log('[ChatButton] Doctor name:', formattedName);
    } catch (error) {
      console.error('[ChatButton] Error formatting doctor name:', error);
      setDoctorName(email.split('@')[0]);
    }
  };

  const handleChatClick = () => {
    console.log('[ChatButton] Chat button clicked');
    console.log('[ChatButton] Assigned doctor:', assignedDoctor);
    console.log('[ChatButton] Doctor name:', doctorName);
    
    if (assignedDoctor) {
      console.log('[ChatButton] Navigating to /chat?email=' + assignedDoctor);
      router.push(`/chat?email=${assignedDoctor}`);
    } else {
      console.error('[ChatButton] Cannot open chat - no assigned doctor');
    }
  };

  // Debug render
  console.log('[ChatButton] RENDER - Loading:', loading);
  console.log('[ChatButton] RENDER - Assigned doctor:', assignedDoctor);
  console.log('[ChatButton] RENDER - Doctor name:', doctorName);

  return (
    <div className="container mx-auto px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <div className="w-full max-w-4xl">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-4xl font-bold text-slate-800">Welcome, {user?.full_name}!</h1>
            {!loading && assignedDoctor && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleChatClick}
                className="flex items-center gap-2 border-green-600 text-green-700 hover:bg-green-50"
              >
                <MessageCircle className="h-4 w-4" />
                <span className="hidden sm:inline">Chat with Dr. {doctorName}</span>
                <span className="sm:hidden">💬</span>
              </Button>
            )}
          </div>
        </div>
        
        <p className="mt-2 text-lg text-slate-600 max-w-3xl">
          You can start a new assessment, view your results history, connect with doctors, or manage your profile.
        </p>

        {/* Error message */}
        {error && (
          <div className="mt-4 w-full max-w-2xl">
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-800 text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Notifications Section */}
        <div className="mt-8 w-full max-w-2xl">
          <Notifications maxDisplay={3} showMarkAllRead={true} />
        </div>

        {/* Chat with Doctor Banner - ALWAYS SHOW SOMETHING */}
        {loading ? (
          <div className="mt-6 w-full max-w-2xl">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm animate-pulse">Loading doctor information...</p>
            </div>
          </div>
        ) : assignedDoctor ? (
          <div className="mt-6 w-full max-w-2xl">
            <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300 rounded-lg p-4 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-green-600 p-3 rounded-full">
                    <MessageCircle className="h-6 w-6 text-white" />
                  </div>
                  <div className="text-left">
                    <h3 className="font-semibold text-green-900 text-lg">💬 Message Your Doctor</h3>
                    <p className="text-sm text-green-700">Dr. {doctorName} • Real-time chat available</p>
                  </div>
                </div>
                <Button
                  onClick={handleChatClick}
                  className="bg-green-600 hover:bg-green-700 text-white shadow-md font-bold"
                >
                  <MessageCircle className="h-4 w-4 mr-2" />
                  Open Chat
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-6 w-full max-w-2xl">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-gray-600 text-sm">
                ℹ️ No doctor assigned yet. Visit the "View Doctors" section to send a supervision request.
              </p>
            </div>
          </div>
        )}

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
          {/* Start New Assessment */}
          <Link href="/assessment" className="block">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-lg px-6 py-8 w-full h-full flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-all">
              <FileText className="h-8 w-8" />
              <span>Start New Assessment</span>
            </Button>
          </Link>
          
          {/* Chat with Doctor Button - ALWAYS RENDERED */}
          {loading ? (
            <div className="block">
              <Button
                size="lg"
                disabled
                className="bg-gray-200 text-gray-400 text-lg px-6 py-8 w-full h-full flex flex-col items-center gap-3"
              >
                <MessageCircle className="h-8 w-8 animate-pulse" />
                <span>Loading...</span>
              </Button>
            </div>
          ) : assignedDoctor ? (
            <div className="block">
              <Button
                size="lg"
                onClick={handleChatClick}
                className="bg-green-600 hover:bg-green-700 text-white text-lg px-6 py-8 w-full h-full flex flex-col items-center gap-3 shadow-md hover:shadow-lg transition-all border-2 border-green-700"
              >
                <MessageCircle className="h-8 w-8" />
                <span>💬 Chat with Doctor</span>
              </Button>
            </div>
          ) : (
            <div className="block">
              <Button
                size="lg"
                disabled
                className="bg-gray-300 text-gray-500 text-lg px-6 py-8 w-full h-full flex flex-col items-center gap-3 shadow-sm cursor-not-allowed opacity-60"
                title="No doctor assigned. Please visit 'View Doctors' to request a supervisor."
              >
                <MessageCircle className="h-8 w-8" />
                <span>Chat (No Doctor)</span>
              </Button>
            </div>
          )}
          
          {/* View Doctors */}
          <Link href="/view-doctors" className="block">
            <Button size="lg" variant="outline" className="text-lg px-6 py-8 w-full h-full border-2 border-green-600 text-green-700 hover:bg-green-50 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all">
              <Users className="h-8 w-8" />
              <span>View Doctors</span>
            </Button>
          </Link>
          
          {/* Results History */}
          <Link href="/results-history" className="block">
            <Button size="lg" variant="outline" className="text-lg px-6 py-8 w-full h-full border-2 border-slate-800 text-slate-800 hover:bg-slate-100 flex flex-col items-center gap-3 shadow-sm hover:shadow-md transition-all">
              <History className="h-8 w-8" />
              <span>Results History</span>
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
