import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useRouter } from "next/router";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Camera,
  Star,
  Edit,
  Save,
  X,
  BookOpen,
  Award,
  Activity,
  MessageSquare,
  Briefcase,
  Plus,
  Trash2
} from "lucide-react";

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

export default function ProfilePage() {
  const { user, token, updateUser } = useAuth();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const [editData, setEditData] = useState<DoctorProfessionalDetails>({
    education: [],
    career_history: [],
    specializations: [],
    professional_experience: "",
    success_stories: []
  });

  useEffect(() => {
    if (!user) {
      router.push("/login");
    } else if (user.role === 'patient') {
      router.push("/patient/profile");
    } else {
      // Initialize edit data with current user data
      setEditData(user.professional_details || {
        education: [],
        career_history: [],
        specializations: [],
        professional_experience: "",
        success_stories: []
      });
    }
  }, [user, router]);

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

  const handleSaveProfile = async () => {
    if (!token) return;
    
    setIsSaving(true);
    try {
      const response = await fetch('http://127.0.0.1:8000/users/me/professional-details', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editData),
      });

      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
        setIsEditing(false);
      } else {
        console.error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const addItem = (field: keyof DoctorProfessionalDetails, isStringArray = false) => {
    setEditData(prev => ({
      ...prev,
      [field]: isStringArray 
        ? [...(prev[field] as string[]), ""]
        : [...(prev[field] as ProfessionalDetailItem[]), { title: "", description: "" }]
    }));
  };

  const removeItem = (field: keyof DoctorProfessionalDetails, index: number) => {
    setEditData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).filter((_, i) => i !== index)
    }));
  };

  const updateItem = (field: keyof DoctorProfessionalDetails, index: number, value: any) => {
    setEditData(prev => ({
      ...prev,
      [field]: (prev[field] as any[]).map((item, i) => i === index ? value : item)
    }));
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <header className="flex justify-between items-center mb-8 bg-white/80 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/20">
          <h1 className="text-3xl font-bold text-blue-700">AlzAware</h1>
          <div className="text-sm text-gray-500">
            Welcome, <span className="font-semibold">{user.full_name}</span>
          </div>
        </header>

        {/* Profile Header */}
        <Card className="bg-gradient-to-br from-blue-50 to-indigo-100 border-blue-200 shadow-xl mb-8">
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
                    <div className="bg-gradient-to-br from-blue-500 to-indigo-600 h-full flex items-center justify-center text-white font-bold text-5xl">
                      {user.full_name.split(' ').map(n => n[0]).join('')}
                    </div>
                  )}
                </div>
                
                {/* Camera Upload Button */}
                <label htmlFor="photo-upload" className="absolute bottom-2 right-2 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-full cursor-pointer shadow-lg transition-all duration-200 hover:scale-110">
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

              {/* Doctor Info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="mb-6">
                  <h1 className="text-4xl font-bold text-slate-900 mb-3">
                    Dr. {user.full_name}
                  </h1>
                  <p className="text-blue-700 font-semibold text-xl capitalize mb-3">
                    {user.role} • Neurologist
                  </p>
                  <p className="text-slate-600 text-lg">
                    {user.professional_details?.professional_experience || 
                     "Specialist in Cognitive Disorders and Alzheimer's Disease"}
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
                      <div className="text-3xl font-bold text-blue-600">{user.assigned_patients?.length || 0}</div>
                      <div className="text-slate-600 font-medium">Patients</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-600">285</div>
                      <div className="text-slate-600 font-medium">CME Points</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">12</div>
                      <div className="text-slate-600 font-medium">Certificates</div>
                    </div>
                  </div>
                </div>

                {/* Contact Info */}
                <div className="flex flex-col lg:flex-row gap-6 text-slate-600 mb-8">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <span className="text-xl">📧</span>
                    <span className="font-medium">{user.email}</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <span className="text-xl">🏥</span>
                    <span className="font-medium">University Hospital Medical Center</span>
                  </div>
                </div>

                {/* Edit/Save Buttons */}
                <div className="flex gap-4 justify-center lg:justify-start">
                  {!isEditing ? (
                    <Button 
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg"
                    >
                      <Edit className="h-5 w-5 mr-3" />
                      Edit Profile
                    </Button>
                  ) : (
                    <>
                      <Button 
                        onClick={handleSaveProfile}
                        disabled={isSaving}
                        className="bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 px-8 py-3 text-lg"
                      >
                        <Save className="h-5 w-5 mr-3" />
                        {isSaving ? 'Saving...' : 'Save Changes'}
                      </Button>
                      <Button 
                        onClick={() => {
                          setIsEditing(false);
                          setEditData(user.professional_details || {
                            education: [],
                            career_history: [],
                            specializations: [],
                            professional_experience: "",
                            success_stories: []
                          });
                        }}
                        variant="outline"
                        className="px-8 py-3 text-lg"
                      >
                        <X className="h-5 w-5 mr-3" />
                        Cancel
                      </Button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Spans 2 columns */}
          <div className="lg:col-span-2 space-y-8">
            {/* Professional Experience */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Briefcase className="h-6 w-6 text-blue-600" />
                  Professional Experience
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    <Label htmlFor="experience">Professional Experience</Label>
                    <textarea
                      id="experience"
                      value={editData.professional_experience}
                      onChange={(e) => setEditData(prev => ({...prev, professional_experience: e.target.value}))}
                      className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Describe your professional experience..."
                    />
                  </div>
                ) : (
                  <p className="text-slate-700 leading-relaxed">
                    {user.professional_details?.professional_experience || 
                     "Professor of Medicine, Specialist in Cognitive Disorders with over 15 years of experience in neurological research and patient care."}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Education */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <BookOpen className="h-6 w-6 text-green-600" />
                  Education
                  {isEditing && (
                    <Button onClick={() => addItem('education')} size="sm" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-4">
                    {editData.education.map((item, index) => (
                      <div key={index} className="p-4 border border-slate-200 rounded-lg">
                        <div className="flex justify-between items-start mb-3">
                          <Label>Education {index + 1}</Label>
                          <Button 
                            onClick={() => removeItem('education', index)}
                            size="sm" 
                            variant="outline"
                            className="text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="space-y-3">
                          <Input
                            placeholder="Degree/Title"
                            value={item.title}
                            onChange={(e) => updateItem('education', index, {...item, title: e.target.value})}
                          />
                          <textarea
                            placeholder="Institution and details"
                            value={item.description}
                            onChange={(e) => updateItem('education', index, {...item, description: e.target.value})}
                            className="w-full p-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            rows={2}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {user.professional_details?.education?.length ? (
                      user.professional_details.education.map((item, i) => (
                        <div key={i} className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-slate-900">{item.title}</h4>
                          <p className="text-slate-600">{item.description}</p>
                        </div>
                      ))
                    ) : (
                      <div className="space-y-4">
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-slate-900">MD in Neurology</h4>
                          <p className="text-slate-600">Harvard Medical School, 2008</p>
                        </div>
                        <div className="border-l-4 border-green-500 pl-4">
                          <h4 className="font-semibold text-slate-900">PhD in Cognitive Science</h4>
                          <p className="text-slate-600">MIT, 2012</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Specializations */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-xl">
                  <Award className="h-6 w-6 text-purple-600" />
                  Specializations
                  {isEditing && (
                    <Button onClick={() => addItem('specializations', true)} size="sm" className="ml-auto">
                      <Plus className="h-4 w-4" />
                    </Button>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <div className="space-y-3">
                    {editData.specializations.map((spec, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          placeholder="Specialization"
                          value={spec}
                          onChange={(e) => updateItem('specializations', index, e.target.value)}
                          className="flex-1"
                        />
                        <Button 
                          onClick={() => removeItem('specializations', index)}
                          size="sm" 
                          variant="outline"
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-3">
                    {user.professional_details?.specializations?.length ? (
                      user.professional_details.specializations.map((spec, i) => (
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
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Activity & Interests */}
          <div className="space-y-8">
            {/* My Activity */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <Activity className="h-5 w-5 text-blue-600" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700">Follow-up study on early dementia screening</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700">Research on MRI anomaly detection</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700">Patient awareness workshop - Oct 2025</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-orange-500 rounded-full mt-2 flex-shrink-0"></div>
                    <span className="text-slate-700">AI-assisted diagnosis demo case study</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Interests */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <BookOpen className="h-5 w-5 text-green-600" />
                  Research Interests
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-slate-700">Neurological imaging analysis</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-slate-700">AI in medical diagnostics</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-slate-700">Patient behavioral tracking</span>
                  </li>
                  <li className="flex items-center gap-3">
                    <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                    <span className="text-slate-700">Data privacy in health tech</span>
                  </li>
                </ul>
              </CardContent>
            </Card>

            {/* Private Discussions */}
            <Card className="shadow-lg border-0 bg-white/90 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-3 text-lg">
                  <MessageSquare className="h-5 w-5 text-indigo-600" />
                  Discussions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3 text-sm">
                  <li className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">AI ethics and patient confidentiality</span>
                    <p className="text-xs text-slate-500 mt-1">2 hours ago</p>
                  </li>
                  <li className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">Review of case 37: Cognitive decline</span>
                    <p className="text-xs text-slate-500 mt-1">1 day ago</p>
                  </li>
                  <li className="p-3 bg-slate-50 rounded-lg">
                    <span className="text-slate-700">Interdisciplinary care meeting notes</span>
                    <p className="text-xs text-slate-500 mt-1">3 days ago</p>
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

/* ----------------------- Subcomponents ----------------------- */
const Section = ({ title, icon, children }: any) => (
  <div className="bg-white border rounded-lg shadow-sm p-5">
    <div className="flex items-center gap-2 mb-3 border-b pb-2">
      <div className="text-blue-600">{icon}</div>
      <h3 className="font-semibold text-gray-800">{title}</h3>
    </div>
    <div>{children}</div>
  </div>
);

const Stat = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between text-sm text-gray-700 border-b pb-1">
    <span>{label}</span>
    <span className="font-semibold text-blue-700">{value}</span>
  </div>
);
