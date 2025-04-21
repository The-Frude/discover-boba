// Import Sentry for the onRequestError hook
import * as Sentry from '@sentry/nextjs';

// Export the onRequestError hook
export const onRequestError = Sentry.captureRequestError;

export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    // Server-side Sentry initialization
    const { init } = await import('@sentry/nextjs');
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: process.env.NODE_ENV === 'development',
      ignoreErrors: [
        // Add any errors you want to ignore here
        'ResizeObserver loop limit exceeded',
      ],
      ignoreTransactions: [
        // Add any paths you want to exclude from performance monitoring
        '/api/health',
      ],
    });
  } else if (process.env.NEXT_RUNTIME === 'edge') {
    // Edge runtime Sentry initialization
    const { init } = await import('@sentry/nextjs');
    init({
      dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
      tracesSampleRate: 1.0,
      debug: process.env.NODE_ENV === 'development',
    });
  }
}
