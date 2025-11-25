console.log("✅ Active PatientDashboard loaded");

import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  FileText,
  History,
  Users,
  MessageCircle,
  Activity,
  Bell,
  Upload,
  BarChart2,
  Info
} from 'lucide-react';
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

      // First check if user object has assigned_doctor
      if (user && (user as any).assigned_doctor) {
        const doctorEmail = (user as any).assigned_doctor;
        setAssignedDoctor(doctorEmail);
        fetchDoctorName(doctorEmail);
        setLoading(false);
        return;
      }

      // If not, fetch from API
      if (token && user?.email) {
        try {
          const response = await axios.get('http://127.0.0.1:8000/users/me', {
            headers: { Authorization: `Bearer ${token}` },
          });

          if (response.data.assigned_doctor) {
            const doctorEmail = response.data.assigned_doctor;
            setAssignedDoctor(doctorEmail);
            fetchDoctorName(doctorEmail);
          } else {
            setAssignedDoctor(null);
          }
        } catch (error) {
          console.error('[ChatButton] Error fetching user data:', error);
          setError('Failed to load doctor information');
        } finally {
          setLoading(false);
        }
      } else {
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
    } catch (error) {
      setDoctorName(email.split('@')[0]);
    }
  };

  const handleChatClick = () => {
    if (assignedDoctor) {
      router.push(`/chat?email=${assignedDoctor}`);
    } else {
      console.error('[ChatButton] Cannot open chat - no assigned doctor');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 relative overflow-hidden">
      {/* Background Texture - Dot Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] z-0 pointer-events-none" />

      <div className="container mx-auto px-4 py-12 relative z-10">
        <main className="flex flex-col items-center">

          {/* SECTION 1: WELCOME BANNER */}
          <div className="w-full max-w-5xl mb-12">
            <div className="relative bg-white/70 backdrop-blur-md border border-white/50 rounded-2xl p-8 shadow-sm overflow-hidden group">
              <div className="absolute top-0 right-0 w-64 h-64 bg-blue-100/50 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-blue-200/50" />

              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                <div>
                  <h1 className="text-4xl font-bold text-slate-900 tracking-tight">
                    Welcome back, <span className="text-blue-600">{user?.full_name?.split(' ')[0]}</span>!
                  </h1>
                  <p className="mt-2 text-lg text-slate-600">
                    Here is your cognitive health overview for today.
                  </p>
                </div>

                <div className="flex items-center gap-3 bg-white/50 backdrop-blur-sm px-4 py-2 rounded-full border border-white/60 shadow-sm">
                  <div className="relative">
                    <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20" />
                    <div className="w-3 h-3 bg-green-500 rounded-full relative z-10" />
                  </div>
                  <span className="text-sm font-medium text-slate-600">System Active</span>
                </div>
              </div>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-8 w-full max-w-5xl">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-800 text-sm flex items-center gap-2">
                <div className="w-2 h-2 bg-red-500 rounded-full" />
                {error}
              </div>
            </div>
          )}

          {/* SECTION 2: UNDERSTANDING YOUR HEALTH (Moved Up) */}
          <div className="w-full max-w-5xl mb-16">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2 mb-6">
              <Info className="h-5 w-5 text-blue-600" />
              Understanding Your Health
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                {
                  title: "Cognitive Test",
                  desc: "Standardized assessment to evaluate memory and recall.",
                  icon: <FileText className="h-6 w-6 text-blue-600" />,
                  color: "bg-blue-50"
                },
                {
                  title: "MRI Upload",
                  desc: "Secure analysis of brain imaging for structural changes.",
                  icon: <Upload className="h-6 w-6 text-purple-600" />,
                  color: "bg-purple-50"
                },
                {
                  title: "Get Results",
                  desc: "Comprehensive report with AI-driven insights.",
                  icon: <BarChart2 className="h-6 w-6 text-green-600" />,
                  color: "bg-green-50"
                }
              ].map((item, i) => (
                <div key={i} className="bg-white/60 backdrop-blur-sm border border-white/60 rounded-xl p-6 flex items-start gap-4 shadow-sm hover:bg-white/80 transition-colors">
                  <div className={`${item.color} p-3 rounded-lg`}>
                    {item.icon}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900">{item.title}</h3>
                    <p className="text-sm text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* SECTION 3: QUICK ACTIONS & UPDATES */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 w-full max-w-5xl mb-16">
            {/* Left Column: Quick Actions Grid */}
            <div className="lg:col-span-2 space-y-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Activity className="h-5 w-5 text-blue-600" />
                Quick Actions
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Start New Assessment */}
                <Link href="/assessment" className="block group">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-blue-200 h-full flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">New Assessment</h3>
                    <p className="text-sm text-slate-500">Start a new cognitive screening test</p>
                  </div>
                </Link>

                {/* Chat with Doctor */}
                {loading ? (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col items-center text-center opacity-70">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4 animate-pulse">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Loading...</h3>
                  </div>
                ) : assignedDoctor ? (
                  <button onClick={handleChatClick} className="block w-full h-full group text-left">
                    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-green-200 h-full flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                        <MessageCircle className="h-8 w-8 text-green-600" />
                      </div>
                      <h3 className="text-lg font-bold text-slate-900 mb-2">Chat with Doctor</h3>
                      <p className="text-sm text-slate-500">Message Dr. {doctorName}</p>
                    </div>
                  </button>
                ) : (
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 h-full flex flex-col items-center text-center opacity-60 cursor-not-allowed">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                      <MessageCircle className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Chat Unavailable</h3>
                    <p className="text-sm text-slate-500">No doctor assigned yet</p>
                  </div>
                )}

                {/* View Doctors */}
                <Link href="/view-doctors" className="block group">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-purple-200 h-full flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-purple-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">Find Doctors</h3>
                    <p className="text-sm text-slate-500">Connect with specialists</p>
                  </div>
                </Link>

                {/* Results History */}
                <Link href="/results-history" className="block group">
                  <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-md hover:border-orange-200 h-full flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-orange-50 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
                      <History className="h-8 w-8 text-orange-600" />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mb-2">History</h3>
                    <p className="text-sm text-slate-500">View past assessment results</p>
                  </div>
                </Link>
              </div>
            </div>

            {/* Right Column: Notifications Feed */}
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Bell className="h-5 w-5 text-blue-600" />
                Updates
              </h2>

              <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden min-h-[400px]">
                <div className="p-4 border-b border-gray-50 bg-gray-50/50">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recent Notifications</span>
                </div>
                <div className="p-4">
                  <Notifications maxDisplay={5} showMarkAllRead={true} />
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 4: DETECTION STAGES */}
          <div className="w-full max-w-5xl mb-12">
            <h2 className="text-xl font-bold text-slate-800 mb-6">Reference Guide: Detection Stages</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                {
                  label: "No Impedance",
                  desc: "Normal cognitive function with no signs of impairment.",
                  color: "bg-green-500"
                },
                {
                  label: "Very Mild",
                  desc: "Subjective memory complaints, but no objective cognitive decline.",
                  color: "bg-yellow-500"
                },
                {
                  label: "Mild",
                  desc: "Objective evidence of memory impairment in one or more cognitive domains.",
                  color: "bg-orange-500"
                },
                {
                  label: "Moderate",
                  desc: "Significant memory loss and cognitive decline affecting daily life.",
                  color: "bg-red-500"
                }
              ].map((stage, i) => (
                <div key={i} className="bg-white/50 backdrop-blur-sm border border-white/60 rounded-xl p-5 shadow-sm hover:shadow-md transition-all">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={`w-3 h-3 rounded-full ${stage.color}`} />
                    <h3 className="font-bold text-slate-900 text-sm">{stage.label}</h3>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {stage.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>

        </main>
      </div>
    </div>
  );
};

export default PatientDashboard;
