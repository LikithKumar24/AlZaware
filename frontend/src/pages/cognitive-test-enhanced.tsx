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

  const handleTestComplete = (testId: string, score: number, maxScore: number, additionalData?: any) => {
    const test = TESTS.find(t => t.id === testId);
    if (!test) return;

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

  const handleSaveAndContinue = async () => {
    // Validation checks
    if (!testResults || testResults.length === 0) {
      console.error('❌ No test results available');
      alert('No test results to save. Please complete at least one test.');
      return;
    }

    if (!token) {
      console.error('❌ No authentication token');
      alert('Authentication token missing. Please log in again.');
      router.push('/login');
      return;
    }

    setIsSaving(true);
    
    try {
      // Get fresh token from localStorage to avoid stale token from context
      const freshToken = localStorage.getItem('token');
      
      if (!freshToken) {
        console.error('❌ No token found in localStorage');
        alert('Session expired. Please log in again.');
        router.push('/login');
        return;
      }

      // Calculate category scores
      const memoryResults = testResults.filter(r => r.category === 'memory');
      const attentionResults = testResults.filter(r => r.category === 'attention');
      const speedResults = testResults.filter(r => r.category === 'speed');
      const executiveResults = testResults.filter(r => r.category === 'executive');

      const calculateAverage = (results: TestResult[]) => {
        if (results.length === 0) return 0;
        const sum = results.reduce((acc, r) => acc + (r.score / r.maxScore) * 100, 0);
        return Math.round(sum / results.length);
      };

      const memoryScore = calculateAverage(memoryResults);
      const attentionScore = calculateAverage(attentionResults);
      const speedScore = calculateAverage(speedResults);
      const executiveScore = calculateAverage(executiveResults);
      const totalScore = Math.round((memoryScore + attentionScore + speedScore + executiveScore) / 4);

      // Ensure all values are valid integers
      const payload = {
        test_type: 'Enhanced Cognitive Assessment',
        score: Number(totalScore) || 0,
        total_questions: 100,
        memory_score: Number(memoryScore) || 0,
        attention_score: Number(attentionScore) || 0,
        processing_speed: Number(speedScore) || 0,
        executive_score: Number(executiveScore) || 0,
      };

      console.log('✅ Saving Enhanced Cognitive Test results...');
      console.log('📤 Payload:', JSON.stringify(payload, null, 2));
      console.log('📊 Test results count:', testResults.length);
      console.log('🔑 Context token present:', !!token);
      console.log('🔑 Fresh token present:', !!freshToken);
      console.log('🔑 Token value (first 20 chars):', freshToken.substring(0, 20) + '...');

      // Save to backend using fresh token from localStorage
      const response = await axios.post(
        'http://127.0.0.1:8000/cognitive-tests/',
        payload,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}` 
          },
        }
      );

      console.log('✅ Save successful:', response.data);
      alert('Results saved successfully!');
      router.push('/assessment/mri-upload');
    } catch (error: any) {
      console.error('❌ Failed to save results:', error);
      console.error('Error details:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      let errorMessage = 'Failed to save results. Please try again.';
      
      if (error.response?.status === 401) {
        errorMessage = 'Session expired. Please log in again.';
        router.push('/login');
      } else if (error.response?.status === 422) {
        errorMessage = `Validation error: ${JSON.stringify(error.response?.data?.detail || error.response?.data)}`;
      } else if (error.response?.data?.detail) {
        if (typeof error.response.data.detail === 'string') {
          errorMessage = `Error: ${error.response.data.detail}`;
        } else {
          errorMessage = `Error: ${JSON.stringify(error.response.data.detail)}`;
        }
      } else if (error.message) {
        errorMessage = `Error: ${error.message}`;
      }
      
      alert(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  // Welcome Screen
  if (currentTestIndex === -1) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="bg-blue-100 p-4 rounded-full">
                <Brain className="h-16 w-16 text-blue-600" />
              </div>
            </div>
            <CardTitle className="text-4xl font-bold text-slate-900">
              Enhanced Cognitive Assessment
            </CardTitle>
            <p className="text-lg text-slate-600">
              A comprehensive evaluation of your cognitive abilities
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="font-semibold text-blue-900 mb-3 text-lg">
                This assessment includes {TESTS.length} scientifically-validated tests:
              </h3>
              <ul className="space-y-3">
                {TESTS.map((test, index) => (
                  <li key={test.id} className="flex items-start gap-3">
                    <div className={`bg-${test.color}-100 text-${test.color}-600 rounded-full w-8 h-8 flex items-center justify-center font-bold flex-shrink-0`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-slate-800">{test.name}</div>
                      <div className="text-sm text-slate-600">
                        {test.category === 'memory' && 'Tests your ability to store and recall information'}
                        {test.category === 'attention' && 'Tests your focus and selective attention'}
                        {test.category === 'speed' && 'Tests your processing speed and reaction time'}
                        {test.category === 'executive' && 'Tests planning and task-switching abilities'}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
              <p className="text-sm text-yellow-900">
                <strong>⏱️ Estimated Time:</strong> 15-20 minutes<br />
                <strong>📱 Best Experience:</strong> Use a desktop or tablet<br />
                <strong>🔇 Environment:</strong> Find a quiet space without distractions
              </p>
            </div>

            <Button 
              onClick={() => setCurrentTestIndex(0)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-xl py-8"
              size="lg"
            >
              Begin Assessment
            </Button>

            <p className="text-center text-sm text-slate-500">
              Your progress will be saved automatically
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Summary Screen
  if (isComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl">
          <CognitiveSummary 
            results={testResults}
            onSaveAndContinue={handleSaveAndContinue}
            isSaving={isSaving}
          />
        </div>
      </div>
    );
  }

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
                    className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm ${
                      index < currentTestIndex
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
          onComplete={(score: number, maxScore: number, additionalData?: any) => {
            handleTestComplete(currentTest.id, score, maxScore, additionalData);
          }}
        />
      </div>
    </div>
  );
};

export default EnhancedCognitiveTestPage;
