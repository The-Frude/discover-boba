'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { withSuspense } from '@/components/hoc/withSuspense';

interface ProtectedRouteProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

const ProtectedRouteContent: React.FC<ProtectedRouteProps> = ({ children, adminOnly = false }) => {
  const { user, isLoading, isAdmin } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isProcessingCode, setIsProcessingCode] = useState(false);
  
  // Check if there's a confirmation code in the URL
  const code = searchParams.get('code');
  const hasConfirmationCode = !!code;

  useEffect(() => {
    // If not loading and no user, and no confirmation code, redirect to login
    if (!isLoading && !user && !hasConfirmationCode && !isProcessingCode) {
      router.push('/login');
    }

    // If admin only and user is not admin, redirect to dashboard
    if (!isLoading && user && adminOnly && !isAdmin) {
      router.push('/dashboard');
    }
    
    // If there's a confirmation code, set processing state to true
    // This prevents redirect until the dashboard page can handle the code
    if (hasConfirmationCode) {
      setIsProcessingCode(true);
    }
  }, [user, isLoading, router, adminOnly, isAdmin, hasConfirmationCode, isProcessingCode]);

  // Show loading state while checking authentication
  if (isLoading || (hasConfirmationCode && isProcessingCode)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="h-12 w-12 rounded-full bg-primary-200 dark:bg-primary-900 mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  // If not authenticated and no confirmation code, show nothing (will redirect)
  if (!user && !hasConfirmationCode) {
    return null;
  }

  // If admin only and not admin, show nothing (will redirect)
  if (adminOnly && !isAdmin) {
    return null;
  }

  // If there's a confirmation code, allow access to handle verification
  if (hasConfirmationCode) {
    return <>{children}</>;
  }

  // If authenticated (and admin if required), show children
  return <>{children}</>;
};

// Export the component wrapped with Suspense
export default withSuspense(ProtectedRouteContent);
