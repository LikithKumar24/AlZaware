
// src/components/patient/AssignDoctor.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Doctor {
  name: string;
  email: string;
}

export default function AssignDoctor() {
  const { token } = useAuth();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

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
    fetchDoctors();
  }, [token]);

  const handleAssignDoctor = async () => {
    if (token && selectedDoctor) {
      try {
        const response = await fetch('http://127.0.0.1:8000/patient/assign-doctor', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ doctor_email: selectedDoctor }),
        });
        if (response.ok) {
          setMessage('Doctor assigned successfully!');
        } else {
          setMessage('Failed to assign doctor. Please try again.');
        }
      } catch (error) {
        setMessage('An error occurred. Please try again.');
        console.error('Failed to assign doctor:', error);
      }
    }
  };

  return (
    <div className="p-4 border-t">
      <h3 className="font-bold text-slate-700 mb-2">Assign a Doctor</h3>
      <div className="space-y-4">
        <Select onValueChange={setSelectedDoctor}>
          <SelectTrigger className="w-full border border-slate-300 text-slate-700">
            <SelectValue placeholder="Select a doctor" />
          </SelectTrigger>
          <SelectContent>
            {doctors.map((doctor) => (
              <SelectItem key={doctor.email} value={doctor.email}>
                {doctor.name} - {doctor.email}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button onClick={handleAssignDoctor} disabled={!selectedDoctor} className="w-full" variant="secondary">
          Assign My Doctor
        </Button>
        {message && <p className="text-sm text-center text-gray-600 mt-2">{message}</p>}
      </div>
    </div>
  );
}
