/**
 * Rate Limiting Middleware
 * Requirements: 12.1
 * Property 21: Rate Limiting
 */

import { NextResponse } from 'next/server';

/**
 * Rate limit configuration
 */
export interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Rate limit entry for tracking requests
 */
interface RateLimitEntry {
  /** Timestamps of requests within the window */
  timestamps: number[];
}

/**
 * In-memory store for rate limiting
 * In production, use Redis or similar for distributed rate limiting
 */
const rateLimitStore = new Map<string, RateLimitEntry>();

/**
 * Default rate limit configuration
 * 5 ticket submissions per hour per customer
 */
export const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 60 * 60 * 1000, // 1 hour
};

/**
 * Cleans up expired entries from the store
 */
function cleanupExpiredEntries(windowMs: number): void {
  const now = Date.now();
  
  const entries = Array.from(rateLimitStore.entries());
  for (const [key, entry] of entries) {
    // Filter out timestamps outside the window
    entry.timestamps = entry.timestamps.filter((ts: number) => now - ts < windowMs);
    
    // Remove entry if no timestamps remain
    if (entry.timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Checks if a request should be rate limited using sliding window algorithm
 * Property 21: Rate Limiting
 * 
 * @param identifier - Unique identifier for the rate limit (e.g., user ID, IP)
 * @param config - Rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const windowStart = now - config.windowMs;

  // Get or create entry for this identifier
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(identifier, entry);
  }

  // Filter timestamps to only include those within the window (sliding window)
  entry.timestamps = entry.timestamps.filter(ts => ts > windowStart);

  // Calculate remaining requests
  const requestsInWindow = entry.timestamps.length;
  const remaining = Math.max(0, config.maxRequests - requestsInWindow);
  
  // Calculate when the oldest request will expire
  const oldestTimestamp = entry.timestamps[0] || now;
  const resetAt = oldestTimestamp + config.windowMs;

  // Check if request is allowed
  const allowed = requestsInWindow < config.maxRequests;

  return { allowed, remaining, resetAt };
}

/**
 * Records a request for rate limiting
 * Call this after checkRateLimit returns allowed: true
 */
export function recordRequest(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): void {
  const now = Date.now();
  
  let entry = rateLimitStore.get(identifier);
  
  if (!entry) {
    entry = { timestamps: [] };
    rateLimitStore.set(identifier, entry);
  }

  entry.timestamps.push(now);

  // Periodic cleanup (every 100 requests)
  if (rateLimitStore.size > 100) {
    cleanupExpiredEntries(config.windowMs);
  }
}

/**
 * Rate limit middleware result
 */
export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number;
  response?: NextResponse;
}

/**
 * Rate limit middleware function
 * Returns a response if rate limited, null if allowed
 */
export function rateLimitMiddleware(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): RateLimitResult {
  const { allowed, remaining, resetAt } = checkRateLimit(identifier, config);

  if (!allowed) {
    const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);
    
    const response = NextResponse.json(
      {
        error: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests. Please try again later.',
        retryAfter,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(config.maxRequests),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
        },
      }
    );

    return { allowed: false, remaining: 0, resetAt, response };
  }

  // Record the request
  recordRequest(identifier, config);

  return { allowed: true, remaining: remaining - 1, resetAt };
}

/**
 * Creates rate limit headers for successful responses
 */
export function createRateLimitHeaders(
  config: RateLimitConfig,
  remaining: number,
  resetAt: number
): Record<string, string> {
  return {
    'X-RateLimit-Limit': String(config.maxRequests),
    'X-RateLimit-Remaining': String(remaining),
    'X-RateLimit-Reset': String(Math.ceil(resetAt / 1000)),
  };
}

/**
 * Resets rate limit for a specific identifier (for testing)
 */
export function resetRateLimit(identifier: string): void {
  rateLimitStore.delete(identifier);
}

/**
 * Clears all rate limit entries (for testing)
 */
export function clearAllRateLimits(): void {
  rateLimitStore.clear();
}

/**
 * Gets current rate limit status for an identifier (for testing/debugging)
 */
export function getRateLimitStatus(
  identifier: string,
  config: RateLimitConfig = DEFAULT_RATE_LIMIT
): { requestsInWindow: number; remaining: number; timestamps: number[] } {
  const entry = rateLimitStore.get(identifier);
  const now = Date.now();
  const windowStart = now - config.windowMs;

  if (!entry) {
    return {
      requestsInWindow: 0,
      remaining: config.maxRequests,
      timestamps: [],
    };
  }

  const validTimestamps = entry.timestamps.filter(ts => ts > windowStart);
  
  return {
    requestsInWindow: validTimestamps.length,
    remaining: Math.max(0, config.maxRequests - validTimestamps.length),
    timestamps: validTimestamps,
  };
}
