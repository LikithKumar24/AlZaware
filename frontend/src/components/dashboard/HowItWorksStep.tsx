// src/components/dashboard/HowItWorksStep.tsx
import type { LucideProps } from 'lucide-react';
import React from 'react';

interface HowItWorksStepProps {
  icon: React.ElementType<LucideProps>;
  title: string;
  description: string;
  colorClass: string;
}

export function HowItWorksStep({ icon: Icon, title, description, colorClass }: HowItWorksStepProps) {
  return (
    <div className="flex items-start space-x-4">
      <div className={`w-12 h-12 ${colorClass} rounded-lg flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <h3 className="font-semibold text-slate-800 mb-1">{title}</h3>
        <p className="text-slate-600">{description}</p>
      </div>
    </div>
  );
}