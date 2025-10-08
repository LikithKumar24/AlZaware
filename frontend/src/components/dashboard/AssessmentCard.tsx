// src/components/dashboard/AssessmentCard.tsx
import Link from 'next/link';
import { Brain, FileText, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { HowItWorksStep } from './HowItWorksStep';

const steps = [
  {
    icon: FileText,
    title: '1. Upload MRI Scan',
    description: 'Upload your brain MRI image for AI analysis.',
    colorClass: 'bg-blue-500',
  },
  {
    icon: Clock,
    title: '2. Cognitive Assessment',
    description: 'Complete interactive cognitive tests.',
    colorClass: 'bg-green-500',
  },
  {
    icon: CheckCircle,
    title: '3. Get Results',
    description: 'Receive detailed analysis and predictions.',
    colorClass: 'bg-purple-500',
  },
];

export function AssessmentCard() {
  return (
    <Card className="w-full max-w-2xl rounded-2xl shadow-xl border-none">
      <CardHeader className="text-center items-center pt-12">
        <div className="w-20 h-20 bg-blue-500 rounded-full flex items-center justify-center mb-6">
          <Brain className="w-10 h-10 text-white" />
        </div>
        <CardTitle className="text-3xl font-bold text-slate-800">
          Alzheimer's Disease Stage Predictor
        </CardTitle>
        <CardDescription className="text-slate-600 leading-relaxed max-w-lg pt-2">
          Advanced AI-powered analysis combining MRI brain scans and cognitive
          assessments to predict Alzheimer's disease progression stages.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-12 py-8">
        <div className="bg-blue-50 rounded-xl p-8">
          <h2 className="text-xl font-semibold text-slate-800 text-center mb-8">
            How It Works
          </h2>
          <div className="space-y-6">
            {steps.map((step) => (
              <HowItWorksStep key={step.title} {...step} />
            ))}
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-center pb-12">
        <Link href="/assessment">
          <Button
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 h-auto"
          >
            Start Assessment
            <ChevronRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}