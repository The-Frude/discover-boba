'use client';

import React, { Suspense, ComponentType } from 'react';

// Loading component for Suspense fallback
function PageLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse flex flex-col items-center">
        <div className="h-12 w-12 rounded-full bg-primary-200 dark:bg-primary-900 mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
      </div>
    </div>
  );
}

// Higher-Order Component that wraps a component with Suspense
export function withSuspense<P extends object>(
  Component: ComponentType<P>,
  LoadingComponent: React.ReactNode = <PageLoading />
) {
  function WithSuspense(props: P) {
    return (
      <Suspense fallback={LoadingComponent}>
        <Component {...props} />
      </Suspense>
    );
  }

  // Set display name for debugging
  const displayName = Component.displayName || Component.name || 'Component';
  WithSuspense.displayName = `withSuspense(${displayName})`;

  return WithSuspense;
}
