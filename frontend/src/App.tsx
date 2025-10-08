// src/App.tsx
// src/App.tsx
import { Header } from '@/components/layout/header';
import { Sidebar } from '@/components/layout/sidebar';
import HomePage from '@/pages/HomePage';

export default function App() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
      <Header />
      <div className="flex">
        <Sidebar />
        <HomePage />
      </div>
    </div>
  );
}