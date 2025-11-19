import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import axios from 'axios';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, Activity, Mic, AlertCircle } from 'lucide-react';

interface Assessment {
  id: string;
  created_at: string;
  prediction: string;
  confidence: number;
}

interface CognitiveTest {
  id: string;
  created_at: string;
  test_type: string;
  score: number;
  total_questions?: number;
  memory_score?: number;
  attention_score?: number;
  processing_speed?: number;
  executive_score?: number;
}

interface AudioRecallTest {
  id: string;
  created_at: string;
  test_type: string;
  score: number;
  total_questions: number;
  average_similarity: number;
  correct_recalls: number;
  total_rounds: number;
}

const ResultsHistoryPage: NextPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [cognitiveTests, setCognitiveTests] = useState<CognitiveTest[]>([]);
  const [audioRecallTests, setAudioRecallTests] = useState<AudioRecallTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }

    if (token) {
      const fetchResults = async () => {
        try {
          setLoading(true);
          setError(null);

          console.log('Fetching results with token:', token ? 'present' : 'missing');

          const headers = { Authorization: `Bearer ${token}` };

          // Fetch all result types in parallel
          const [assessmentsResponse, cognitiveTestsResponse, audioRecallResponse] = await Promise.all([
            axios.get('http://127.0.0.1:8000/assessments/', { headers }).catch(err => {
              console.error('Failed to fetch assessments:', err);
              return { data: [] };
            }),
            axios.get('http://127.0.0.1:8000/cognitive-tests/', { headers }).catch(err => {
              console.error('Failed to fetch cognitive tests:', err);
              return { data: [] };
            }),
            axios.get('http://127.0.0.1:8000/cognitive-tests/audio-recall', { headers }).catch(err => {
              console.error('Failed to fetch audio recall tests:', err);
              return { data: [] };
            }),
          ]);

          console.log('Assessments:', assessmentsResponse.data.length);
          console.log('Cognitive Tests:', cognitiveTestsResponse.data.length);
          console.log('Audio Recall Tests:', audioRecallResponse.data.length);

          setAssessments(assessmentsResponse.data);
          setCognitiveTests(cognitiveTestsResponse.data);
          setAudioRecallTests(audioRecallResponse.data);
        } catch (error: any) {
          console.error('Failed to fetch results', error);
          if (error.response?.status === 401) {
            setError('Session expired. Please log in again.');
            setTimeout(() => router.push('/login'), 2000);
          } else {
            setError('Failed to load results. Please try again.');
          }
        } finally {
          setLoading(false);
        }
      };

      fetchResults();
    }
  }, [token, user, router]);

  if (!user) {
    return null;
  }

  // Helper function to get test type label
  const getTestTypeLabel = (testType: string) => {
    const labels: { [key: string]: string } = {
      'Enhanced Cognitive Assessment': 'Enhanced Cognitive',
      'Audio-Based Cognitive Test': 'Audio Recall',
      'Standard Cognitive Test': 'Standard',
    };
    return labels[testType] || testType;
  };

  // Helper function to get performance level based on score
  const getPerformanceLevel = (score: number) => {
    if (score >= 85) return { label: 'Excellent', color: 'text-green-600' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600' };
    if (score >= 50) return { label: 'Fair', color: 'text-yellow-600' };
    return { label: 'Needs Attention', color: 'text-red-600' };
  };

  return (
    <div className="container mx-auto p-6 space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <Activity className="h-8 w-8 text-blue-600" />
        <h1 className="text-4xl font-bold text-slate-800">Results History</h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center p-12">
          <div className="text-slate-600">Loading your results...</div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {!loading && !error && (
        <>
          {/* MRI Assessments Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-purple-600" />
                MRI Scan Assessments
              </CardTitle>
            </CardHeader>
            <CardContent>
              {assessments.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No MRI assessments found.</p>
              ) : (
                <Table>
                  <TableCaption>A list of your recent MRI assessments.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Date</TableHead>
                      <TableHead className="font-bold text-slate-900">Prediction</TableHead>
                      <TableHead className="font-bold text-slate-900">Confidence</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {assessments.map((assessment) => (
                      <TableRow key={assessment.id}>
                        <TableCell className="text-slate-600">
                          {new Date(assessment.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </TableCell>
                        <TableCell className="font-medium text-slate-700">{assessment.prediction}</TableCell>
                        <TableCell className="text-slate-600">{(assessment.confidence * 100).toFixed(1)}%</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Enhanced Cognitive Tests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-6 w-6 text-blue-600" />
                Cognitive Test Results
              </CardTitle>
            </CardHeader>
            <CardContent>
              {cognitiveTests.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No cognitive tests found.</p>
              ) : (
                <Table>
                  <TableCaption>A list of your recent cognitive assessments.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Date</TableHead>
                      <TableHead className="font-bold text-slate-900">Test Type</TableHead>
                      <TableHead className="font-bold text-slate-900">Overall Score</TableHead>
                      <TableHead className="font-bold text-slate-900">Performance</TableHead>
                      <TableHead className="font-bold text-slate-900">Details</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {cognitiveTests.map((test) => {
                      const performance = getPerformanceLevel(test.score);
                      return (
                        <TableRow key={test.id}>
                          <TableCell className="text-slate-600">
                            {new Date(test.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-medium text-slate-700">
                            {getTestTypeLabel(test.test_type)}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            {test.score}
                            {test.total_questions && `/${test.total_questions}`}
                          </TableCell>
                          <TableCell className={`font-medium ${performance.color}`}>
                            {performance.label}
                          </TableCell>
                          <TableCell className="text-sm text-slate-600">
                            {test.memory_score !== undefined && (
                              <div className="space-y-1">
                                <div>Memory: {test.memory_score}</div>
                                <div>Attention: {test.attention_score}</div>
                                <div>Speed: {test.processing_speed}</div>
                                <div>Executive: {test.executive_score}</div>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Audio Recall Tests Section */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mic className="h-6 w-6 text-indigo-600" />
                Audio-Based Cognitive Tests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {audioRecallTests.length === 0 ? (
                <p className="text-slate-500 text-center py-4">No audio recall tests found.</p>
              ) : (
                <Table>
                  <TableCaption>A list of your recent audio-based cognitive tests.</TableCaption>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="font-bold text-slate-900">Date</TableHead>
                      <TableHead className="font-bold text-slate-900">Score</TableHead>
                      <TableHead className="font-bold text-slate-900">Accuracy</TableHead>
                      <TableHead className="font-bold text-slate-900">Correct Recalls</TableHead>
                      <TableHead className="font-bold text-slate-900">Performance</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audioRecallTests.map((test) => {
                      const performance = getPerformanceLevel(test.average_similarity);
                      return (
                        <TableRow key={test.id}>
                          <TableCell className="text-slate-600">
                            {new Date(test.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </TableCell>
                          <TableCell className="font-semibold text-slate-800">
                            {test.score}/{test.total_questions}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {test.average_similarity.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {test.correct_recalls}/{test.total_rounds}
                          </TableCell>
                          <TableCell className={`font-medium ${performance.color}`}>
                            {performance.label}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ResultsHistoryPage;
