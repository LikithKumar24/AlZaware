export interface ProfessionalDetailItem {
  title: string;
  description: string;
}

export interface DoctorProfessionalDetails {
  education: ProfessionalDetailItem[];
  career_history: ProfessionalDetailItem[];
  specializations: string[];
  professional_experience: string;
  success_stories: ProfessionalDetailItem[];
}

export interface User {
  _id: string;
  email: string;
  full_name: string;
  age: number;
  role: "doctor" | "patient";
  profile_photo_url?: string;
  professional_details?: DoctorProfessionalDetails;
}
