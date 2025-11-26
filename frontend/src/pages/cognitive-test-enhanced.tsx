import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle } from 'lucide-react';

// Import cognitive test components
import MemoryRecallTest from '@/components/cognitive/MemoryRecallTest';
import StroopTest from '@/components/cognitive/StroopTest';
import DigitSpanTest from '@/components/cognitive/DigitSpanTest';
import ReactionTimeTest from '@/components/cognitive/ReactionTimeTest';
import TrailMakingTest from '@/components/cognitive/TrailMakingTest';
import CognitiveSummary from '@/components/cognitive/CognitiveSummary';

interface TestResult {
  name: string;
  score: number;
  maxScore: number;
  category: string;
  color: string;
  additionalData?: any;
}

const TESTS = [
  { id: 'memory', name: 'Memory Recall', component: MemoryRecallTest, category: 'memory', color: 'purple' },
  { id: 'stroop', name: 'Stroop Color Test', component: StroopTest, category: 'attention', color: 'orange' },
  { id: 'digit', name: 'Digit Span', component: DigitSpanTest, category: 'memory', color: 'blue' },
  { id: 'reaction', name: 'Reaction Time', component: ReactionTimeTest, category: 'speed', color: 'yellow' },
  { id: 'trail', name: 'Trail Making', component: TrailMakingTest, category: 'executive', color: 'indigo' },
];

const EnhancedCognitiveTestPage: NextPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();

  const [currentTestIndex, setCurrentTestIndex] = useState(-1); // -1 for welcome screen
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleTestComplete = (testId: string, ...args: any[]) => {
    const test = TESTS.find(t => t.id === testId);
    if (!test) return;

    let score = 0;
    let maxScore = 100;
    let additionalData = {};

    // 🧠 NORMALIZE SCORES BASED ON TEST TYPE
    if (testId === 'reaction') {
      // Args: [avgTime, rawScore, details]
      const avgTime = args[0]; // Raw ms
      // Formula: 200ms or less = 100%. Every 10ms slower = -1 point.
      const reactionScore = Math.max(0, Math.min(100, 100 - ((avgTime - 200) / 10)));
      score = Math.round(reactionScore);
      maxScore = 100;
      additionalData = args[2] || {};
    } else if (testId === 'trail') {
      // Args: [completionTime, errors, finalScore]
      const completionTimeMs = args[0];
      // Formula: 20s or less = 100%. Every 1s slower = -2 points.
      const timeSeconds = completionTimeMs / 1000;
      const trailScore = Math.max(0, Math.min(100, 100 - ((timeSeconds - 20) * 2)));
      score = Math.round(trailScore);
      maxScore = 100;
      additionalData = { errors: args[1] };
    } else {
      // Default for Memory, Stroop, Digit (already return Score/Max)
      score = args[0];
      maxScore = args[1];
      additionalData = args[2];
    }

    const result: TestResult = {
      name: test.name,
      score,
      maxScore,
      category: test.category,
      color: test.color,
      additionalData
    };

    setTestResults([...testResults, result]);

    if (currentTestIndex < TESTS.length - 1) {
      setCurrentTestIndex(currentTestIndex + 1);
    } else {
      setIsComplete(true);
    }
  };

  // ... (existing code)

  // Test Screen
  const CurrentTestComponent = TESTS[currentTestIndex].component;
  const currentTest = TESTS[currentTestIndex];
  const progress = ((currentTestIndex + 1) / TESTS.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl space-y-4">
        {/* Progress Header */}
        <Card>
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">
                    Test {currentTestIndex + 1} of {TESTS.length}
                  </h2>
                  <p className="text-slate-600">{currentTest.name}</p>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.round(progress)}%
                  </div>
                  <div className="text-sm text-slate-600">Complete</div>
                </div>
              </div>
              <Progress value={progress} className="h-3" />

              {/* Completed tests indicators */}
              <div className="flex items-center gap-2 flex-wrap">
                {TESTS.map((test, index) => (
                  <div
                    key={test.id}
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${index < currentTestIndex
                        ? 'bg-green-100 text-green-700'
                        : index === currentTestIndex
                          ? 'bg-blue-100 text-blue-700 font-semibold'
                          : 'bg-slate-100 text-slate-400'
                      }`}
                  >
                    {index < currentTestIndex && <CheckCircle className="h-4 w-4" />}
                    <span>{test.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Current Test Component */}
        <CurrentTestComponent
          onComplete={(...args: any[]) => {
            handleTestComplete(currentTest.id, ...args);
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedCognitiveTestPage;
