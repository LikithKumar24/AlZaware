// src/pages/login.tsx
import { useState, FormEvent, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertCircle } from 'lucide-react';
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
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <Card className="w-full max-w-sm mx-auto shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-3xl font-bold text-slate-900">Welcome Back</CardTitle>
          <CardDescription>Enter your credentials to access your account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input 
                  id="email" 
                  type="email" 
                  placeholder="your-email@example.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input 
                  id="password" 
                  type="password" 
                  placeholder="Enter your password"
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  required 
                  disabled={isLoading}
                />
              </div>
              
              {error && (
                <div className="flex items-center gap-2 p-3 text-sm text-red-800 bg-red-50 border border-red-200 rounded-lg">
                  <AlertCircle className="h-4 w-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                disabled={isLoading}
              >
                {isLoading ? 'Logging in...' : 'Login'}
              </Button>
            </div>
          </form>
          <div className="mt-6 text-center text-sm">
            <span className="text-slate-600">Don't have an account?</span>{' '}
            <Link href="/register" className="text-blue-600 font-semibold hover:text-blue-700 underline">
              Sign Up
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
