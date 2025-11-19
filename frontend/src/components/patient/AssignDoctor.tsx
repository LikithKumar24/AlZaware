// src/components/patient/AssignDoctor.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Doctor {
  _id: string;
  full_name: string;
  email: string;
  professional_details?: {
    specializations?: string[];
  };
}

interface DoctorRequest {
  doctor_id: string;
  doctor_email: string;
  doctor_name: string;
  status: string;
  requested_at: string;
}

export default function AssignDoctor() {
  const { token, user } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [requests, setRequests] = useState<DoctorRequest[]>([]);
  const [assignedDoctor, setAssignedDoctor] = useState<string | null>(null);

  useEffect(() => {
    const fetchDoctors = async () => {
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/doctors/all', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setDoctors(data);
          }
        } catch (error) {
          console.error('Failed to fetch doctors:', error);
        }
      }
    };
    
    const fetchRequests = async () => {
      if (token) {
        try {
          const response = await fetch('http://127.0.0.1:8000/patient/my-requests', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (response.ok) {
            const data = await response.json();
            setRequests(data);
          }
        } catch (error) {
          console.error('Failed to fetch requests:', error);
        }
      }
    };
    
    fetchDoctors();
    fetchRequests();
    
    // Get assigned doctor from user context
    if (user?.assigned_doctor) {
      setAssignedDoctor(user.assigned_doctor);
    }
  }, [token, user]);

  const handleSendRequest = async () => {
    if (token && selectedDoctor) {
      try {
        const response = await fetch('http://127.0.0.1:8000/patient/request-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ doctor_email: selectedDoctor }),
        });
        
        if (response.ok) {
          setMessage('Request sent successfully! Awaiting doctor approval.');
          // Refresh requests
          const reqResponse = await fetch('http://127.0.0.1:8000/patient/my-requests', {
            headers: { 'Authorization': `Bearer ${token}` },
          });
          if (reqResponse.ok) {
            const data = await reqResponse.json();
            setRequests(data);
          }
          setSelectedDoctor(null);
        } else {
          const error = await response.json();
          setMessage(error.detail || 'Failed to send request. Please try again.');
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.');
        console.error('Failed to send request:', error);
      }
    }
  };

  // Find assigned doctor name
  const assignedDoctorInfo = doctors.find(d => d.email === assignedDoctor);
  
  // Find pending request
  const pendingRequest = requests.find(r => r.status === 'pending');
  
  // Check if approved
  const approvedRequest = requests.find(r => r.status === 'approved');

  return (
    <div className="p-4 border-t">
      <h3 className="font-bold text-slate-700 mb-2">Doctor Assignment</h3>
      
      {/* Show if doctor already assigned */}
      {assignedDoctor && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-green-800">✓ Under supervision</p>
          <p className="text-sm text-green-700 mt-1">
            Dr. {assignedDoctorInfo?.full_name || assignedDoctor}
          </p>
        </div>
      )}
      
      {/* Show pending request */}
      {pendingRequest && !assignedDoctor && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-yellow-800">⏳ Request Pending</p>
          <p className="text-sm text-yellow-700 mt-1">
            Awaiting approval from Dr. {pendingRequest.doctor_name}
          </p>
        </div>
      )}
      
      {/* Show approved request that hasn't been processed yet */}
      {approvedRequest && !assignedDoctor && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
          <p className="text-sm font-semibold text-green-800">✓ Request Approved!</p>
          <p className="text-sm text-green-700 mt-1">
            Dr. {approvedRequest.doctor_name} has approved your request.
          </p>
        </div>
      )}
      
      {/* Send request form - only show if no doctor assigned and no pending request */}
      {!assignedDoctor && !pendingRequest && (
        <div className="space-y-4">
          <Select onValueChange={setSelectedDoctor} value={selectedDoctor || undefined}>
            <SelectTrigger className="w-full border border-slate-300 text-slate-700">
              <SelectValue placeholder="Select a doctor" />
            </SelectTrigger>
            <SelectContent>
              {doctors.map((doctor) => (
                <SelectItem key={doctor.email} value={doctor.email}>
                  {doctor.full_name} - {doctor.professional_details?.specializations?.[0] || 'General'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button 
            onClick={handleSendRequest} 
            disabled={!selectedDoctor} 
            className="w-full" 
            variant="default"
          >
            Send Request
          </Button>
        </div>
      )}
      
      {message && (
        <p className="text-sm text-center text-gray-600 mt-2 p-2 bg-gray-50 rounded">
          {message}
        </p>
      )}
      
      {/* Show all requests history */}
      {requests.length > 0 && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-semibold text-slate-600 mb-2">Request History</h4>
          <div className="space-y-2">
            {requests.map((req, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 mb-1 bg-white border border-gray-200 rounded-md shadow-sm">
                <span className="text-sm text-gray-700 font-medium">{req.doctor_name}</span>
                <span className={`text-xs px-2 py-1 rounded-md ${
                  req.status === 'approved' ? 'bg-green-100 text-green-700' :
                  req.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-red-100 text-red-700'
                }`}>
                  {req.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
