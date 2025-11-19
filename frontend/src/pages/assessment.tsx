// src/pages/assessment.tsx
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { BrainCircuit, FileText, Sparkles, Mic } from 'lucide-react';

export default function AssessmentPage() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold text-slate-900">Start a New Assessment</h1>
        <p className="mt-2 text-lg text-slate-600">Choose the type of assessment you would like to begin.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        <Link href="/cognitive-test-enhanced" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:border-purple-500 transition-all transform hover:-translate-y-1 border-2">
            <CardHeader className="text-center">
              <div className="relative">
                <Sparkles className="w-16 h-16 mx-auto text-purple-600 mb-4" />
                <div className="absolute -top-2 -right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Enhanced Cognitive Test</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Comprehensive assessment with 5 interactive tests covering memory, attention, processing speed, and executive function. Takes 15-20 minutes.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>

        <Link href="/audio-cognitive-test" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-2xl hover:border-pink-500 transition-all transform hover:-translate-y-1 border-2">
            <CardHeader className="text-center">
              <div className="relative">
                <Mic className="w-16 h-16 mx-auto text-pink-600 mb-4" />
                <div className="absolute -top-2 -right-2 bg-pink-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  NEW
                </div>
              </div>
              <CardTitle className="text-2xl font-bold text-slate-800">Audio-Based Cognitive Test</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Test your memory and auditory comprehension through spoken recall. Listen to sentences and repeat them back. Takes 5-10 minutes.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/cognitive-test" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-blue-500 transition-shadow">
            <CardHeader className="text-center">
              <FileText className="w-16 h-16 mx-auto text-blue-600 mb-4" />
              <CardTitle className="text-2xl font-bold text-slate-800">Standard Cognitive Test</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Quick standardized cognitive test to evaluate memory, attention, and other cognitive functions. Great for a baseline evaluation.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/assessment/mri-upload" passHref>
          <Card className="h-full flex flex-col justify-between cursor-pointer hover:shadow-xl hover:border-green-500 transition-shadow">
            <CardHeader className="text-center">
              <BrainCircuit className="w-16 h-16 mx-auto text-green-600 mb-4" />
              <CardTitle className="text-2xl font-bold text-slate-800">Analyze MRI Scan</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription className="text-center text-slate-600">
                Upload a brain MRI scan for AI analysis. Provides structural assessment to detect early signs of Alzheimer's disease.
              </CardDescription>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}