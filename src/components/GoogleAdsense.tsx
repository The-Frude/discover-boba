'use client';

import Script from 'next/script';

/**
 * GoogleAdsense component
 * 
 * This component adds Google AdSense to the site.
 * It uses Next.js's Script component to load the AdSense script with the "afterInteractive" strategy.
 */
const GoogleAdsense = () => {
  return (
    <Script
      id="google-adsense"
      strategy="afterInteractive"
      async
      src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-2397860526597645"
      crossOrigin="anonymous"
    />
  );
};

export default GoogleAdsense;
