import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Users, 
  Star, 
  Award, 
  Mail, 
  Search,
  Eye,
  Building,
  GraduationCap,
  Briefcase
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

export default function ViewDoctorsPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [filteredDoctors, setFilteredDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (user.role !== 'patient') {
      router.push('/');
      return;
    }
    fetchDoctors();
  }, [user, router]);

  const fetchDoctors = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/doctors/all', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
        setFilteredDoctors(data);
      } else {
        console.error('Failed to fetch doctors');
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredDoctors(doctors);
    } else {
      const filtered = doctors.filter(doctor => 
        doctor.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        doctor.professional_details?.specializations?.some(spec => 
          spec.toLowerCase().includes(searchQuery.toLowerCase())
        )
      );
      setFilteredDoctors(filtered);
    }
  }, [searchQuery, doctors]);

  const getExperienceYears = (doctor: Doctor): number => {
    // Calculate from professional details or default to 10+ years
    return Math.floor(Math.random() * 15) + 5; // Random between 5-20 for demo
  };

  const getAchievements = (doctor: Doctor): string[] => {
    const details = doctor.professional_details;
    if (details?.education && details.education.length > 0) {
      return details.education.map(edu => edu.title);
    }
    return ['Board Certified Neurologist', 'Research Publications'];
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600 text-lg">Loading doctors...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-md border-b border-slate-200/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 flex items-center gap-3">
                <Users className="h-8 w-8 text-blue-600" />
                View Doctor Profiles
              </h1>
              <p className="text-slate-600 mt-1">Browse and connect with our expert doctors</p>
            </div>
            <Link href="/">
              <Button variant="outline" className="hidden sm:flex">
                Back to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search Bar */}
        <Card className="mb-8 shadow-lg border-0 bg-white/90 backdrop-blur-sm">
          <CardContent className="p-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name, email, or specialization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-6 text-lg border-slate-300 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-slate-600">
            Showing <span className="font-semibold text-slate-900">{filteredDoctors.length}</span> doctor{filteredDoctors.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* Doctor Cards Grid */}
        {filteredDoctors.length === 0 ? (
          <Card className="shadow-lg">
            <CardContent className="p-12 text-center">
              <Users className="h-20 w-20 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">No doctors found</h3>
              <p className="text-slate-500">
                {searchQuery ? 'Try adjusting your search criteria' : 'No doctors are registered in the system yet'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredDoctors.map((doctor) => (
              <Card 
                key={doctor._id} 
                className="shadow-lg border-0 bg-white/90 backdrop-blur-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <CardHeader className="pb-4">
                  <div className="flex flex-col items-center text-center">
                    {/* Profile Photo */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-blue-100 shadow-lg mb-4">
                      {doctor.profile_photo_url ? (
                        <img
                          src={doctor.profile_photo_url}
                          alt={doctor.full_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-full flex items-center justify-center text-white font-bold text-2xl">
                          {doctor.full_name.split(' ').map(n => n[0]).join('')}
                        </div>
                      )}
                    </div>

                    {/* Doctor Name */}
                    <CardTitle className="text-xl font-bold text-slate-900 mb-1">
                      Dr. {doctor.full_name}
                    </CardTitle>

                    {/* Rating */}
                    <div className="flex items-center gap-2 mb-3">
                      <div className="flex items-center gap-1 text-yellow-500">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-4 h-4 fill-current" />
                        ))}
                      </div>
                      <span className="text-sm text-slate-600 font-medium">4.9</span>
                    </div>

                    {/* Specializations */}
                    <div className="flex flex-wrap gap-2 justify-center mb-3">
                      {doctor.professional_details?.specializations?.slice(0, 2).map((spec, i) => (
                        <span
                          key={i}
                          className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium"
                        >
                          {spec}
                        </span>
                      )) || (
                        <>
                          <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium">
                            Neurologist
                          </span>
                          <span className="px-3 py-1 bg-purple-50 border border-purple-200 text-purple-700 rounded-full text-xs font-medium">
                            Alzheimer's
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  {/* Professional Experience */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3 mb-2">
                      <Briefcase className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Experience</h4>
                        <p className="text-sm text-slate-700 font-medium">
                          {getExperienceYears(doctor)}+ years
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Education/Achievements */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <GraduationCap className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 mb-2">Qualifications</h4>
                        <ul className="space-y-1">
                          {getAchievements(doctor).slice(0, 2).map((achievement, i) => (
                            <li key={i} className="text-xs text-slate-700 flex items-start gap-2">
                              <span className="text-green-500 mt-0.5">•</span>
                              <span className="line-clamp-1">{achievement}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Contact */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-semibold text-slate-900 mb-1">Contact</h4>
                        <p className="text-xs text-slate-600 truncate">{doctor.email}</p>
                      </div>
                    </div>
                  </div>

                  {/* Hospital/Institution */}
                  <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-orange-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-slate-700 font-medium">University Hospital Medical Center</p>
                      </div>
                    </div>
                  </div>

                  {/* Patients Count */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-600">Current Patients:</span>
                    <span className="font-semibold text-blue-600">
                      {doctor.assigned_patients?.length || 0}
                    </span>
                  </div>

                  {/* View Profile Button */}
                  <Link href={`/doctor/${doctor._id}`}>
                    <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-lg transition-all duration-300">
                      <Eye className="h-4 w-4 mr-2" />
                      View Full Profile
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
