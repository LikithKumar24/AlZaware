// src/components/doctor/PatientRequests.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, User } from 'lucide-react';

interface PatientRequest {
  patient_id: string;
  patient_email: string;
  patient_name: string;
  status: string;
  requested_at: string;
}

export default function PatientRequests() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<PatientRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  const fetchRequests = async () => {
    if (!token) return;
    
    try {
      const response = await fetch('http://127.0.0.1:8000/doctor/pending-requests', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setRequests(data);
      }
    } catch (error) {
      console.error('Failed to fetch requests:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [token]);

  const handleResponse = async (patientEmail: string, action: 'approve' | 'reject') => {
    if (!token) return;
    
    setProcessingId(patientEmail);
    
    try {
      const response = await fetch('http://127.0.0.1:8000/doctor/respond-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ patient_email: patientEmail, action }),
      });
      
      if (response.ok) {
        // Refresh the list
        await fetchRequests();
      } else {
        const error = await response.json();
        alert(error.detail || 'Failed to process request');
      }
    } catch (error) {
      console.error('Failed to respond to request:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-slate-600">Loading requests...</p>
        </CardContent>
      </Card>
    );
  }

  if (requests.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Patient Requests
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-slate-600 py-8">
            No pending requests at the moment
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5 text-blue-600" />
          Patient Requests ({requests.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {requests.map((request) => (
            <div
              key={request.patient_id}
              className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-3 flex-1">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-slate-800 text-lg">
                      {request.patient_name}
                    </h4>
                    <p className="text-sm text-slate-600 mb-1">
                      {request.patient_email}
                    </p>
                    <p className="text-xs text-slate-500">
                      Requested: {new Date(request.requested_at).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2 ml-4">
                  <Button
                    onClick={() => handleResponse(request.patient_email, 'approve')}
                    disabled={processingId === request.patient_email}
                    className="bg-green-600 hover:bg-green-700 text-white"
                    size="sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Accept
                  </Button>
                  <Button
                    onClick={() => handleResponse(request.patient_email, 'reject')}
                    disabled={processingId === request.patient_email}
                    variant="destructive"
                    size="sm"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
