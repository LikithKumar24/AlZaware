// src/components/dashboard/DoctorDashboard.tsx
import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Link from 'next/link';

interface Patient {
  full_name: string;
  email: string;
}

interface HighRiskCase {
  patient_full_name: string;
  prediction: string;
  confidence: number;
  created_at: string;
}

export default function DoctorDashboard() {
  const { user, token } = useAuth();
  const [myPatients, setMyPatients] = useState<Patient[]>([]);
  const [allPatients, setAllPatients] = useState<Patient[]>([]);
  const [highRiskCases, setHighRiskCases] = useState<HighRiskCase[]>([]);
  const [activeTab, setActiveTab] = useState("my-patients");

  const fetchMyPatients = async () => {
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/doctor/patients', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setMyPatients(data);
        }
      } catch (error) {
        console.error('Failed to fetch my patients:', error);
      }
    }
  };

  const fetchAllPatients = async () => {
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/patients/all', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setAllPatients(data);
        }
      } catch (error) {
        console.error('Failed to fetch all patients:', error);
      }
    }
  };

  const fetchHighRiskCases = async () => {
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/assessments/high-risk', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setHighRiskCases(data);
        }
      } catch (error) {
        console.error('Failed to fetch high-risk cases:', error);
      }
    }
  };

  const handleAssignPatient = async (patientEmail: string) => {
    if (token) {
      try {
        const response = await fetch('http://127.0.0.1:8000/doctor/assign-patient', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({ patient_email: patientEmail })
        });
        if (response.ok) {
          setActiveTab("my-patients");
          fetchMyPatients(); // Refresh the list
        }
      } catch (error) {
        console.error('Failed to assign patient:', error);
      }
    }
  };

  useEffect(() => {
    if (activeTab === "my-patients") {
      fetchMyPatients();
    } else if (activeTab === "all-patients") {
      fetchAllPatients();
    } else if (activeTab === "high-risk") {
      fetchHighRiskCases();
    }
  }, [activeTab, token]);

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-4xl font-bold text-slate-900 mb-8">Doctor Dashboard</h1>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-slate-200 rounded-md p-1">
          <TabsTrigger value="my-patients" className="py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold rounded-sm">My Patients</TabsTrigger>
          <TabsTrigger value="all-patients" className="py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold rounded-sm">All Patients</TabsTrigger>
          <TabsTrigger value="high-risk" className="py-2 text-slate-600 data-[state=active]:bg-slate-900 data-[state=active]:text-white data-[state=active]:font-bold rounded-sm">High-Risk Cases</TabsTrigger>
        </TabsList>

        <TabsContent value="my-patients" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Name</TableHead>
                <TableHead className="font-bold text-slate-900">Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {myPatients.map((patient) => (
                <TableRow key={patient.email}>
                  <TableCell>
                    <Link href={`/patient/${patient.email}`} className="font-medium text-blue-600 hover:underline">
                      {patient.full_name}
                    </Link>
                  </TableCell>
                  <TableCell className="text-slate-700">{patient.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="all-patients" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Name</TableHead>
                <TableHead className="font-bold text-slate-900">Email</TableHead>
                <TableHead className="font-bold text-slate-900">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allPatients.map((patient) => (
                <TableRow key={patient.email}>
                  <TableCell className="text-slate-700">{patient.full_name}</TableCell>
                  <TableCell className="text-slate-700">{patient.email}</TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm" onClick={() => handleAssignPatient(patient.email)}>Assign to Me</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="high-risk" className="mt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-bold text-slate-900">Patient Name</TableHead>
                <TableHead className="font-bold text-slate-900">Prediction</TableHead>
                <TableHead className="font-bold text-slate-900">Confidence</TableHead>
                <TableHead className="font-bold text-slate-900">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {highRiskCases.map((riskCase, index) => (
                <TableRow key={index}>
                  <TableCell className="text-slate-700">{riskCase.patient_full_name}</TableCell>
                  <TableCell className="text-slate-700">{riskCase.prediction}</TableCell>
                  <TableCell className="text-slate-700">{(riskCase.confidence * 100).toFixed(2)}%</TableCell>
                  <TableCell className="text-slate-700">{new Date(riskCase.created_at).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>
    </div>
  );
}