import { useState, FormEvent } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    AlertCircle,
    User,
    Lock,
    Activity,
    ShieldCheck,
    Brain,
    Calendar,
    Stethoscope,
    CheckCircle2
} from 'lucide-react';

export default function RegisterPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [age, setAge] = useState('');
    const [role, setRole] = useState('patient');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { register } = useAuth();

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError('');

        if (!email || !password || !fullName || !age) {
            setError("All fields are required.");
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password, fullName, age, role);
            // Redirect is handled by the auth context or router usually, 
            // but if register doesn't redirect, we might want to show success or redirect manually.
            // Assuming register function handles navigation or we just wait.
        } catch (err: any) {
            setError(err.response?.data?.detail || "Failed to register. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Texture - Dot Grid */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:16px_16px] z-0 pointer-events-none" />

            {/* Ambient Background Blobs */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob z-0" />
            <div className="absolute bottom-0 right-0 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000 z-0" />

            {/* Trust Signal - Left */}
            <div className="hidden lg:flex absolute top-1/4 left-10 items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 animate-bounce-slow z-0">
                <ShieldCheck className="h-5 w-5 text-green-600" />
                <span className="text-sm font-medium text-slate-700">HIPAA Compliant Security</span>
            </div>

            {/* Trust Signal - Right */}
            <div className="hidden lg:flex absolute bottom-1/4 right-10 items-center gap-2 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full shadow-sm border border-white/50 animate-bounce-slow delay-700 z-0">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="text-sm font-medium text-slate-700">AI-Powered Precision: 98%</span>
            </div>

            <div className="relative z-10 max-w-5xl w-full h-[750px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex animate-in fade-in slide-in-from-bottom-4 duration-700">
                {/* Left Side - Form */}
                <div className="w-full lg:w-1/2 flex flex-col p-8 lg:p-12 overflow-y-auto custom-scrollbar">
                    <div className="w-full max-w-[400px] mx-auto space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Create an Account</h1>
                            <p className="text-sm text-slate-500">
                                Enter your details below to get started.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Role Selection */}
                            <div className="space-y-3">
                                <Label className="text-sm font-medium text-slate-700">I am a...</Label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setRole('patient')}
                                        className={`cursor-pointer relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${role === 'patient'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {role === 'patient' && (
                                            <div className="absolute top-2 right-2 text-blue-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                        <User className={`h-8 w-8 mb-2 ${role === 'patient' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className="font-semibold text-sm">Patient</span>
                                    </div>

                                    <div
                                        onClick={() => setRole('doctor')}
                                        className={`cursor-pointer relative flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all duration-200 ${role === 'doctor'
                                                ? 'border-blue-600 bg-blue-50/50 text-blue-700 shadow-sm'
                                                : 'border-slate-100 bg-white text-slate-500 hover:border-slate-200 hover:bg-slate-50'
                                            }`}
                                    >
                                        {role === 'doctor' && (
                                            <div className="absolute top-2 right-2 text-blue-600">
                                                <CheckCircle2 className="h-4 w-4" />
                                            </div>
                                        )}
                                        <Stethoscope className={`h-8 w-8 mb-2 ${role === 'doctor' ? 'text-blue-600' : 'text-slate-400'}`} />
                                        <span className="font-semibold text-sm">Doctor</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="fullName" className="text-sm font-medium text-slate-700">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="John Doe"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="age" className="text-sm font-medium text-slate-700">Age</Label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="age"
                                            type="number"
                                            placeholder="30"
                                            value={age}
                                            onChange={(e) => setAge(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="email"
                                            type="email"
                                            placeholder="name@example.com"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="password" className="text-sm font-medium text-slate-700">Password</Label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                                        <Input
                                            id="password"
                                            type="password"
                                            placeholder="Create a password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            required
                                            disabled={isLoading}
                                            className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                                        />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="flex items-start gap-3 p-3 text-sm text-red-800 bg-red-50 border border-red-100 rounded-lg animate-in fade-in slide-in-from-top-2">
                                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                                    <span className="leading-relaxed">{error}</span>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all shadow-sm hover:shadow-md rounded-xl"
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-2">
                                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                        <span>Creating Account...</span>
                                    </div>
                                ) : (
                                    'Register'
                                )}
                            </Button>
                        </form>

                        <div className="text-center text-sm pb-4">
                            <span className="text-slate-500">Already have an account?</span>{' '}
                            <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Right Side - Hero */}
                <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-blue-600 to-indigo-800 relative overflow-hidden items-center justify-center p-12 text-white">
                    {/* Pulse Gradient Overlay */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-400/20 via-transparent to-transparent z-0" />

                    {/* Pattern Overlay */}
                    <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-soft-light z-0" />

                    {/* Abstract Pattern Background */}
                    <div className="absolute inset-0 opacity-10 z-0">
                        <svg className="h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                            <path d="M0 100 C 20 0 50 0 100 100 Z" fill="white" />
                        </svg>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/30 rounded-full blur-3xl z-0" />
                    <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/30 rounded-full blur-3xl z-0" />

                    <div className="relative z-10 max-w-sm text-center space-y-6">
                        <div className="mx-auto bg-white/10 backdrop-blur-sm p-4 rounded-2xl w-20 h-20 flex items-center justify-center mb-6 shadow-inner ring-1 ring-white/20">
                            <Activity className="h-10 w-10 text-white" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-tight">Join the Fight Against Alzheimer's</h2>
                        <p className="text-blue-100 text-base leading-relaxed">
                            Create your account today to access clinical-grade screening tools and track your cognitive health.
                        </p>

                        {/* Testimonial/Trust Badge Style */}
                        <div className="pt-6 flex items-center justify-center gap-4 opacity-80">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map((i) => (
                                    <div key={i} className="w-8 h-8 rounded-full bg-blue-400/50 border-2 border-blue-600" />
                                ))}
                            </div>
                            <div className="text-sm font-medium">Trusted by Doctors & Patients</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="absolute bottom-4 w-full text-center z-10">
                <p className="text-xs text-slate-400">
                    © 2025 AlzAware Medical Inc. • Privacy Policy • Terms of Service
                </p>
            </div>
        </div>
    );
}