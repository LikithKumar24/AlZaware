import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Star, 
  Award, 
  Mail, 
  ArrowLeft,
  Building,
  GraduationCap,
  Briefcase,
  BookOpen,
  Users,
  CheckCircle,
  Phone,
  MapPin,
  Clock,
  Calendar
} from 'lucide-react';

interface ProfessionalDetailItem {
  title: string;
  description: string;
}

interface DoctorProfessionalDetails {
  education: ProfessionalDetailItem[];
  career_history: ProfessionalDetailItem[];
  specializations: string[];
  professional_experience: string;
  success_stories: ProfessionalDetailItem[];
}

interface Doctor {
  _id: string;
  email: string;
  full_name: string;
  age: number;
  role: string;
  profile_photo_url?: string;
  assigned_patients?: string[];
  professional_details?: DoctorProfessionalDetails;
}

interface PatientData {
  assigned_doctor?: string;
  doctor_requests?: Array<{
    doctor_id: string;
    doctor_email: string;
    status: string;
  }>;
}

export default function DoctorDetailPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { id } = router.query;
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [loading, setLoading] = useState(true);
  const [assigningDoctor, setAssigningDoctor] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (id) {
      fetchDoctorDetails();
      if (user.role === 'patient') {
        fetchPatientData();
      }
    }
  }, [user, id, router]);

  const fetchDoctorDetails = async () => {
    if (!token || !id) return;
    
    try {
      // Fetch all doctors and find the one with matching ID
      const response = await fetch('http://127.0.0.1:8000/doctors/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const doctors = await response.json();
        const foundDoctor = doctors.find((d: Doctor) => d._id === id);
        if (foundDoctor) {
          setDoctor(foundDoctor);
        } else {
          console.error('Doctor not found');
        }
      }
    } catch (error) {
      console.error('Error fetching doctor details:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchPatientData = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        console.log("patient.assigned_doctor:", data.assigned_doctor);
        console.log("patient.doctor_requests:", data.doctor_requests);
        setPatientData({
          assigned_doctor: data.assigned_doctor,
          doctor_requests: data.doctor_requests || [],
        });
      }
    } catch (error) {
      console.error('Error fetching patient data:', error);
    }
  };

  const sendDoctorRequest = async (doctorId: string) => {
    if (!token || !doctor) return;
    
    // Prevent duplicate requests
    const isUnderSupervision = patientData?.assigned_doctor === doctor.email;
    const isPending = patientData?.doctor_requests?.some(
      r => r.doctor_id === doctorId && r.status === 'pending'
    );
    
    if (isUnderSupervision || isPending) {
      console.log('Request blocked: Already assigned or pending');
      return;
    }
    
    setAssigningDoctor(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/patient/request-doctor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ doctor_email: doctor.email }),
      });

      if (response.ok) {
        const updatedPatient = await response.json();
        setPatientData({
          assigned_doctor: updatedPatient.assigned_doctor,
          doctor_requests: updatedPatient.doctor_requests || [],
        });
        alert(`Request sent to Dr. ${doctor.full_name}!`);
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to send request. Please try again.');
      }
    } catch (error) {
      console.error('Error sending request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setAssigningDoctor(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading doctor profile...</p>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-12 text-center">
            <h3 className="text-xl font-semibold text-slate-600 mb-4">Doctor not found</h3>
            <Link href="/view-doctors">
              <Button>Back to Doctors</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Link href="/view-doctors">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to Doctors
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Doctor Header Card */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl mb-8">
          <CardContent className="p-8">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Profile Photo */}
              <div className="relative">
                <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-white shadow-xl">
                  {doctor.profile_photo_url ? (
                    <img
                      src={doctor.profile_photo_url}
                      alt={doctor.full_name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-full flex items-center justify-center text-white font-bold text-5xl">
                      {doctor.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                <div className="absolute bottom-2 right-2 bg-green-500 p-2 rounded-full border-2 border-white">
                  <CheckCircle className="h-5 w-5 text-white" />
                </div>
              </div>

              {/* Doctor Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    Dr. {doctor.full_name}
                  </h1>
                  <p className="text-blue-700 font-semibold text-xl mb-3">
                    Board Certified Neurologist
                  </p>
                  <p className="text-slate-700 text-lg max-w-3xl">
                    {doctor.professional_details?.professional_experience || 
                     "Specialist in Cognitive Disorders and Alzheimer's Disease with extensive experience in neurological research and patient care."}
                  </p>
                </div>

                {/* Rating and Stats */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-6 mb-8">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <div className="flex items-center gap-1 text-yellow-500">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="w-6 h-6 fill-current" />
                      ))}
                    </div>
                    <span className="text-slate-700 font-semibold text-lg">4.9</span>
                    <span className="text-slate-500">(127 reviews)</span>
                  </div>
                  
                  <div className="hidden lg:block w-px h-8 bg-slate-300"></div>
                  
                  <div className="flex items-center justify-center lg:justify-start gap-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">{doctor.assigned_patients?.length || 0}</div>
                      <div className="text-slate-600 font-medium">Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">15+</div>
                      <div className="text-slate-600 font-medium">Years Exp.</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">12</div>
                      <div className="text-slate-600 font-medium">Certificates</div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                    <Mail className="h-5 w-5 text-blue-600" />
                    <span className="text-slate-700">{doctor.email}</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                    <Phone className="h-5 w-5 text-green-600" />
                    <span className="text-slate-700">+1 (555) 123-4567</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                    <Building className="h-5 w-5 text-orange-600" />
                    <span className="text-slate-700">University Hospital Medical Center</span>
                  </div>
                  <div className="flex items-center gap-3 bg-white/60 rounded-lg p-3">
                    <MapPin className="h-5 w-5 text-red-600" />
                    <span className="text-slate-700">Boston, MA</span>
                  </div>
                </div>

                {/* Action Button */}
                {user?.role === 'patient' && doctor && (() => {
                  const isUnderSupervision = patientData?.assigned_doctor === doctor.email;
                  const isPending = patientData?.doctor_requests?.some(
                    r => r.doctor_id === doctor._id && r.status === 'pending'
                  );
                  const isRejected = patientData?.doctor_requests?.some(
                    r => r.doctor_id === doctor._id && r.status === 'rejected'
                  );

                  if (isUnderSupervision) {
                    return (
                      <Button 
                        disabled
                        className="bg-green-50 text-green-800 border-2 border-green-300 shadow-lg px-8 py-6 text-lg cursor-not-allowed hover:bg-green-50"
                      >
                        <CheckCircle className="h-5 w-5 mr-3" />
                        ✓ Under Supervision
                      </Button>
                    );
                  } else if (isPending) {
                    return (
                      <Button 
                        disabled
                        className="bg-yellow-50 text-yellow-800 border-2 border-yellow-300 shadow-lg px-8 py-6 text-lg cursor-not-allowed hover:bg-yellow-50"
                      >
                        <Clock className="h-5 w-5 mr-3" />
                        ⏳ Request Pending
                      </Button>
                    );
                  } else if (isRejected) {
                    return (
                      <Button 
                        onClick={() => sendDoctorRequest(doctor._id)}
                        disabled={assigningDoctor}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        {assigningDoctor ? 'Sending Request...' : 'Request Again'}
                      </Button>
                    );
                  } else {
                    return (
                      <Button 
                        onClick={() => sendDoctorRequest(doctor._id)}
                        disabled={assigningDoctor}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-6 text-lg"
                      >
                        <Users className="h-5 w-5 mr-3" />
                        {assigningDoctor ? 'Sending Request...' : 'Assign as My Doctor'}
                      </Button>
                    );
                  }
                })()}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Specializations */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                  Specializations
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  {doctor.professional_details?.specializations?.length ? (
                    doctor.professional_details.specializations.map((spec, i) => (
                      <span
                        key={i}
                        className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium"
                      >
                        {spec}
                      </span>
                    ))
                  ) : (
                    <>
                      <span className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium">
                        Alzheimer's Disease
                      </span>
                      <span className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium">
                        Cognitive Disorders
                      </span>
                      <span className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium">
                        Neuroimaging
                      </span>
                      <span className="px-4 py-2 bg-purple-50 border border-purple-200 text-purple-700 rounded-full font-medium">
                        Memory Care
                      </span>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <GraduationCap className="h-6 w-6 text-green-600" />
                  Education & Qualifications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {doctor.professional_details?.education?.length ? (
                    doctor.professional_details.education.map((item, i) => (
                      <div key={i} className="border-l-4 border-green-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 text-lg">{item.title}</h4>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                    ))
                  ) : (
                    <>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 text-lg">MD in Neurology</h4>
                        <p className="text-slate-600">Harvard Medical School, 2008</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 text-lg">PhD in Cognitive Science</h4>
                        <p className="text-slate-600">MIT, 2012</p>
                      </div>
                      <div className="border-l-4 border-green-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 text-lg">Board Certification</h4>
                        <p className="text-slate-600">American Board of Psychiatry and Neurology</p>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Career History */}
            {doctor.professional_details?.career_history && doctor.professional_details.career_history.length > 0 && (
              <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-xl">
                    <Briefcase className="h-6 w-6 text-blue-600" />
                    Career History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {doctor.professional_details.career_history.map((item, i) => (
                      <div key={i} className="border-l-4 border-blue-500 pl-4 py-2">
                        <h4 className="font-semibold text-slate-900 text-lg">{item.title}</h4>
                        <p className="text-slate-600">{item.description}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Availability */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Clock className="h-5 w-5 text-blue-600" />
                  Availability
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Monday - Friday</span>
                    <span className="font-medium text-slate-900">9:00 AM - 5:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Saturday</span>
                    <span className="font-medium text-slate-900">10:00 AM - 2:00 PM</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-slate-600">Sunday</span>
                    <span className="font-medium text-red-600">Closed</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Research Interests */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Research Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-slate-700">Neurological imaging analysis</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-slate-700">AI in medical diagnostics</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-slate-700">Early dementia detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                    <span className="text-slate-700">Cognitive behavioral therapy</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Publications */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Award className="h-5 w-5 text-orange-600" />
                  Recent Publications
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">AI-Assisted Early Detection of Alzheimer's</span>
                    <p className="text-xs text-slate-500 mt-1">Journal of Neurology • 2024</p>
                  </li>
                  <li className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700 font-medium">MRI Pattern Recognition in Cognitive Decline</span>
                    <p className="text-xs text-slate-500 mt-1">Brain Research • 2023</p>
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
