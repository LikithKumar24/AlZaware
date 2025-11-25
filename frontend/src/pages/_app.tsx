// src/pages/_app.tsx

import '@/styles/globals.css';
import type { AppProps } from 'next/app';
import { useRouter } from 'next/router';
import { AuthProvider } from '@/context/AuthContext';
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';

function MyApp({ Component, pageProps }: AppProps) {
  const router = useRouter();
  const isAuthPage = ['/login', '/register'].includes(router.pathname);

  if (isAuthPage) {
    return (
      <AuthProvider>
        <Component {...pageProps} />
      </AuthProvider>
    );
  }

  return (
    <AuthProvider>
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <Header />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-4 md:p-8 flex items-center justify-center">
            {/* The Component prop is the current page being rendered */}
            <Component {...pageProps} />
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}

export default MyApp;
