import { withSentryConfig } from '@sentry/nextjs';

// Helper to safely get environment variables
const getEnvVar = (name, defaultValue = '') => {
  const value = process.env[name];
  return value || defaultValue;
};

// Detect build phase
const isBuildPhase = process.env.NEXT_PHASE === 'phase-production-build' || 
                     process.env.NEXT_PHASE === 'build';

// Provide mock values during build if needed
const getMockableEnvVar = (name, defaultValue = '') => {
  const value = process.env[name];
  if (!value && isBuildPhase) {
    console.log(`Using mock value for ${name} during build`);
    return defaultValue;
  }
  return value || defaultValue;
};

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: true,
  },
  
  // Image optimization settings
  images: {
    domains: [
      'lh3.googleusercontent.com', 
      'lh4.googleusercontent.com', 
      'lh5.googleusercontent.com',
      'discoverboba.com',
      'vercel.app'
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel.app',
      },
      {
        protocol: 'https',
        hostname: 'discoverboba.com',
      }
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 60,
    unoptimized: false,
  },
  
  // Enable compression for better performance
  compress: true,
  
  // Configure static file serving with cache headers
  async headers() {
    return [
      {
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/images/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=86400',
          },
        ],
      },
    ];
  },
  
  // Configure redirects for SEO
  async redirects() {
    return [
      {
        source: '/index',
        destination: '/',
        permanent: true,
      },
    ];
  },
  
  // Configure environment variables with safe defaults for build time
  env: {
    // Base URL
    NEXT_PUBLIC_SITE_URL: getEnvVar('NEXT_PUBLIC_SITE_URL', 'https://discoverboba.com'),
    
    // Supabase variables
    NEXT_PUBLIC_SUPABASE_URL: getEnvVar('NEXT_PUBLIC_SUPABASE_URL'),
    NEXT_PUBLIC_SUPABASE_ANON_KEY: getEnvVar('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    SUPABASE_SERVICE_ROLE_KEY: getEnvVar('SUPABASE_SERVICE_ROLE_KEY'),
    
    // Stripe variables with safe defaults for build time
    STRIPE_SECRET_KEY: getMockableEnvVar('STRIPE_SECRET_KEY', 'sk_test_mock_key_for_build'),
    STRIPE_WEBHOOK_SECRET: getMockableEnvVar('STRIPE_WEBHOOK_SECRET', 'whsec_mock_key_for_build'),
    STRIPE_MONTHLY_PRICE_ID: getMockableEnvVar('STRIPE_MONTHLY_PRICE_ID', 'price_mock_monthly'),
    STRIPE_ANNUAL_PRICE_ID: getMockableEnvVar('STRIPE_ANNUAL_PRICE_ID', 'price_mock_annual'),
    NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: getMockableEnvVar('NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY', 'pk_test_mock_key_for_build'),
    
    // Build information
    NEXT_PHASE: process.env.NEXT_PHASE || '',
    IS_BUILD_TIME: isBuildPhase ? 'true' : 'false',
  },
  
  // Configure webpack for production
  webpack: (config, { dev, isServer }) => {
    // Production optimizations
    if (!dev) {
      config.optimization.minimize = true;
    }

    // Configure markdown file handling
    config.module.rules.push({
      test: /\.md$/,
      use: 'raw-loader'
    });
    
    return config;
  },
};

// Wrap with Sentry configuration
export default withSentryConfig(
  nextConfig,
  {
    // For all available options, see:
    // https://github.com/getsentry/sentry-webpack-plugin#options

    // Suppresses source map uploading logs during build
    silent: true,
    org: "discover-boba",
    project: "discover-boba-web",
  },
  {
    // For all available options, see:
    // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

    // Upload a larger set of source maps for prettier stack traces (increases build time)
    widenClientFileUpload: true,

    // Transpiles SDK to be compatible with IE11 (increases bundle size)
    transpileClientSDK: true,

    // Routes browser requests to Sentry through a Next.js rewrite to circumvent ad-blockers (increases server load)
    tunnelRoute: "/monitoring",

    // Hides source maps from generated client bundles
    hideSourceMaps: true,

    // Automatically tree-shake Sentry logger statements to reduce bundle size
    disableLogger: true,
  }
);
