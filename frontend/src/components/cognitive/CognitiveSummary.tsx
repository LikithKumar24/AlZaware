import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Brain, TrendingUp, Award, AlertCircle } from 'lucide-react';
import Link from 'next/link';

interface TestResult {
  name: string;
  score: number;
  maxScore: number;
  category: string;
  color: string;
}

interface CognitiveSummaryProps {
  results: TestResult[];
  onSaveAndContinue: () => void;
  isSaving?: boolean;
}

export default function CognitiveSummary({ results, onSaveAndContinue, isSaving = false }: CognitiveSummaryProps) {
  const calculateOverallScore = () => {
    const totalPercentage = results.reduce((sum, result) => {
      return sum + (result.score / result.maxScore) * 100;
    }, 0);
    return (totalPercentage / results.length).toFixed(1);
  };

  const getCategoryScore = (category: string) => {
    const categoryResults = results.filter(r => r.category === category);
    if (categoryResults.length === 0) return 0;
    
    const totalPercentage = categoryResults.reduce((sum, result) => {
      return sum + (result.score / result.maxScore) * 100;
    }, 0);
    return (totalPercentage / categoryResults.length).toFixed(0);
  };

  const getPerformanceLevel = (score: number) => {
    if (score >= 90) return { level: 'Excellent', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-300' };
    if (score >= 75) return { level: 'Good', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-300' };
    if (score >= 60) return { level: 'Fair', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-300' };
    return { level: 'Needs Attention', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-300' };
  };

  const overallScore = parseFloat(calculateOverallScore());
  const performance = getPerformanceLevel(overallScore);

  const categories = [
    { name: 'Memory', category: 'memory', icon: Brain, color: 'purple' },
    { name: 'Attention', category: 'attention', icon: AlertCircle, color: 'orange' },
    { name: 'Processing Speed', category: 'speed', icon: TrendingUp, color: 'blue' },
    { name: 'Executive Function', category: 'executive', icon: Award, color: 'indigo' },
  ];

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-center text-3xl">
            Cognitive Performance Summary
          </CardTitle>
          <p className="text-center text-slate-600">
            Complete assessment of cognitive abilities
          </p>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Overall Score */}
          <div className={`${performance.bg} ${performance.border} border-2 rounded-xl p-6 text-center`}>
            <div className={`text-6xl font-bold ${performance.color} mb-2`}>
              {overallScore}%
            </div>
            <div className="text-2xl font-semibold text-slate-700 mb-2">
              Overall Cognitive Score
            </div>
            <div className={`text-xl font-medium ${performance.color}`}>
              {performance.level} Performance
            </div>
          </div>

          {/* Category Scores */}
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Performance by Category</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((category) => {
                const score = parseFloat(getCategoryScore(category.category));
                const categoryPerf = getPerformanceLevel(score);
                const Icon = category.icon;
                
                return (
                  <div
                    key={category.category}
                    className={`${categoryPerf.bg} ${categoryPerf.border} border-2 rounded-lg p-4`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Icon className={`h-5 w-5 text-${category.color}-600`} />
                        <span className="font-semibold text-slate-800">{category.name}</span>
                      </div>
                      <span className={`text-2xl font-bold ${categoryPerf.color}`}>
                        {score}%
                      </span>
                    </div>
                    
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                      <div
                        className={`h-full bg-${category.color}-500 transition-all duration-1000 rounded-full`}
                        style={{ width: `${score}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Individual Test Results */}
          <div>
            <h3 className="text-xl font-semibold text-slate-800 mb-4">Individual Test Results</h3>
            <div className="space-y-3">
              {results.map((result, index) => {
                const percentage = (result.score / result.maxScore) * 100;
                const testPerf = getPerformanceLevel(percentage);
                
                return (
                  <div
                    key={index}
                    className={`flex items-center justify-between p-4 rounded-lg ${testPerf.bg} ${testPerf.border} border`}
                  >
                    <div className="flex-1">
                      <div className="font-semibold text-slate-800">{result.name}</div>
                      <div className="text-sm text-slate-600">
                        Score: {result.score} / {result.maxScore}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${testPerf.color}`}>
                        {percentage.toFixed(0)}%
                      </div>
                      <div className="text-xs text-slate-600">{testPerf.level}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recommendations */}
          <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Clinical Interpretation
            </h3>
            <div className="space-y-2 text-sm text-blue-800">
              {overallScore >= 85 && (
                <p>
                  <strong>Excellent cognitive function across all domains.</strong> Your performance
                  indicates healthy cognitive abilities consistent with normal aging.
                </p>
              )}
              {overallScore >= 70 && overallScore < 85 && (
                <p>
                  <strong>Good cognitive function with minor variability.</strong> Your performance
                  is within normal range, though some areas show room for improvement.
                </p>
              )}
              {overallScore >= 55 && overallScore < 70 && (
                <p>
                  <strong>Mild cognitive concerns detected.</strong> Some test scores suggest
                  possible cognitive changes. Consider discussing these results with a healthcare
                  professional for further evaluation.
                </p>
              )}
              {overallScore < 55 && (
                <p>
                  <strong>Significant cognitive concerns detected.</strong> Multiple areas show
                  below-average performance. We strongly recommend consulting with a healthcare
                  professional for comprehensive evaluation and potential interventions.
                </p>
              )}
              
              <p className="mt-3 pt-3 border-t border-blue-200">
                <strong>Note:</strong> This assessment is a screening tool and not a diagnostic
                instrument. Results should be interpreted by a qualified healthcare professional
                in conjunction with clinical history, physical examination, and other assessments.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button 
              onClick={onSaveAndContinue} 
              disabled={isSaving}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white text-lg py-6 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving Results...' : 'Save Results & Continue'}
            </Button>
            
            <p className="text-center text-slate-600 text-sm">
              Would you like to upload an MRI scan for comprehensive analysis?
            </p>
            
            <div className="grid grid-cols-2 gap-3">
              <Link href="/assessment/mri-upload" className="block">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-300 hover:border-blue-400 font-medium transition-all"
                >
                  Yes, Upload MRI
                </Button>
              </Link>
              <Link href="/results-history" className="block">
                <Button 
                  variant="outline" 
                  className="w-full bg-white hover:bg-blue-50 text-slate-800 border-2 border-slate-300 hover:border-blue-400 font-medium transition-all"
                >
                  View Results History
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
