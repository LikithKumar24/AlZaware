import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';

const PatientDashboard = () => {
  const { user } = useAuth();

  return (
    <div className="container mx-auto px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <h1 className="text-4xl font-bold text-slate-800">Welcome, {user?.full_name}!</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl">
          You can start a new assessment, view your results history, or manage your profile.
        </p>

        <div className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6">
          <Link href="/assessment">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-8 py-6 w-full md:w-auto">
              Start New Assessment
            </Button>
          </Link>
          <Link href="/results-history">
            <Button size="lg" variant="outline" className="text-xl px-8 py-6 w-full md:w-auto border-slate-800 text-slate-800 hover:bg-slate-100">
              View Results History
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
};

export default PatientDashboard;
