// src/pages/login.tsx
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle, User, Lock, Activity, ShieldCheck, Brain } from 'lucide-react';
import axios from 'axios';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { login, user } = useAuth();
  const router = useRouter();

  // Clean up auth state when login page mounts
  useEffect(() => {
    console.log('[LoginPage] ====== PAGE MOUNTED ======');
    console.log('[LoginPage] Clearing any stale auth state from axios');

    // Aggressively clear any authorization headers
    Object.keys(axios.defaults.headers.common).forEach(key => {
      if (key.toLowerCase() === 'authorization') {
        delete axios.defaults.headers.common[key];
        console.log(`[LoginPage] Removed stale header: ${key}`);
      }
    });

    console.log('[LoginPage] axios headers after cleanup:',
      JSON.stringify(axios.defaults.headers.common));
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    console.log('[LoginPage] Checking if user is already logged in');
    if (user) {
      console.log('[LoginPage] User already authenticated, redirecting to home');
      router.replace('/');
    }
  }, [user, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    console.log('[LoginPage] ====== LOGIN FORM SUBMITTED ======');
    console.log('[LoginPage] Email:', email);

    setError(null);
    setIsLoading(true);

    try {
      console.log('[LoginPage] Calling AuthContext.login()');
      await login(email, password);
      console.log('[LoginPage] ✅ Login successful');
    } catch (err: any) {
      console.error('[LoginPage] ❌ Login failed:', err);

      // Enhanced error handling
      if (err.response?.status === 401) {
        setError('Incorrect email or password. Please try again.');
      } else if (err.response?.status === 422) {
        setError('Invalid login data format. Please check your input.');
      } else if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message);
      } else {
        setError('Failed to login. Please check your credentials and try again.');
      }

      console.error('[LoginPage] Error details:', {
        status: err.response?.status,
        data: err.response?.data,
        message: err.message
      });
    } finally {
      console.log('[LoginPage] Setting isLoading to false');
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

      <div className="relative z-10 max-w-4xl w-full h-[600px] bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden flex animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Left Side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-8 lg:p-12">
          <div className="w-full max-w-[360px] space-y-6">
            <div className="space-y-2 text-center lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight text-slate-900">Welcome Back</h1>
              <p className="text-sm text-slate-500">
                Enter your credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-4">
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
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      disabled={isLoading}
                      className="pl-10 h-11 border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 rounded-xl"
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="remember"
                    className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                  />
                  <label
                    htmlFor="remember"
                    className="text-sm font-medium text-slate-600 cursor-pointer select-none"
                  >
                    Remember me
                  </label>
                </div>
                <Link
                  href="#"
                  className="text-sm font-medium text-blue-600 hover:text-blue-700 hover:underline"
                  onClick={(e) => e.preventDefault()}
                >
                  Forgot password?
                </Link>
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
                    <span>Logging in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>

            <div className="text-center text-sm">
              <span className="text-slate-500">Don't have an account?</span>{' '}
              <Link href="/register" className="font-semibold text-blue-600 hover:text-blue-700 hover:underline">
                Create an account
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
            <h2 className="text-3xl font-bold tracking-tight">Early Detection for a Better Future</h2>
            <p className="text-blue-100 text-base leading-relaxed">
              AlzAware uses advanced AI to help detect early signs of Alzheimer's, empowering you with knowledge and care.
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
