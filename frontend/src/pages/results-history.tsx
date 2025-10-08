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
}

const ResultsHistoryPage: NextPage = () => {
  const { user, token } = useAuth();
  const router = useRouter();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [cognitiveTests, setCognitiveTests] = useState<CognitiveTest[]>([]);

  if (!user) {
    router.push('/login');
    return null;
  }

  useEffect(() => {
    if (token) {
      const fetchResults = async () => {
        try {
          const [assessmentsResponse, cognitiveTestsResponse] = await Promise.all([
            axios.get('http://127.0.0.1:8000/assessments/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
            axios.get('http://127.0.0.1:8000/cognitive-tests/', {
              headers: { Authorization: `Bearer ${token}` },
            }),
          ]);
          setAssessments(assessmentsResponse.data);
          setCognitiveTests(cognitiveTestsResponse.data);
        } catch (error) {
          console.error('Failed to fetch results', error);
        }
      };

      fetchResults();
    }
  }, [token]);

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">Results History</h1>
      <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-2">MRI Assessments</h2>
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
              <TableCell className="text-slate-600">{new Date(assessment.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-slate-600">{assessment.prediction}</TableCell>
              <TableCell className="text-slate-600">{assessment.confidence.toFixed(2)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-2">Cognitive Tests</h2>
      <Table>
        <TableCaption>A list of your recent cognitive tests.</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead className="font-bold text-slate-900">Date</TableHead>
            <TableHead className="font-bold text-slate-900">Test Type</TableHead>
            <TableHead className="font-bold text-slate-900">Score</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cognitiveTests.map((test) => (
            <TableRow key={test.id}>
              <TableCell className="text-slate-600">{new Date(test.created_at).toLocaleDateString()}</TableCell>
              <TableCell className="text-slate-600">{test.test_type}</TableCell>
              <TableCell className="text-slate-600">{test.score}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default ResultsHistoryPage;
