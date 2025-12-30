/**
 * Rate Limiting for Permission Please API
 *
 * Prevents abuse and ensures fair usage across schools.
 * Uses in-memory store (suitable for single instance).
 * For multi-instance deployments, use Redis instead.
 */

import { NextResponse } from 'next/server';
import { logger } from './logger';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// In-memory store (replace with Redis for production multi-instance)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically
const CLEANUP_INTERVAL = 60000; // 1 minute
let cleanupTimer: NodeJS.Timeout | null = null;

function startCleanup() {
  if (cleanupTimer) return;
  cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitStore.entries()) {
      if (entry.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }
  }, CLEANUP_INTERVAL);
}

// Start cleanup when module loads
if (typeof window === 'undefined') {
  startCleanup();
}

export interface RateLimitConfig {
  /** Maximum requests allowed in the window */
  max: number;
  /** Time window in milliseconds */
  windowMs: number;
  /** Custom key generator (default: IP address) */
  keyGenerator?: (request: Request) => string;
  /** Whether to skip rate limiting (e.g., for authenticated admins) */
  skip?: (request: Request) => boolean;
  /** Custom message when rate limited */
  message?: string;
}

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetTime: number;
}

/**
 * Default key generator using IP address
 */
function defaultKeyGenerator(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
  return `ratelimit:${ip}`;
}

/**
 * Check rate limit for a request
 */
export function checkRateLimit(request: Request, config: RateLimitConfig): RateLimitResult {
  const { max, windowMs, keyGenerator = defaultKeyGenerator, skip } = config;

  // Skip rate limiting if configured
  if (skip?.(request)) {
    return {
      success: true,
      limit: max,
      remaining: max,
      resetTime: Date.now() + windowMs,
    };
  }

  const key = keyGenerator(request);
  const now = Date.now();

  let entry = rateLimitStore.get(key);

  // Create new entry or reset expired entry
  if (!entry || entry.resetTime < now) {
    entry = {
      count: 0,
      resetTime: now + windowMs,
    };
    rateLimitStore.set(key, entry);
  }

  // Increment count
  entry.count++;

  const remaining = Math.max(0, max - entry.count);
  const success = entry.count <= max;

  if (!success) {
    logger.warn('Rate limit exceeded', {
      key,
      count: entry.count,
      max,
      resetTime: new Date(entry.resetTime).toISOString(),
    });
  }

  return {
    success,
    limit: max,
    remaining,
    resetTime: entry.resetTime,
  };
}

/**
 * Create rate limit response headers
 */
export function createRateLimitHeaders(result: RateLimitResult): Headers {
  const headers = new Headers();
  headers.set('X-RateLimit-Limit', result.limit.toString());
  headers.set('X-RateLimit-Remaining', result.remaining.toString());
  headers.set('X-RateLimit-Reset', result.resetTime.toString());
  return headers;
}

/**
 * Rate limit middleware wrapper for API routes
 *
 * Usage:
 * ```typescript
 * import { withRateLimit } from '@/lib/rate-limit';
 *
 * export const GET = withRateLimit(
 *   async (request) => {
 *     // Your handler
 *   },
 *   { max: 100, windowMs: 60000 }
 * );
 * ```
 */
export function withRateLimit<T>(
  handler: (request: Request) => Promise<T>,
  config: Partial<RateLimitConfig> = {}
) {
  const finalConfig: RateLimitConfig = {
    max: config.max ?? 100,
    windowMs: config.windowMs ?? 60000, // 1 minute default
    keyGenerator: config.keyGenerator ?? defaultKeyGenerator,
    skip: config.skip,
    message: config.message ?? 'Too many requests, please try again later',
  };

  return async (request: Request): Promise<T | NextResponse> => {
    const result = checkRateLimit(request, finalConfig);

    if (!result.success) {
      const response = NextResponse.json(
        {
          error: 'Too Many Requests',
          message: finalConfig.message,
          retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
        },
        { status: 429 }
      );

      // Add rate limit headers
      const headers = createRateLimitHeaders(result);
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
      response.headers.set(
        'Retry-After',
        Math.ceil((result.resetTime - Date.now()) / 1000).toString()
      );

      return response;
    }

    // Call the original handler
    const response = await handler(request);

    // Add rate limit headers to successful response
    if (response instanceof NextResponse) {
      const headers = createRateLimitHeaders(result);
      headers.forEach((value, key) => {
        response.headers.set(key, value);
      });
    }

    return response;
  };
}

/**
 * Preset rate limit configurations for different endpoints
 */
export const rateLimitPresets = {
  // Standard API endpoints
  api: { max: 100, windowMs: 60000 },

  // Authentication endpoints (stricter)
  auth: { max: 10, windowMs: 60000 },

  // Form submission (moderate)
  formSubmit: { max: 30, windowMs: 60000 },

  // Email sending (very strict)
  email: { max: 5, windowMs: 60000 },

  // Health checks (lenient)
  health: { max: 1000, windowMs: 60000 },
};

/**
 * Simple rate limit check for use at the start of any handler.
 * Returns a 429 response if rate limited, or null if OK.
 *
 * Usage:
 * ```typescript
 * const rateLimited = applyRateLimit(request, 'api');
 * if (rateLimited) return rateLimited;
 * // Continue with handler...
 * ```
 */
export function applyRateLimit(
  request: Request,
  preset: keyof typeof rateLimitPresets = 'api'
): NextResponse | null {
  const config = rateLimitPresets[preset];
  const result = checkRateLimit(request, config);

  if (!result.success) {
    const response = NextResponse.json(
      {
        error: 'Too Many Requests',
        message: 'Too many requests, please try again later',
        retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
      },
      { status: 429 }
    );

    const headers = createRateLimitHeaders(result);
    headers.forEach((value, key) => {
      response.headers.set(key, value);
    });
    response.headers.set(
      'Retry-After',
      Math.ceil((result.resetTime - Date.now()) / 1000).toString()
    );

    return response;
  }

  return null;
}
