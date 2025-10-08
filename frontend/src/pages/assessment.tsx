// src/pages/assessment.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText } from 'lucide-react';

export default function AssessmentPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Start a New Assessment</h1>
        <p className="mt-2 text-lg text-slate-600">Choose the type of assessment you would like to begin.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Link href="/cognitive-test" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-blue-500 transition-shadow">
            <CardHeader className="text-center">
              <FileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <CardTitle className="text-2xl font-bold text-slate-800">Take a Cognitive Assessment</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Complete a standardized cognitive test to evaluate memory, attention, and other cognitive functions. This is a great first step for a baseline evaluation.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        <Link href="/assessment/mri-upload" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-green-500 transition-shadow">
            <CardHeader className="text-center">
              <BrainCircuit className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-2xl font-bold text-slate-800">Analyze an MRI Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Upload a brain MRI scan for our AI to analyze. This provides a structural assessment to detect early signs of Alzheimer's disease.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}