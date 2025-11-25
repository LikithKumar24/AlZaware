import { NextPage } from 'next';
import { useAuth } from '@/context/AuthContext';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';
import PatientDashboard from '@/components/dashboard/PatientDashboard';
import LandingPage from '@/components/landing/LandingPage';

const HomePage: NextPage = () => {
  const { user } = useAuth();

  // 1. If no user is logged in, show the High-Fidelity Landing Page
  if (!user) {
    return <LandingPage />;
  }

  // 2. If user is a doctor, show Doctor Dashboard
  if (user.role === 'doctor') {
    return <DoctorDashboard />;
  }

  // 3. If user is a patient (or any other role), show Patient Dashboard
  return <PatientDashboard />;
};

export default HomePage;
