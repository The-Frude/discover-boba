import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';
import { getCSPHeaders } from './src/utils/csp';

// Create a Redis client
const redis = Redis.fromEnv();

// Create a new ratelimiter that allows 100 requests per minute
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(
    Number(process.env.RATE_LIMIT_MAX) || 100, // 100 requests per window
    `${Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000}ms` // 1 minute window
  ),
  analytics: true,
});

// In-memory store fallback for development or if Redis is not configured
const inMemoryStore: Record<string, number[]> = {};
const inMemoryRateLimit = async (identifier: string) => {
  const now = Date.now();
  const windowMs = Number(process.env.RATE_LIMIT_WINDOW_MS) || 60000; // 1 minute
  const max = Number(process.env.RATE_LIMIT_MAX) || 100; // 100 requests per minute
  
  // Get the current window's requests
  const windowStart = now - windowMs;
  inMemoryStore[identifier] = (inMemoryStore[identifier] || []).filter(timestamp => timestamp > windowStart);
  
  // Check if the rate limit is exceeded
  const isRateLimited = inMemoryStore[identifier].length >= max;
  
  // Add the current request timestamp
  if (!isRateLimited) {
    inMemoryStore[identifier].push(now);
  }
  
  return {
    success: !isRateLimited,
    limit: max,
    remaining: Math.max(0, max - inMemoryStore[identifier].length),
    reset: windowStart + windowMs,
  };
};

// Define which routes to apply rate limiting to
const RATE_LIMIT_PATHS = [
  '/api/search',
  '/api/reviews',
  '/api/shops',
  '/api/admin/reviews',
];

export async function middleware(request: NextRequest) {
  // Get the pathname from the URL
  const { pathname } = request.nextUrl;
  
  // Create a response object to modify
  let response = NextResponse.next();
  
  // Apply security headers to all responses
  const securityHeaders = getCSPHeaders();
  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
  
  // Apply rate limiting only to API routes
  if (RATE_LIMIT_PATHS.some(path => pathname.startsWith(path))) {
    // Get the IP address from the request
    // Use X-Forwarded-For header, which is set by most proxies
    const forwardedFor = request.headers.get('x-forwarded-for');
    const identifier = forwardedFor ? 
      forwardedFor.split(',')[0].trim() : 
      'anonymous';
    
    // Check if the request is rate limited
    let result;
    try {
      // Try to use Redis-based rate limiting
      result = await ratelimit.limit(identifier);
    } catch (error) {
      // Fall back to in-memory rate limiting if Redis fails
      console.error('Redis rate limiting failed, using in-memory fallback', error);
      result = await inMemoryRateLimit(identifier);
    }
    
    const { success, limit, remaining, reset } = result;
    
    // Set rate limit headers (using the response object we already created)
    response.headers.set('X-RateLimit-Limit', limit.toString());
    response.headers.set('X-RateLimit-Remaining', remaining.toString());
    response.headers.set('X-RateLimit-Reset', reset.toString());
    
    // If rate limited, return 429 Too Many Requests
    if (!success) {
      return new NextResponse(
        JSON.stringify({ 
          error: 'Too many requests', 
          message: 'Please try again later' 
        }),
        { 
          status: 429, 
          headers: {
            'Content-Type': 'application/json',
            'X-RateLimit-Limit': limit.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': reset.toString(),
            'Retry-After': Math.ceil((reset - Date.now()) / 1000).toString(),
          }
        }
      );
    }
    
    return response;
  }
  
  return response;
}

export const config = {
  matcher: [
    // Apply middleware to all routes
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
