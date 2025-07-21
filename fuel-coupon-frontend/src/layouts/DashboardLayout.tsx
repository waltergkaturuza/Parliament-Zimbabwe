// src/layouts/DashboardLayout.tsx
import React, { Suspense } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext'; // Ensure this import is correct
import LoadingSpinner from '@/components/LoadingSpinner';
import ErrorBoundary from '@/components/ErrorBoundary';
import ErrorPage from '@/pages/ErrorPage';
import ParliamentLogo from '@/components/ParliamentLogo';

export default function DashboardLayout() {
  const { isAuthenticated, user, isAuthLoading, logout } = useAuth(); // Use the hook

  if (isAuthLoading) {
    return <LoadingSpinner />;
  }

  if (!isAuthenticated) {
    return <div>Not Authenticated. Redirecting...</div>;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* Header with Parliament Logo */}
      <header className="bg-white shadow-md py-4 px-6">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <ParliamentLogo size="xs" showText={true} />
          <div className="flex items-center">
            {user?.username && <span className="mr-4 text-gray-600">Welcome, {user.username}</span>}
            <button
              onClick={() => logout()}
              className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="flex-1 overflow-y-auto p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <ErrorBoundary fallback={<ErrorPage />}>
            <Suspense fallback={<LoadingSpinner />}>
              <Outlet /> {/* Render nested routes here */}
            </Suspense>
          </ErrorBoundary>
        </div>
      </main>
      <footer className="bg-gray-100 py-4 text-center text-gray-600 text-sm">
        <div className="max-w-7xl mx-auto">
          &copy; {new Date().getFullYear()} Your Application Name
        </div>
      </footer>
      <ScrollRestoration />
    </div>
  );
}
