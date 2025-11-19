import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useRouter } from 'next/router';
import { NextPage } from 'next';
import axios, { AxiosError } from 'axios';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { AlertCircle, UserPlus } from "lucide-react";

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

const PatientDetailPage: NextPage = () => {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const { email } = router.query;

  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [cognitiveTests, setCognitiveTests] = useState<CognitiveTest[]>([]);
  const [patient, setPatient] = useState(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isPatientAssigned, setIsPatientAssigned] = useState(false);
  const [showNotAssignedUI, setShowNotAssignedUI] = useState(false);

  // Suppress Next.js error overlay for expected 403 errors
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const originalOnError = window.onerror;
      window.onerror = function(message, source, lineno, colno, error) {
        // Suppress 403 errors from appearing in Next.js error overlay
        if (message && typeof message === 'string' && message.includes('403')) {
          console.log('[PatientDetail] Suppressing 403 error overlay');
          return true; // Prevent default error handling
        }
        if (originalOnError) {
          return originalOnError(message, source, lineno, colno, error);
        }
        return false;
      };

      return () => {
        window.onerror = originalOnError;
      };
    }
  }, []);

  useEffect(() => {
    if (user?.role !== 'doctor') {
      router.push('/');
    }
  }, [user, router]);

  const handleAssignPatient = async () => {
    if (!token || !email || typeof email !== 'string') return;
    
    setIsAssigning(true);
    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/doctor/assign-patient',
        { patient_email: email },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.status === 200) {
        console.log('[PatientDetail] Patient assigned successfully');
        setIsPatientAssigned(true);
        setShowNotAssignedUI(false);
        setError(null);
        // Retry fetching data
        fetchPatientData();
      }
    } catch (error) {
      console.error('[PatientDetail] Failed to assign patient:', error);
      if (axios.isAxiosError(error)) {
        setError(`Failed to assign patient: ${error.response?.data?.detail || error.message}`);
      }
    } finally {
      setIsAssigning(false);
    }
  };

  const fetchPatientData = async () => {
    if (!token || !email || typeof email !== 'string') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      // Validate token exists and is not empty
      if (!token || token.trim() === '') {
        console.error('[PatientDetail] Invalid token detected');
        setError('Authentication token is missing. Please log in again.');
        logout();
        return;
      }

      console.log('[PatientDetail] Fetching data for patient:', email);
      console.log('[PatientDetail] Doctor user:', user?.email);
      console.log('[PatientDetail] Token present:', !!token);
      
      // Verify token is still valid by refreshing user data
      try {
        const userCheckResponse = await axios.get('http://127.0.0.1:8000/users/me', {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log('[PatientDetail] Token verified, user:', userCheckResponse.data.email);
      } catch (tokenError) {
        console.error('[PatientDetail] Token validation failed:', tokenError);
        if (axios.isAxiosError(tokenError) && tokenError.response?.status === 401) {
          setError('Your session has expired. Please log in again.');
          setTimeout(() => logout(), 2000);
          return;
        }
      }
      
      // Make requests with individual error handling to prevent uncaught promise rejections
      const assessmentsPromise = axios.get(`http://127.0.0.1:8000/assessments/?patient_email=${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => ({ error: err }));
      
      const cognitiveTestsPromise = axios.get(`http://127.0.0.1:8000/cognitive-tests/?patient_email=${email}`, {
        headers: { Authorization: `Bearer ${token}` }
      }).catch(err => ({ error: err }));
      
      const [assessmentsResult, cognitiveTestsResult] = await Promise.all([
        assessmentsPromise,
        cognitiveTestsPromise
      ]);
      
      // Check if either request failed
      if ('error' in assessmentsResult) {
        throw assessmentsResult.error;
      }
      if ('error' in cognitiveTestsResult) {
        throw cognitiveTestsResult.error;
      }
      
      setAssessments(assessmentsResult.data);
      setCognitiveTests(cognitiveTestsResult.data);
      setIsPatientAssigned(true);
      console.log('[PatientDetail] Data fetched successfully');
    } catch (error) {
      console.error('[PatientDetail] Failed to fetch patient data:', error);
      
      if (axios.isAxiosError(error)) {
        const axiosError = error as AxiosError;
        const responseData = axiosError.response?.data as any;
        
        if (axiosError.response?.status === 403) {
          console.error('[PatientDetail] 403 Forbidden - Not authorized to view this patient');
          console.error('[PatientDetail] Response detail:', responseData?.detail);
          setShowNotAssignedUI(true);
          setIsPatientAssigned(false);
          setError(null); // Clear error to prevent error alert from showing
        } else if (axiosError.response?.status === 401) {
          console.error('[PatientDetail] 401 Unauthorized - Token expired or invalid');
          setError('Your session has expired. Please log in again.');
          // Redirect to login after a short delay
          setTimeout(() => {
            logout();
          }, 2000);
        } else if (axiosError.response?.status === 404) {
          console.error('[PatientDetail] 404 Not Found - Patient data not found');
          setError('Patient data not found.');
        } else {
          console.error('[PatientDetail] Server error:', axiosError.response?.status);
          setError(`Failed to load patient data: ${responseData?.detail || axiosError.message}`);
        }
      } else {
        console.error('[PatientDetail] Network or unknown error');
        setError('Network error. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && email) {
      fetchPatientData();
    } else {
      setLoading(false);
    }
  }, [token, email]);

  if (!user || user.role !== 'doctor') {
    return <div className="container mx-auto p-4">
      <div className="text-center mt-8">Loading...</div>
    </div>;
  }

  if (loading) {
    return <div className="container mx-auto p-4">
      <div className="text-center mt-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-4 text-slate-600">Loading patient data...</p>
      </div>
    </div>;
  }

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-4xl font-bold text-slate-800 mb-4">Patient Results: {email}</h1>

      {showNotAssignedUI ? (
        <Alert className="mb-6 bg-amber-50 border-amber-300">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle className="text-amber-900">Patient Not Assigned</AlertTitle>
          <AlertDescription className="text-amber-800">
            <p className="mb-3">
              This patient is not currently assigned to you. To view their medical data and assessments, you need to assign them to your care first.
            </p>
            <Button 
              onClick={handleAssignPatient}
              disabled={isAssigning}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <UserPlus className="h-4 w-4 mr-2" />
              {isAssigning ? 'Assigning...' : 'Assign Patient to Me'}
            </Button>
          </AlertDescription>
        </Alert>
      ) : error ? (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {!showNotAssignedUI && !error ? (
        <>
          <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-2">MRI Assessments</h2>
          <Table>
            <TableCaption>A list of MRI assessments for {email}.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Date</TableHead>
                <TableHead className="font-bold text-slate-900">Prediction</TableHead>
                <TableHead className="font-bold text-slate-900">Confidence</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {assessments.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                    No MRI assessments found for this patient.
                  </TableCell>
                </TableRow>
              ) : (
                assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="text-slate-600">{new Date(assessment.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-600">{assessment.prediction}</TableCell>
                    <TableCell className="text-slate-600">{assessment.confidence.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <h2 className="text-2xl font-semibold text-slate-700 mt-8 mb-2">Cognitive Tests</h2>
          <Table>
            <TableCaption>A list of cognitive tests for {email}.</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Date</TableHead>
                <TableHead className="font-bold text-slate-900">Test Type</TableHead>
                <TableHead className="font-bold text-slate-900">Score</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cognitiveTests.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} className="text-center text-slate-500 py-8">
                    No cognitive tests found for this patient.
                  </TableCell>
                </TableRow>
              ) : (
                cognitiveTests.map((test) => (
                  <TableRow key={test.id}>
                    <TableCell className="text-slate-600">{new Date(test.created_at).toLocaleDateString()}</TableCell>
                    <TableCell className="text-slate-600">{test.test_type}</TableCell>
                    <TableCell className="text-slate-600">{test.score}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </>
      ) : null}
    </div>
  );
};

export default PatientDetailPage;
