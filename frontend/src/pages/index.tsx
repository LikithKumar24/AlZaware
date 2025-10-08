import { NextPage } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, FileText, BarChart2, AlertTriangle } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import DoctorDashboard from '@/components/dashboard/DoctorDashboard';

const HomePage: NextPage = () => {
  const { user } = useAuth();

  if (user?.role === 'doctor') {
    return <DoctorDashboard />;
  }

  return (
    <div className="container mx-auto px-4 py-12">
      <main className="flex flex-col items-center text-center">
        <h1 className="text-5xl font-bold text-slate-800">Advanced Alzheimer's Disease Prediction</h1>
        <p className="mt-4 text-lg text-slate-600 max-w-3xl">
          Our AI-powered system combines MRI brain scan analysis with cognitive assessment to provide comprehensive early detection of Alzheimer's disease across four stages.
        </p>

        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-slate-800">How It Works</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="border border-slate-200 shadow-md hover:shadow-lg hover:border-green-400">
              <CardHeader>
                <FileText className="h-12 w-12 mx-auto text-green-600" />
                <CardTitle className="mt-4">1. Cognitive Assessment</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Complete a short, standardized cognitive test to provide additional data for our AI model.</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-md hover:shadow-lg hover:border-blue-400">
              <CardHeader>
                <Upload className="h-12 w-12 mx-auto text-blue-600" />
                <CardTitle className="mt-4">2. Upload MRI Scan</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Securely upload a patient's MRI brain scan. Our system accepts standard medical imaging formats.</p>
              </CardContent>
            </Card>
            <Card className="border border-slate-200 shadow-md hover:shadow-lg hover:border-blue-400">
              <CardHeader>
                <BarChart2 className="h-12 w-12 mx-auto text-blue-600" />
                <CardTitle className="mt-4">3. Get Results</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Receive a detailed report with the predicted stage of Alzheimer's and a confidence score.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16 w-full">
          <h2 className="text-3xl font-bold text-slate-800">Detection Stages</h2>
          <div className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-8">
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-green-500"></div>
                <CardTitle>No Impedance</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Normal cognitive function with no signs of impairment.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-500"></div>
                <CardTitle>Very Mild</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Subjective memory complaints, but no objective cognitive decline.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-orange-500"></div>
                <CardTitle>Mild</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Objective evidence of memory impairment in one or more cognitive domains.</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center space-x-2">
                <div className="w-4 h-4 rounded-full bg-red-500"></div>
                <CardTitle>Moderate</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600">Significant memory loss and cognitive decline affecting daily life.</p>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="mt-16">
          <Link href={user ? "/cognitive-test" : "/login"}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white text-xl px-8 py-6">Start Assessment</Button>
          </Link>
        </section>

        <footer className="mt-16 w-full max-w-3xl">
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4" role="alert">
            <div className="flex">
              <div className="py-1"><AlertTriangle className="h-6 w-6 text-yellow-500 mr-4" /></div>
              <div>
                <p className="font-bold">Disclaimer</p>
                <p className="text-sm">This tool is for research and educational purposes only. Results should not replace professional medical diagnosis.</p>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};

export default HomePage;
