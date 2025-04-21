'use client';

import Script from 'next/script';
import { useEffect, Suspense } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

// Google Analytics measurement ID
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

// Analytics tracking component that uses useSearchParams
const AnalyticsTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_MEASUREMENT_ID || !window.gtag) return;

    // Send page view when the path changes
    const url = pathname + (searchParams?.toString() ? `?${searchParams.toString()}` : '');
    window.gtag('config', GA_MEASUREMENT_ID, {
      page_path: url,
    });
  }, [pathname, searchParams]);

  return null;
};

// Initialize Google Analytics
const GoogleAnalytics = () => {
  // Skip rendering if there's no measurement ID
  if (!GA_MEASUREMENT_ID) return null;

  return (
    <>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <Script
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}', {
              page_path: window.location.pathname,
            });
          `,
        }}
      />
      <Suspense fallback={null}>
        <AnalyticsTracking />
      </Suspense>
    </>
  );
};

// Custom event tracking function
export const trackEvent = (
  action: string,
  category: string,
  label: string,
  value?: number
) => {
  if (!GA_MEASUREMENT_ID || typeof window === 'undefined') return;

  window.gtag('event', action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export default GoogleAnalytics;
