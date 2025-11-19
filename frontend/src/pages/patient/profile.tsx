// src/pages/patient/profile.tsx
console.log("✅ Active PatientDashboard loaded");
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Camera,
  Star,
  Heart,
  Brain,
  Calendar,
  Clock,
  Users,
  FileText,
  TrendingUp,
  Activity,
  Shield,
  Award,
  ChevronRight,
  Eye,
  Download,
  MessageCircle
} from "lucide-react";

interface Assessment {
  prediction: string;
  confidence: number;
  created_at: string;
}

interface CognitiveTest {
  test_type: string;
  score: number;
  total_questions: number;
  created_at: string;
}

export default function PatientProfilePage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const [isUploading, setIsUploading] = useState(false);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [cognitiveTests, setCognitiveTests] = useState<CognitiveTest[]>([]);
  const [assignedDoctors, setAssignedDoctors] = useState<any[]>([]);

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role !== 'patient') {
      router.push("/profile");
    } else {
      fetchUserData();
    }
  }, [user, router]);

  const fetchUserData = async () => {
    if (!token) return;

    try {
      // Fetch assessments
      const assessmentsRes = await fetch('http://127.0.0.1:8000/assessments/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (assessmentsRes.ok) {
        const assessmentsData = await assessmentsRes.json();
        setAssessments(assessmentsData);
      }

      // Fetch cognitive tests
      const cognitiveRes = await fetch('http://127.0.0.1:8000/cognitive-tests/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (cognitiveRes.ok) {
        const cognitiveData = await cognitiveRes.json();
        setCognitiveTests(cognitiveData);
      }

      // Fetch all doctors (to show assigned doctors)
      const doctorsRes = await fetch('http://127.0.0.1:8000/doctors/all', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (doctorsRes.ok) {
        const doctorsData = await doctorsRes.json();
        // Filter doctors who have this patient assigned
        const assigned = doctorsData.filter((doctor: any) => 
          doctor.assigned_patients?.includes(user?.email)
        );
        setAssignedDoctors(assigned);
        console.log("[ChatBanner] Assigned doctors:", assigned);
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && token) {
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('http://127.0.0.1:8000/users/me/photo', {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        if (response.ok) {
          const updatedUser = await response.json();
          updateUser(updatedUser);
        } else {
          console.error('Failed to upload photo');
        }
      } catch (error) {
        console.error('Error uploading photo:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const getHealthStatus = () => {
    if (assessments.length === 0) return { status: 'Unknown', color: 'bg-gray-500', bgColor: 'bg-gray-50' };
    
    const latestAssessment = assessments[0];
    const prediction = latestAssessment.prediction.toLowerCase();
    
    if (prediction.includes('moderate')) {
      return { status: 'Needs Attention', color: 'bg-red-500', bgColor: 'bg-red-50' };
    } else if (prediction.includes('mild')) {
      return { status: 'Monitor Closely', color: 'bg-orange-500', bgColor: 'bg-orange-50' };
    } else if (prediction.includes('very mild')) {
      return { status: 'Stable', color: 'bg-yellow-500', bgColor: 'bg-yellow-50' };
    } else {
      return { status: 'Healthy', color: 'bg-green-500', bgColor: 'bg-green-50' };
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateCognitivePercentage = (score: number, total: number) => {
    return Math.round((score / total) * 100);
  };

  const handleChatClick = () => {
    if (assignedDoctors.length > 0) {
      const doctorEmail = assignedDoctors[0].email;
      console.log("[ChatBanner] Opening chat with doctor:", doctorEmail);
      router.push(`/chat?email=${doctorEmail}`);
    }
  };

  const getDoctorDisplayName = (doctor: any) => {
    return doctor.full_name || doctor.email.split('@')[0];
  };

  if (!user) return null;

  const healthStatus = getHealthStatus();
  const latestAssessment = assessments[0];
  const latestCognitiveTest = cognitiveTests[0];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h1 className="text-3xl font-bold text-teal-700">AlzAware</h1>
          <div className="text-sm text-gray-500">
            Welcome, <span className="font-semibold">{user.full_name}</span>
          </div>
        </header>

        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-teal-50 to-emerald-100 border-teal-200 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {user.profile_photo_url ? (
                    <img
                      src={`${user.profile_photo_url}?t=${Date.now()}`}
                      alt={user.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-teal-500 to-emerald-600 h-full flex items-center justify-center text-white font-bold text-5xl">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                
                {/* Camera Upload Button */}
                <label htmlFor="photo-upload" className="absolute bottom-2 right-2 bg-teal-600 hover:bg-teal-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all duration-200 hover:scale-110">
                  <Camera className="h-5 w-5" />
                  <input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                {isUploading && (
                  <div className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                  </div>
                )}
              </div>

              {/* Patient Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    {user.full_name}
                  </h1>
                  <p className="text-teal-700 font-semibold text-xl capitalize mb-3">
                    Patient • Age {user.age}
                  </p>
                  <div className={`inline-flex items-center px-4 py-2 rounded-full ${healthStatus.bgColor} border border-opacity-30`}>
                    <div className={`w-3 h-3 ${healthStatus.color} rounded-full mr-3`}></div>
                    <span className="font-medium text-slate-700">Status: {healthStatus.status}</span>
                  </div>
                </div>

                {/* Health Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-teal-600">{assessments.length}</div>
                    <div className="text-slate-600 font-medium">MRI Scans</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-emerald-600">{cognitiveTests.length}</div>
                    <div className="text-slate-600 font-medium">Cognitive Tests</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-cyan-600">{assignedDoctors.length}</div>
                    <div className="text-slate-600 font-medium">Assigned Doctors</div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col lg:flex-row gap-6 text-slate-600 mb-6">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <span className="text-xl">📧</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <span className="text-xl">🏥</span>
                    <span className="font-medium">University Hospital Medical Center</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Spans 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Health Summary */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Heart className="h-6 w-6 text-red-500" />
                  Health Summary
                </CardTitle>
                <CardDescription>Your latest health metrics and assessments</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Latest MRI Result */}
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="flex items-center mb-4">
                      <Brain className="h-6 w-6 text-blue-600 mr-3" />
                      <h3 className="font-semibold text-slate-900">Latest MRI Scan</h3>
                    </div>
                    {latestAssessment ? (
                      <>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-slate-900">{latestAssessment.prediction}</span>
                          <p className="text-sm text-slate-600 mt-1">
                            Confidence: {(latestAssessment.confidence * 100).toFixed(1)}%
                          </p>
                        </div>
                        <p className="text-sm text-slate-500">{formatDate(latestAssessment.created_at)}</p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">No MRI scans available</p>
                    )}
                  </div>

                  {/* Latest Cognitive Test */}
                  <div className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border border-purple-200">
                    <div className="flex items-center mb-4">
                      <Award className="h-6 w-6 text-purple-600 mr-3" />
                      <h3 className="font-semibold text-slate-900">Latest Cognitive Test</h3>
                    </div>
                    {latestCognitiveTest ? (
                      <>
                        <div className="mb-3">
                          <span className="text-2xl font-bold text-slate-900">
                            {latestCognitiveTest.score}/{latestCognitiveTest.total_questions}
                          </span>
                          <div className="flex items-center mt-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-purple-600 h-2 rounded-full" 
                                style={{ width: `${calculateCognitivePercentage(latestCognitiveTest.score, latestCognitiveTest.total_questions)}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-medium text-purple-600">
                              {calculateCognitivePercentage(latestCognitiveTest.score, latestCognitiveTest.total_questions)}%
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-500">{formatDate(latestCognitiveTest.created_at)}</p>
                      </>
                    ) : (
                      <p className="text-slate-500 italic">No cognitive tests available</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Reports */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <FileText className="h-6 w-6 text-blue-600" />
                  Recent Medical Reports
                </CardTitle>
                <CardDescription>Your assessment history and test results</CardDescription>
              </CardHeader>
              <CardContent>
                {assessments.length === 0 && cognitiveTests.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">No reports yet</h3>
                    <p className="text-slate-500 mb-6">Start by taking an MRI assessment or cognitive test</p>
                    <div className="flex gap-4 justify-center">
                      <Button onClick={() => router.push('/assessment')} className="bg-teal-600 hover:bg-teal-700">
                        Take MRI Assessment
                      </Button>
                      <Button onClick={() => router.push('/cognitive-test')} variant="outline">
                        Cognitive Test
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* MRI Assessments */}
                    {assessments.slice(0, 3).map((assessment, index) => (
                      <div key={index} className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="p-2 bg-blue-100 rounded-lg mr-4">
                          <Brain className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">MRI Assessment</h4>
                          <p className="text-sm text-slate-600">{assessment.prediction} • {(assessment.confidence * 100).toFixed(1)}% confidence</p>
                          <p className="text-xs text-slate-500">{formatDate(assessment.created_at)}</p>
                        </div>
                      </div>
                    ))}

                    {/* Cognitive Tests */}
                    {cognitiveTests.slice(0, 3).map((test, index) => (
                      <div key={index} className="flex items-center p-4 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
                        <div className="p-2 bg-purple-100 rounded-lg mr-4">
                          <Award className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-semibold text-slate-900">Cognitive Test</h4>
                          <p className="text-sm text-slate-600">Score: {test.score}/{test.total_questions} ({calculateCognitivePercentage(test.score, test.total_questions)}%)</p>
                          <p className="text-xs text-slate-500">{formatDate(test.created_at)}</p>
                        </div>
                      </div>
                    ))}

                    <Button 
                      onClick={() => router.push('/results-history')} 
                      className="w-full bg-gradient-to-r from-blue-600 to-teal-600 hover:from-blue-700 hover:to-teal-700 text-white font-semibold py-3 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <FileText className="h-5 w-5 mr-2" />
                      View All Reports
                      <ChevronRight className="h-5 w-5 ml-2" />
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Assigned Doctors */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Users className="h-5 w-5 text-teal-600" />
                  Your Medical Team
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedDoctors.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-500 text-sm mb-4">No doctors assigned yet</p>
                    <Button onClick={() => router.push('/doctors/all')} size="sm" className="bg-teal-600 hover:bg-teal-700">
                      Find a Doctor
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {assignedDoctors.map((doctor, index) => (
                      <div key={index} className="flex items-center p-3 bg-teal-50 rounded-lg">
                        <div className="w-10 h-10 bg-teal-500 rounded-full flex items-center justify-center text-white font-semibold mr-3">
                          {doctor.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-slate-900">Dr. {doctor.full_name}</h4>
                          <p className="text-sm text-slate-600">Neurologist</p>
                        </div>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="w-4 h-4 fill-current" />
                          <span className="text-xs text-slate-600">4.9</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Chat with Doctor Section */}
            {assignedDoctors.length > 0 ? (
              <Card className="shadow-lg border-0 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-300">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-green-600 p-3 rounded-full">
                        <MessageCircle className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-green-900 text-lg">💬 Message Your Doctor</h3>
                        <p className="text-sm text-green-700">
                          Dr. {getDoctorDisplayName(assignedDoctors[0])} • Real-time chat available
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={handleChatClick}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md shadow-md hover:shadow-lg transition-all"
                    >
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Open Chat
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-lg border-0 bg-gray-50">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <MessageCircle className="h-6 w-6 text-gray-400" />
                    <div>
                      <p className="text-gray-600 text-sm">
                        No doctor assigned yet. Visit 'View Doctors' to request supervision.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Upcoming Appointments */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Calendar className="h-5 w-5 text-emerald-600" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">Follow-up Consultation</h4>
                      <span className="text-xs text-emerald-600 font-medium">Tomorrow</span>
                    </div>
                    <p className="text-sm text-slate-600">Dr. Sarah Johnson</p>
                    <div className="flex items-center mt-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      2:30 PM - 3:00 PM
                    </div>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-semibold text-slate-900">MRI Scan</h4>
                      <span className="text-xs text-blue-600 font-medium">Next Week</span>
                    </div>
                    <p className="text-sm text-slate-600">Radiology Department</p>
                    <div className="flex items-center mt-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3 mr-1" />
                      Oct 18, 10:00 AM
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Health Tips */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Shield className="h-5 w-5 text-green-600" />
                  Health Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 text-sm">
                  <div className="p-3 bg-green-50 rounded-lg">
                    <h4 className="font-semibold text-green-800 mb-1">Stay Active</h4>
                    <p className="text-green-700">Regular exercise can help maintain cognitive function.</p>
                  </div>
                  
                  <div className="p-3 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-blue-800 mb-1">Mental Stimulation</h4>
                    <p className="text-blue-700">Engage in puzzles, reading, or learning new skills.</p>
                  </div>
                  
                  <div className="p-3 bg-purple-50 rounded-lg">
                    <h4 className="font-semibold text-purple-800 mb-1">Social Connection</h4>
                    <p className="text-purple-700">Maintain relationships and social activities.</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}