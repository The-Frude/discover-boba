// Content Security Policy (CSP) configuration

/**
 * Generate a Content Security Policy string
 * @returns {string} The CSP string
 */
export function generateCSP(): string {
  // Get environment variables for CSP directives
  const connectSrc = process.env.NEXT_PUBLIC_CSP_CONNECT_SRC || 
    "'self' https://www.google-analytics.com https://*.sentry.io";
  
  const imgSrc = process.env.NEXT_PUBLIC_CSP_IMG_SRC || 
    "'self' data: https://maps.googleapis.com https://*.googleusercontent.com https://*.vercel.app https://discoverboba.com";
  
  const scriptSrc = process.env.NEXT_PUBLIC_CSP_SCRIPT_SRC || 
    "'self' 'unsafe-inline' https://maps.googleapis.com https://www.googletagmanager.com";
  
  // Build the CSP string
  const csp = [
    // Default directives
    "default-src 'self'",
    
    // Script sources
    `script-src ${scriptSrc}`,
    
    // Style sources
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    
    // Font sources
    "font-src 'self' https://fonts.gstatic.com",
    
    // Image sources
    `img-src ${imgSrc}`,
    
    // Connect sources (for fetch, WebSocket, etc.)
    `connect-src ${connectSrc}`,
    
    // Frame sources
    "frame-src 'self' https://www.google.com",
    
    // Media sources
    "media-src 'self'",
    
    // Object sources
    "object-src 'none'",
    
    // Base URI
    "base-uri 'self'",
    
    // Form action
    "form-action 'self'",
    
    // Frame ancestors (clickjacking protection)
    "frame-ancestors 'self'",
    
    // Manifest sources
    "manifest-src 'self'",
    
    // Worker sources
    "worker-src 'self' blob:",
  ].join('; ');
  
  return csp;
}

/**
 * Get CSP headers for Next.js middleware
 * @returns {Record<string, string>} Headers object with CSP
 */
export function getCSPHeaders(): Record<string, string> {
  return {
    'Content-Security-Policy': generateCSP(),
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(self)',
  };
}
