'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // If not loading and no user, redirect to login
    if (!isLoading && !user) {
      router.push('/login');
    }

    // If admin only and user is not admin, redirect to dashboard
    if (!isLoading && user && adminOnly && !isAdmin) {
      router.push('/dashboard');
    }
  }, [user, isLoading, router, adminOnly, isAdmin]);

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary-200 dark:bg-primary-900 mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If not authenticated, show nothing (will redirect)
  if (!user) {
    return null;
  }

  // If admin only and not admin, show nothing (will redirect)
  if (adminOnly && !isAdmin) {
    return null;
  }

  // If authenticated (and admin if required), show children
  return <>{children}</>;
};

export default ProtectedRoute;
