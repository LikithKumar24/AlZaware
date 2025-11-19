import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mic } from 'lucide-react';
import AudioRecallTest from '@/components/cognitive/AudioRecallTest';

const AudioCognitiveTestPage: NextPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [isComplete, setIsComplete] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
    }
  }, [user, router]);

  const handleTestComplete = async (score: number, maxScore: number, details: any) => {
    setTestResults({ score, maxScore, details });
    setIsComplete(true);
  };

  const handleSaveResults = async () => {
    // Validation checks
    if (!testResults) {
      console.error('❌ No test results available');
      alert('No test results to save. Please complete the test first.');
      return;
    }

    // Get fresh token from localStorage to avoid stale token from context
    const freshToken = localStorage.getItem('token');
    
    if (!freshToken) {
      console.error('❌ No authentication token found in localStorage');
      alert('Session expired. Please log in again.');
      router.push('/login');
      return;
    }

    // Validate test results structure
    if (!testResults.details || !testResults.details.roundResults) {
      console.error('❌ Invalid test results structure:', testResults);
      alert('Invalid test results format. Please try taking the test again.');
      return;
    }

    setIsSaving(true);

    try {
      // Calculate overall score as percentage - ensure it's an integer
      const overallScore = Math.round((testResults.score / testResults.maxScore) * 100);

      // Ensure all numeric values are properly typed
      const payload = {
        test_type: 'audio_recall',
        score: Number(overallScore) || 0,
        total_questions: Number(testResults.maxScore) || 3,
        average_similarity: Number(testResults.details.averageScore) || 0,
        correct_recalls: Number(testResults.score) || 0,
        total_rounds: Number(testResults.details.totalRounds) || 3,
        round_details: testResults.details.roundResults.map((round: any) => ({
          round: Number(round.round),
          originalText: String(round.originalText || ''),
          spokenText: String(round.spokenText || ''),
          similarityScore: Number(round.similarityScore) || 0,
          correct: Boolean(round.correct)
        }))
      };

      console.log('✅ Saving Audio Recall Test results...');
      console.log('📤 Payload:', JSON.stringify(payload, null, 2));
      console.log('📊 Round details:', testResults.details.roundResults.length, 'rounds');
      console.log('🔑 Context token present:', !!token);
      console.log('🔑 Fresh token present:', !!freshToken);
      console.log('🔑 Token value (first 20 chars):', freshToken.substring(0, 20) + '...');

      // Save the audio recall test results using fresh token from localStorage
      const response = await axios.post(
        'http://127.0.0.1:8000/cognitive-tests/audio-recall',
        payload,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${freshToken}` 
          },
        }
      );

      console.log('✅ Save successful:', response.data);
      alert('Audio test results saved successfully!');
      
      // Redirect to results history
      router.push('/results-history');
    } catch (error: any) {
      console.error('❌ Failed to save audio test results:', error);
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
      } else if (error.response?.status === 500) {
        errorMessage = 'Server error while saving results. Please contact support.';
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

  if (isComplete && testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="bg-pink-100 p-4 rounded-full">
                <Mic className="h-16 w-16 text-pink-600" />
              </div>
            </div>
            <CardTitle className="text-3xl font-bold text-slate-900">
              Audio Test Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-pink-50 border-2 border-pink-300 rounded-xl p-6 text-center">
              <div className="text-6xl font-bold text-pink-600 mb-2">
                {testResults.score}/{testResults.maxScore}
              </div>
              <p className="text-xl text-slate-700">Correct Recalls</p>
              <p className="text-sm text-slate-600 mt-2">
                Average Accuracy: {testResults.details.averageScore.toFixed(1)}%
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="font-semibold text-blue-900 mb-2">What's Next?</h3>
              <p className="text-sm text-blue-800">
                Your audio-based cognitive test results will be saved to your profile.
                You can view your complete assessment history and track your progress over time.
              </p>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleSaveResults}
                disabled={isSaving}
                className="w-full bg-pink-600 hover:bg-pink-700 text-white font-semibold py-4 px-6 rounded-lg transition-all shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? 'Saving Results...' : 'Save Results & View History'}
              </button>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => router.push('/assessment')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 rounded-lg border-2 border-slate-300 transition-all"
                >
                  Take Another Test
                </button>
                <button
                  onClick={() => router.push('/')}
                  className="w-full bg-white hover:bg-slate-50 text-slate-800 font-medium py-3 px-4 rounded-lg border-2 border-slate-300 transition-all"
                >
                  Go to Dashboard
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-pink-50 flex items-center justify-center p-4">
      <div className="w-full max-w-4xl">
        <AudioRecallTest onComplete={handleTestComplete} />
      </div>
    </div>
  );
};

export default AudioCognitiveTestPage;
