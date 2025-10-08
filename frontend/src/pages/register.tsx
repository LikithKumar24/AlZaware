import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState(''); // Use camelCase for React state
    const [age, setAge] = useState('');
    const [role, setRole] = useState('patient');
    const [error, setError] = useState('');
    const { register } = useAuth(); // Get the bulletproof register function from the context

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!email || !password || !fullName || !age) {
            setError("All fields are required.");
            return;
        }
        try {
            // Call the context function. It is responsible for formatting the data correctly.
            await register(email, password, fullName, age, role);
        } catch (err: any) {
            // If the API call fails, the context will throw an error which we catch here.
            setError(err.response?.data?.detail || "Failed to register. Please try again.");
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Create an account</CardTitle>
                    <CardDescription>Enter your details below to create your account</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" type="email" placeholder="m@example.com" value={email} onChange={(e) => setEmail(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="password">Password</Label>
                            <Input id="password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fullName">Full Name</Label>
                            <Input id="fullName" type="text" placeholder="John Doe" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="age">Age</Label>
                            <Input id="age" type="number" placeholder="30" value={age} onChange={(e) => setAge(e.target.value)} required />
                        </div>
                        <div className="space-y-2">
                            <Label>Role</Label>
                            <div className="flex items-center space-x-4">
                                <div className="flex items-center space-x-2">
                                    <input type="radio" id="role-patient" name="role" value="patient" checked={role === 'patient'} onChange={(e) => setRole(e.target.value)} />
                                    <Label htmlFor="role-patient">I am a Patient</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                    <input type="radio" id="role-doctor" name="role" value="doctor" checked={role === 'doctor'} onChange={(e) => setRole(e.target.value)} />
                                    <Label htmlFor="role-doctor">I am a Doctor</Label>
                                </div>
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500">{error}</p>}
                        <Button type="submit" className="w-full">Register</Button>
                    </form>
                    <div className="mt-4 text-center text-sm">
                        Already have an account?{' '}
                        <Link href="/login" className="underline">
                            Login
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}