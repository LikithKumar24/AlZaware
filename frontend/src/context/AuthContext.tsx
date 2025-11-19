// src/context/AuthContext.tsx
import { createContext, useState, useEffect, useContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';

interface User {
  id: string;
  email: string;
  full_name: string;
  age: number;
  role: string;
  profile_photo_url?: string;
}

interface AuthContextType {
  token: string | null;
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, full_name: string, age: number, role: string) => Promise<void>;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    console.log('[AuthContext] Initializing auth state from localStorage');
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    // Clear any existing headers first to prevent conflicts
    delete axios.defaults.headers.common['Authorization'];
    
    if (storedToken && storedUser) {
      try {
        console.log('[AuthContext] Found stored token and user, restoring session');
        const parsedUser = JSON.parse(storedUser);
        setToken(storedToken);
        setUser(parsedUser);
        axios.defaults.headers.common['Authorization'] = `Bearer ${storedToken}`;
        console.log('[AuthContext] Session restored successfully');
      } catch (error) {
        console.error('[AuthContext] Error parsing stored user data:', error);
        // Clear corrupted data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      }
    } else {
      console.log('[AuthContext] No stored auth state found');
      setToken(null);
      setUser(null);
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    try {
      console.log('[AuthContext] Starting login process for:', email);

      // Step 1: AGGRESSIVE cleanup of any previous auth state
      console.log('[AuthContext] Step 1: Clearing all previous auth state');

      // Clear React state FIRST to prevent any interference
      setToken(null);
      setUser(null);

      // Clear axios headers completely (remove any header that might exist)
      delete axios.defaults.headers.common['Authorization'];
      delete axios.defaults.headers.common['authorization'];

      // Clear localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Add small delay to ensure cleanup completes
      await new Promise(resolve => setTimeout(resolve, 100));

      console.log('[AuthContext] Previous auth state cleared completely');
      console.log('[AuthContext] Verification after cleanup:', {
        localStorage_token: localStorage.getItem('token'),
        localStorage_user: localStorage.getItem('user'),
        axios_auth_header: axios.defaults.headers.common['Authorization']
      });

      // Step 2: Prepare login request
      const params = new URLSearchParams();
      params.append('username', email);
      params.append('password', password);

      console.log('[AuthContext] Step 2: Sending login request to backend');

      // Create a fresh axios instance for login to avoid any header pollution
      const response = await axios.post('http://127.0.0.1:8000/token', params, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });
      
      console.log('[AuthContext] Step 3: Login response received:', response.status);
      const { access_token, user } = response.data;
      
      // Step 3: Validate response
      if (!access_token || !user) {
        console.error('[AuthContext] Invalid response:', response.data);
        throw new Error('Invalid response from server: missing access_token or user');
      }
      
      console.log('[AuthContext] Step 4: Setting new auth state');
      console.log('[AuthContext] Received user:', user.email, 'Role:', user.role);
      
      // Step 4: Set new auth state in the correct order
      // 1. Update localStorage first (most persistent)
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      // 2. Set axios header
      axios.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      
      // 3. Update React state last
      setToken(access_token);
      setUser(user);
      
      console.log('[AuthContext] Auth state updated successfully');
      console.log('[AuthContext] Verification after login:', {
        token_length: access_token?.length,
        user_email: user?.email,
        user_role: user?.role,
        localStorage_has_token: !!localStorage.getItem('token'),
        localStorage_has_user: !!localStorage.getItem('user'),
        axios_has_header: !!axios.defaults.headers.common['Authorization']
      });
      
      // Step 5: Wait for state propagation then navigate
      console.log('[AuthContext] Step 5: Waiting for state propagation (300ms)');
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('[AuthContext] Step 6: Navigating to home page');
      router.push('/');
    } catch (error: any) {
      console.error('[AuthContext] ❌ Login failed:', error);
      console.error('[AuthContext] Error details:', {
        message: error.message,
        response_data: error.response?.data,
        response_status: error.response?.status,
        response_statusText: error.response?.statusText
      });
      
      // Clean up on error - ensure no partial state remains
      console.log('[AuthContext] Cleaning up after error');
      Object.keys(axios.defaults.headers.common).forEach(key => {
        if (key.toLowerCase() === 'authorization') {
          delete axios.defaults.headers.common[key];
        }
      });
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      
      throw error; // Re-throw to be caught by login page
    }
  }, [router]);

  const register = useCallback(async (email: string, password: string, full_name: string, age: number, role: string) => {
    const payload = {
      email,
      password,
      full_name,
      age: Number(age),
      role,
    };
    await axios.post('http://127.0.0.1:8000/users/', payload);
    router.push('/login');
  }, [router]);

  const logout = useCallback(() => {
    console.log('[AuthContext] ====== LOGOUT INITIATED ======');
    console.log('[AuthContext] Current state before logout:', {
      has_token: !!token,
      has_user: !!user,
      localStorage_token: !!localStorage.getItem('token'),
      axios_header: !!axios.defaults.headers.common['Authorization']
    });

    // Step 1: Clear axios headers FIRST (most critical for preventing 401 on next login)
    delete axios.defaults.headers.common['Authorization'];
    delete axios.defaults.headers.common['authorization'];
    
    console.log('[AuthContext] axios headers cleared');

    // Step 2: Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    console.log('[AuthContext] localStorage cleared');

    // Step 3: Clear React state LAST
    setToken(null);
    setUser(null);
    console.log('[AuthContext] React state cleared');

    // Step 4: Verification
    console.log('[AuthContext] ====== LOGOUT COMPLETE ======');
    console.log('[AuthContext] Verification after logout:', {
      axios_header: axios.defaults.headers.common['Authorization'],
      localStorage_token: localStorage.getItem('token'),
      localStorage_user: localStorage.getItem('user')
    });

    // Step 5: Navigate to login page with full page reload to ensure clean state
    console.log('[AuthContext] Navigating to login page');
    
    // Use window.location for a full page reload to ensure complete cleanup
    window.location.href = '/login';
  }, [router, token, user]);

  const updateUser = useCallback((updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem('user', JSON.stringify(updatedUser));
  }, []);

  return (
    <AuthContext.Provider value={{ token, user, loading, login, register, logout, updateUser }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};