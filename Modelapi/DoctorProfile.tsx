// src/components/doctor/DoctorProfile.tsx
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { UserCircle, Edit, Save, PlusCircle, Trash2, Briefcase, GraduationCap, Star, Award } from 'lucide-react';
import axios from 'axios';

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

export default function DoctorProfile() {
  const { user, token, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [details, setDetails] = useState<DoctorProfessionalDetails>(
    user?.professional_details || {
      education: [],
      career_history: [],
      specializations: [],
      professional_experience: '',
      success_stories: [],
    }
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleListItemChange = (section: keyof DoctorProfessionalDetails, index: number, field: keyof ProfessionalDetailItem, value: string) => {
    const newSection = [...(details[section] as ProfessionalDetailItem[])];
    newSection[index] = { ...newSection[index], [field]: value };
    setDetails((prev) => ({ ...prev, [section]: newSection }));
  };

  const handleSpecializationChange = (index: number, value: string) => {
    const newSpecializations = [...details.specializations];
    newSpecializations[index] = value;
    setDetails((prev) => ({ ...prev, specializations: newSpecializations }));
  };

  const addListItem = (section: keyof DoctorProfessionalDetails) => {
    if (section === 'specializations') {
      setDetails((prev) => ({ ...prev, specializations: [...prev.specializations, ''] }));
    } else {
      const newItem = { title: '', description: '' };
      setDetails((prev) => ({ ...prev, [section]: [...(prev[section] as ProfessionalDetailItem[]), newItem] }));
    }
  };

  const removeListItem = (section: keyof DoctorProfessionalDetails, index: number) => {
    const newSection = [...(details[section] as any[])];
    newSection.splice(index, 1);
    setDetails((prev) => ({ ...prev, [section]: newSection }));
  };

  const handleSaveChanges = async () => {
    if (!token) return;
    try {
      const response = await axios.put('http://127.0.0.1:8000/users/me/professional-details', details, {
        headers: { Authorization: `Bearer ${token}` },
      });
      updateUser(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to save changes:', error);
    }
  };

  if (!user) return null;

  const renderListItem = (item: ProfessionalDetailItem, index: number, section: 'education' | 'career_history' | 'success_stories') => (
    <li key={index} className="p-4 bg-slate-100 rounded-lg">
      <strong className="text-slate-800">{item.title}</strong>
      <p className="text-sm text-slate-600 mt-1">{item.description}</p>
    </li>
  );

  const renderEditListItem = (item: ProfessionalDetailItem, index: number, section: 'education' | 'career_history' | 'success_stories', placeholders: {title: string, description: string}) => (
    <div key={index} className="flex items-start space-x-2 mb-2">
      <div className="flex-grow space-y-2">
        <Input value={item.title} onChange={(e) => handleListItemChange(section, index, 'title', e.target.value)} placeholder={placeholders.title} />
        <Textarea value={item.description} onChange={(e) => handleListItemChange(section, index, 'description', e.target.value)} placeholder={placeholders.description} />
      </div>
      <Button variant="ghost" size="icon" onClick={() => removeListItem(section, index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
    </div>
  );

  return (
    <div className="container mx-auto p-4 md:p-8 bg-slate-50/50">
      <Card className="w-full max-w-4xl mx-auto shadow-lg">
        <CardHeader className="bg-slate-100 p-6 flex flex-row items-center justify-between">
          <div className="flex items-center">
            {user.profile_photo_url ? (
              <img src={user.profile_photo_url} alt="Profile" className="w-24 h-24 rounded-full mr-6 border-4 border-white shadow-md" />
            ) : (
              <UserCircle className="w-24 h-24 text-gray-400 mr-6" />
            )}
            <div>
              <h1 className="text-3xl font-bold text-slate-900">{user.full_name}</h1>
              <p className="text-slate-600">{user.email}</p>
            </div>
          </div>
          <Button onClick={() => setIsEditing(!isEditing)} size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
            {isEditing ? 'Cancel' : <><Edit className="mr-2 h-4 w-4" /> Edit Profile</>}
          </Button>
        </CardHeader>

        <CardContent className="p-6 space-y-8">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-6">
              {/* Education */}
              <Card>
                <CardHeader><CardTitle>Education & Qualifications</CardTitle></CardHeader>
                <CardContent>
                  {details.education.map((item, index) => renderEditListItem(item, index, 'education', {title: "Degree/Certification", description: "Institution"}))}
                  <Button onClick={() => addListItem('education')}><PlusCircle className="mr-2 h-4 w-4" /> Add Education</Button>
                </CardContent>
              </Card>
              {/* Career History */}
              <Card>
                <CardHeader><CardTitle>Career History</CardTitle></CardHeader>
                <CardContent>
                  {details.career_history.map((item, index) => renderEditListItem(item, index, 'career_history', {title: "Position/Role", description: "Company/Hospital"}))}
                  <Button onClick={() => addListItem('career_history')}><PlusCircle className="mr-2 h-4 w-4" /> Add Career History</Button>
                </CardContent>
              </Card>
              {/* Specializations */}
              <Card>
                <CardHeader><CardTitle>Areas of Specialization</CardTitle></CardHeader>
                <CardContent>
                  {details.specializations.map((spec, index) => (
                    <div key={index} className="flex items-center space-x-2 mb-2">
                      <Input value={spec} onChange={(e) => handleSpecializationChange(index, e.target.value)} placeholder="e.g., Neurology" />
                      <Button variant="ghost" size="icon" onClick={() => removeListItem('specializations', index)}><Trash2 className="h-4 w-4 text-red-500" /></Button>
                    </div>
                  ))}
                  <Button onClick={() => addListItem('specializations')}><PlusCircle className="mr-2 h-4 w-4" /> Add Specialization</Button>
                </CardContent>
              </Card>
              {/* Professional Experience */}
              <Card>
                <CardHeader><CardTitle>Professional Experience</CardTitle></CardHeader>
                <CardContent>
                  <Textarea name="professional_experience" value={details.professional_experience} onChange={handleInputChange} placeholder="Summary of your years in practice and key achievements." />
                </CardContent>
              </Card>
              {/* Success Stories */}
              <Card>
                <CardHeader><CardTitle>Notable Cases/Success Stories</CardTitle></CardHeader>
                <CardContent>
                  {details.success_stories.map((item, index) => renderEditListItem(item, index, 'success_stories', {title: "Case Title", description: "Case Description"}))}
                  <Button onClick={() => addListItem('success_stories')}><PlusCircle className="mr-2 h-4 w-4" /> Add Case</Button>
                </CardContent>
              </Card>
              <Button onClick={handleSaveChanges} size="lg"><Save className="mr-2 h-4 w-4" /> Save Changes</Button>
            </div>
          ) : (
            // View Mode
            <div className="space-y-8">
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><GraduationCap className="mr-3 text-blue-600" /> Education & Qualifications</h2>
                {user.professional_details?.education?.length ? <ul className="list-none space-y-4">{user.professional_details.education.map((item, i) => renderListItem(item, i, 'education'))}</ul> : <p className="text-slate-500">No information provided.</p>}
              </section>
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><Briefcase className="mr-3 text-blue-600" /> Career History</h2>
                {user.professional_details?.career_history?.length ? <ul className="list-none space-y-4">{user.professional_details.career_history.map((item, i) => renderListItem(item, i, 'career_history'))}</ul> : <p className="text-slate-500">No information provided.</p>}
              </section>
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><Star className="mr-3 text-blue-600" /> Areas of Specialization</h2>
                {user.professional_details?.specializations?.length ? <div className="flex flex-wrap gap-2">{user.professional_details.specializations.map((spec, i) => <div key={i} className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-semibold">{spec}</div>)}</div> : <p className="text-slate-500">No information provided.</p>}
              </section>
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><Briefcase className="mr-3 text-blue-600" /> Professional Experience</h2>
                <p className="text-slate-600">{user.professional_details?.professional_experience || 'No information provided.'}</p>
              </section>
              <section>
                <h2 className="text-2xl font-bold text-slate-800 mb-4 flex items-center"><Award className="mr-3 text-blue-600" /> Notable Cases/Success Stories</h2>
                {user.professional_details?.success_stories?.length ? <ul className="space-y-4">{user.professional_details.success_stories.map((item, i) => renderListItem(item, i, 'success_stories'))}</ul> : <p className="text-slate-500">No information provided.</p>}
              </section>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}