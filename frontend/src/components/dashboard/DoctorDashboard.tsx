// src/components/dashboard/DoctorDashboard.tsx
import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Users, AlertTriangle, Brain, Activity, Clock, Award, Eye, UserPlus, AlertCircle, MessageCircle } from 'lucide-react';
import PatientRequests from '@/components/doctor/PatientRequests';

interface Patient {
  full_name: string;
  email: string;
}

interface Assessment {
  prediction: string;
  confidence: number;
  created_at: string;
}

interface CognitiveTestResult {
  score: number;
  total_questions: number;
  created_at: string;
}

interface PatientSummary extends Patient {
  last_mri_result: Assessment | null;
  last_cognitive_score: CognitiveTestResult | null;
}

interface DoctorDashboardData {
  total_patients: number;
  high_risk_cases_count: number;
  my_patients_summary: PatientSummary[];
  high_risk_patients: HighRiskCase[];
}

interface HighRiskCase {
  patient_full_name: string;
  prediction: string;
  confidence: number;
  created_at: string;
  owner_email: string;
}

export default function DoctorDashboard() {
  const { user, token, logout } = useAuth();
  const [dashboardData, setDashboardData] = useState<DoctorDashboardData | null>(null);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [allHighRiskCases, setAllHighRiskCases] = useState<HighRiskCase[]>([]);
  const [activeTab, setActiveTab] = useState('overview');
  const [error, setError] = useState<string | null>(null);
  const [assigningPatient, setAssigningPatient] = useState<string | null>(null);

  // Get emails of assigned patients for quick lookup
  const assignedPatientEmails = useMemo(() => {
    if (!dashboardData?.my_patients_summary) return new Set<string>();
    return new Set(dashboardData.my_patients_summary.map(p => p.email));
  }, [dashboardData]);

  // Filter high-risk cases from assigned patients only (for overview section)
  const myHighRiskPatients = useMemo(() => {
    if (!dashboardData?.my_patients_summary) return [];
    
    return dashboardData.my_patients_summary
      .filter(patient => {
        if (!patient.last_mri_result) return false;
        
        const prediction = patient.last_mri_result.prediction;
        // Include Moderate and Severe Impairment as high-risk
        return prediction.includes('Moderate') || prediction.includes('Severe');
      })
      .map(patient => ({
        patient_full_name: patient.full_name,
        prediction: patient.last_mri_result!.prediction,
        confidence: patient.last_mri_result!.confidence,
        created_at: patient.last_mri_result!.created_at,
        owner_email: patient.email
      }));
  }, [dashboardData]);

  const handleAuthError = (status: number, context: string) => {
    console.error(`[DoctorDashboard] ${status} error in ${context}`);
    if (status === 401 || status === 403) {
      setError('Your session has expired or you are not authorized. Please log in again.');
      setTimeout(() => {
        logout();
      }, 2000);
    }
  };

  const fetchDashboardData = async () => {
    if (!token || token.trim() === '') {
      console.error('[DoctorDashboard] Invalid token for dashboard data');
      return;
    }
    
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/doctor/dashboard-summary',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
        setError(null);
      } else {
        handleAuthError(response.status, 'fetchDashboardData');
      }
    } catch (error) {
      console.error('[DoctorDashboard] Failed to fetch dashboard data:', error);
      setError('Failed to load dashboard data. Please try again.');
    }
  };

  const fetchAllPatients = async () => {
    if (!token || token.trim() === '') {
      console.error('[DoctorDashboard] Invalid token for all patients');
      return;
    }
    
    try {
      const response = await fetch('http://127.0.0.1:8000/patients/all', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setAllPatients(data);
        setError(null);
      } else {
        handleAuthError(response.status, 'fetchAllPatients');
      }
    } catch (error) {
      console.error('[DoctorDashboard] Failed to fetch all patients:', error);
      setError('Failed to load patients. Please try again.');
    }
  };

  const fetchAllHighRiskCases = async () => {
    if (!token || token.trim() === '') {
      console.error('[DoctorDashboard] Invalid token for high-risk cases');
      return;
    }
    
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/assessments/high-risk',
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.ok) {
        const data = await response.json();
        setAllHighRiskCases(data);
        setError(null);
      } else {
        // Silently handle errors - don't show to user
        console.error('[DoctorDashboard] Failed to fetch high-risk cases:', response.status);
        setAllHighRiskCases([]);
      }
    } catch (error) {
      // Silently handle errors - don't show to user
      console.error('[DoctorDashboard] Failed to fetch high-risk cases:', error);
      setAllHighRiskCases([]);
    }
  };

  const handleAssignPatientFromHighRisk = async (patientEmail: string) => {
    if (!token || token.trim() === '') {
      console.error('[DoctorDashboard] Invalid token for assign patient');
      return;
    }
    
    setAssigningPatient(patientEmail);
    
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/doctor/assign-patient',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patient_email: patientEmail }),
        }
      );
      if (response.ok) {
        // Refresh both dashboard data and high-risk cases
        await Promise.all([fetchDashboardData(), fetchAllHighRiskCases()]);
        setError(null);
      } else {
        handleAuthError(response.status, 'handleAssignPatientFromHighRisk');
      }
    } catch (error) {
      console.error('[DoctorDashboard] Failed to assign patient:', error);
      setError('Failed to assign patient. Please try again.');
    } finally {
      setAssigningPatient(null);
    }
  };

  const handleAssignPatient = async (patientEmail: string) => {
    if (!token || token.trim() === '') {
      console.error('[DoctorDashboard] Invalid token for assign patient');
      return;
    }
    
    try {
      const response = await fetch(
        'http://127.0.0.1:8000/doctor/assign-patient',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ patient_email: patientEmail }),
        }
      );
      if (response.ok) {
        setActiveTab('overview');
        fetchDashboardData();
        setError(null);
      } else {
        handleAuthError(response.status, 'handleAssignPatient');
      }
    } catch (error) {
      console.error('[DoctorDashboard] Failed to assign patient:', error);
      setError('Failed to assign patient. Please try again.');
    }
  };

  const getRiskLevelColor = (prediction: string) => {
    switch (prediction) {
      case 'Moderate Impairment':
        return 'text-red-700 bg-red-100 border-red-300';
      case 'Mild Impairment':
        return 'text-orange-700 bg-orange-100 border-orange-300';
      case 'Very Mild Impairment':
        return 'text-yellow-700 bg-yellow-100 border-yellow-300';
      default:
        return 'text-green-700 bg-green-100 border-green-300';
    }
  };

  const getRiskIcon = (prediction: string) => {
    if (prediction.includes('Moderate')) return <AlertTriangle className="h-3 w-3 text-red-600" />;
    if (prediction.includes('Mild')) return <AlertTriangle className="h-3 w-3 text-orange-600" />;
    return <Activity className="h-3 w-3 text-green-600" />;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const calculateCognitivePercentage = (score: number, total: number) => {
    const numScore = Number(score) || 0;
    const numTotal = Number(total) || 0;
    if (numTotal === 0 || !numTotal || !numScore) return 0;
    const percentage = (numScore / numTotal) * 100;
    return isNaN(percentage) || !isFinite(percentage) ? 0 : Math.round(percentage);
  };

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchDashboardData();
    } else if (activeTab === 'all-patients') {
      fetchAllPatients();
    } else if (activeTab === 'high-risk') {
      fetchAllHighRiskCases();
    }
  }, [activeTab, token]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50/30">
      {/* Fixed Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900">Doctor Dashboard</h1>
              <p className="text-slate-600 mt-1">Welcome back, Dr. {user?.full_name}</p>
            </div>
            <div className="hidden sm:flex items-center space-x-2 text-sm text-slate-500">
              <Clock className="h-4 w-4" />
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
          <div className="p-0">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              {/* Tab Navigation */}
              <div className="bg-gradient-to-r from-slate-50/80 to-blue-50/80 px-6 pt-6 pb-4">
                <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 bg-white/90 p-1 rounded-xl shadow-md border border-slate-200/70">
                  <TabsTrigger
                    value="overview"
                    className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 hover:bg-slate-100"
                  >
                    <Activity className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Overview</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="requests"
                    className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 hover:bg-slate-100"
                  >
                    <UserPlus className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Requests</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="all-patients"
                    className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 hover:bg-slate-100"
                  >
                    <Users className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">Patients</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="high-risk"
                    className="flex items-center justify-center px-3 py-2.5 text-sm font-medium text-slate-600 data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-md rounded-lg transition-all duration-300 hover:bg-slate-100"
                  >
                    <AlertTriangle className="h-4 w-4 mr-1.5" />
                    <span className="hidden sm:inline">High-Risk</span>
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Tab Content */}
              <div className="px-6 pb-6">
                {error && (
                  <Alert variant="destructive" className="mt-6">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                
                <TabsContent value="overview" className="mt-6 space-y-6">
                  {/* Statistics Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-blue-700 uppercase tracking-wide">Total Patients</p>
                            <p className="text-2xl font-bold text-blue-900 mt-1">
                              {dashboardData?.total_patients ?? '...'}
                            </p>
                          </div>
                          <div className="p-2 bg-blue-600 rounded-lg">
                            <Users className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-red-700 uppercase tracking-wide">High-Risk</p>
                            <p className="text-2xl font-bold text-red-900 mt-1">
                              {myHighRiskPatients.length}
                            </p>
                          </div>
                          <div className="p-2 bg-red-600 rounded-lg">
                            <AlertTriangle className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-green-700 uppercase tracking-wide">Assessments</p>
                            <p className="text-2xl font-bold text-green-900 mt-1">
                              {dashboardData?.my_patients_summary.filter(p => p.last_mri_result).length ?? '...'}
                            </p>
                          </div>
                          <div className="p-2 bg-green-600 rounded-lg">
                            <Brain className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 shadow-md hover:shadow-lg transition-all duration-300">
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium text-purple-700 uppercase tracking-wide">Cognitive Tests</p>
                            <p className="text-2xl font-bold text-purple-900 mt-1">
                              {dashboardData?.my_patients_summary.filter(p => p.last_cognitive_score).length ?? '...'}
                            </p>
                          </div>
                          <div className="p-2 bg-purple-600 rounded-lg">
                            <Award className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Patients Summary Section */}
                  <Card className="border border-slate-200 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-slate-900 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        My Patients
                      </CardTitle>
                      <CardDescription>Overview of assigned patients and their latest results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {dashboardData?.my_patients_summary.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-slate-600 mb-2">No patients assigned</h3>
                          <p className="text-slate-500 mb-6">Start by assigning patients from the "Patients" tab</p>
                          <Button onClick={() => setActiveTab('all-patients')} className="bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                            View All Patients
                          </Button>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {dashboardData?.my_patients_summary.map((patient) => (
                            <Card key={patient.email} className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                              <CardContent className="p-4">
                                <div className="flex items-center mb-3">
                                  <div className="h-10 w-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                    {patient.full_name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <Link href={`/patient/${patient.email}`} className="font-semibold text-slate-900 hover:text-blue-600 transition-colors block truncate">
                                      {patient.full_name}
                                    </Link>
                                    <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                                  </div>
                                </div>

                                <div className="space-y-3">
                                  {/* MRI Result */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <Brain className="h-3 w-3 text-blue-600 mr-1.5" />
                                      <span className="text-xs font-medium text-slate-700">Latest MRI</span>
                                    </div>
                                    {patient.last_mri_result ? (
                                      <div>
                                        <div className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium border ${getRiskLevelColor(patient.last_mri_result.prediction)} mb-1`}>
                                          {getRiskIcon(patient.last_mri_result.prediction)}
                                          <span className="ml-1 truncate">{patient.last_mri_result.prediction}</span>
                                        </div>
                                        <p className="text-xs text-slate-600">{(patient.last_mri_result.confidence * 100).toFixed(1)}% confidence</p>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">No results</p>
                                    )}
                                  </div>

                                  {/* Cognitive Score */}
                                  <div className="bg-slate-50 rounded-lg p-3">
                                    <div className="flex items-center mb-2">
                                      <Award className="h-3 w-3 text-purple-600 mr-1.5" />
                                      <span className="text-xs font-medium text-slate-700">Cognitive Test</span>
                                    </div>
                                    {patient.last_cognitive_score ? (
                                      <div className="flex items-center justify-between">
                                        <span className="text-sm font-semibold text-slate-900">
                                          {patient.last_cognitive_score.score}/{patient.last_cognitive_score.total_questions}
                                        </span>
                                        <span className={`px-2 py-1 rounded-md text-xs font-medium ${
                                          calculateCognitivePercentage(patient.last_cognitive_score.score, patient.last_cognitive_score.total_questions) >= 80 
                                            ? 'bg-green-100 text-green-800'
                                            : calculateCognitivePercentage(patient.last_cognitive_score.score, patient.last_cognitive_score.total_questions) >= 60
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                        }`}>
                                          {calculateCognitivePercentage(patient.last_cognitive_score.score, patient.last_cognitive_score.total_questions)}%
                                        </span>
                                      </div>
                                    ) : (
                                      <p className="text-xs text-slate-500 italic">No results</p>
                                    )}
                                  </div>
                                </div>

                                <div className="mt-4 flex gap-2">
                                  <Link href={`/patient/${patient.email}`} className="flex-1">
                                    <Button 
                                      size="sm" 
                                      className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                      <Eye className="h-4 w-4 mr-2" />
                                      View Details
                                    </Button>
                                  </Link>
                                  <Link href={`/chat?email=${patient.email}`} className="flex-1">
                                    <Button 
                                      size="sm" 
                                      className="w-full bg-green-600 hover:bg-green-700 text-white shadow-sm hover:shadow-md transition-all duration-300"
                                    >
                                      <MessageCircle className="h-4 w-4 mr-2" />
                                      Chat
                                    </Button>
                                  </Link>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  {/* High-Risk Alerts */}
                  {myHighRiskPatients.length > 0 && (
                    <Card className="border border-red-200 bg-gradient-to-r from-red-50/50 to-orange-50/50">
                      <CardHeader className="pb-4">
                        <CardTitle className="text-xl font-semibold text-red-900 flex items-center">
                          <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                          High-Risk Alerts
                        </CardTitle>
                        <CardDescription className="text-red-700">Your patients requiring immediate attention</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {myHighRiskPatients.slice(0, 4).map((riskCase, index) => (
                            <Card key={`${riskCase.owner_email}-${index}`} className="border border-red-200 bg-white hover:shadow-md transition-all duration-300">
                              <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center flex-1 min-w-0">
                                    <div className="h-8 w-8 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-semibold mr-3">
                                      {riskCase.patient_full_name.split(' ').map(n => n[0]).join('')}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <Link href={`/patient/${riskCase.owner_email}`} className="font-semibold text-slate-900 hover:text-red-600 transition-colors block truncate">
                                        {riskCase.patient_full_name}
                                      </Link>
                                      <p className="text-xs text-slate-500">{formatDate(riskCase.created_at)}</p>
                                    </div>
                                  </div>
                                  <Link href={`/patient/${riskCase.owner_email}`}>
                                    <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white ml-2 shadow-md hover:shadow-lg transition-all duration-300">
                                      Review
                                    </Button>
                                  </Link>
                                </div>
                                <div className={`mt-3 inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${getRiskLevelColor(riskCase.prediction)}`}>
                                  {getRiskIcon(riskCase.prediction)}
                                  <span className="ml-1">{riskCase.prediction}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </TabsContent>

                <TabsContent value="requests" className="mt-6">
                  <PatientRequests />
                </TabsContent>

                <TabsContent value="all-patients" className="mt-6">
                  <Card className="border border-slate-200 shadow-md">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-slate-900 flex items-center">
                        <Users className="h-5 w-5 mr-2 text-blue-600" />
                        All Patients
                      </CardTitle>
                      <CardDescription>Browse and assign patients to your care</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {allPatients.length === 0 ? (
                        <div className="text-center py-12">
                          <Users className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-slate-600 mb-2">No patients found</h3>
                          <p className="text-slate-500">No patients are registered in the system yet.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {allPatients.map((patient) => (
                            <Card key={patient.email} className="border border-slate-200 hover:border-blue-300 hover:shadow-md transition-all duration-300">
                              <CardContent className="p-4">
                                <div className="flex items-center mb-4">
                                  <div className="h-10 w-10 bg-gradient-to-br from-slate-400 to-slate-600 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                    {patient.full_name.split(' ').map(n => n[0]).join('')}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-slate-900 truncate">{patient.full_name}</h3>
                                    <p className="text-xs text-slate-500 truncate">{patient.email}</p>
                                  </div>
                                </div>
                                <Button 
                                  onClick={() => handleAssignPatient(patient.email)}
                                  className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300"
                                >
                                  <Users className="h-4 w-4 mr-2" />
                                  Assign to Me
                                </Button>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="high-risk" className="mt-6">
                  <Card className="border border-red-200 shadow-md bg-gradient-to-r from-red-50/30 to-orange-50/30">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl font-semibold text-red-900 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                        High-Risk Cases
                      </CardTitle>
                      <CardDescription className="text-red-700">All patients with concerning assessment results</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {allHighRiskCases.length === 0 ? (
                        <div className="text-center py-12">
                          <AlertTriangle className="h-16 w-16 text-green-300 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold text-green-600 mb-2">No high-risk cases</h3>
                          <p className="text-green-500">Great news! There are currently no high-risk patients.</p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {allHighRiskCases.map((riskCase, index) => {
                            const isAssigned = assignedPatientEmails.has(riskCase.owner_email);
                            const isAssigning = assigningPatient === riskCase.owner_email;
                            
                            return (
                              <Card key={`${riskCase.owner_email}-${index}`} className="border border-red-200 bg-white hover:shadow-md transition-all duration-300">
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between mb-3">
                                    <div className="flex items-center flex-1 min-w-0">
                                      <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center text-white font-semibold text-sm mr-3">
                                        {riskCase.patient_full_name.split(' ').map(n => n[0]).join('')}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        {isAssigned ? (
                                          <Link href={`/patient/${riskCase.owner_email}`} className="font-semibold text-slate-900 hover:text-red-600 transition-colors block truncate">
                                            {riskCase.patient_full_name}
                                          </Link>
                                        ) : (
                                          <p className="font-semibold text-slate-900 block truncate">
                                            {riskCase.patient_full_name}
                                          </p>
                                        )}
                                        <p className="text-xs text-slate-500">{formatDate(riskCase.created_at)}</p>
                                      </div>
                                    </div>
                                    {isAssigned ? (
                                      <Link href={`/patient/${riskCase.owner_email}`}>
                                        <Button size="sm" className="bg-red-600 hover:bg-red-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                                          <Eye className="h-4 w-4 mr-2" />
                                          Review Case
                                        </Button>
                                      </Link>
                                    ) : (
                                      <Button 
                                        size="sm" 
                                        onClick={() => handleAssignPatientFromHighRisk(riskCase.owner_email)}
                                        disabled={isAssigning}
                                        className="bg-amber-600 hover:bg-amber-700 text-white shadow-md hover:shadow-lg transition-all duration-300 disabled:opacity-50"
                                      >
                                        <UserPlus className="h-4 w-4 mr-2" />
                                        {isAssigning ? 'Assigning...' : 'Assign to View'}
                                      </Button>
                                    )}
                                  </div>
                                  <div className="space-y-2">
                                    <div className={`inline-flex items-center px-3 py-1 rounded-md text-sm font-medium ${getRiskLevelColor(riskCase.prediction)}`}>
                                      {getRiskIcon(riskCase.prediction)}
                                      <span className="ml-2">{riskCase.prediction}</span>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                      {(riskCase.confidence * 100).toFixed(1)}% confidence level
                                    </p>
                                  </div>
                                </CardContent>
                              </Card>
                            );
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </Card>
      </div>
    </div>
  );
}