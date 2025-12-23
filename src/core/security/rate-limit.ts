/**
 * Rate Limiting Implementation
 * Protect against brute force and abuse
 */

import { NextRequest } from 'next/server';

interface RateLimitEntry {
  count: number;
  resetTime: number;
  blocked: boolean;
}

// In-memory store (use Redis in production)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configurations
export const RATE_LIMITS = {
  LOGIN: { requests: 5, windowMs: 15 * 60 * 1000 }, // 5 attempts per 15 minutes
  API_GENERAL: { requests: 100, windowMs: 15 * 60 * 1000 }, // 100 requests per 15 minutes
  PAYMENT: { requests: 10, windowMs: 60 * 1000 }, // 10 payment requests per minute
  FILE_UPLOAD: { requests: 20, windowMs: 60 * 1000 }, // 20 uploads per minute
};

/**
 * Get client identifier (IP + User Agent hash)
 */
function getClientId(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  const userAgent = request.headers.get('user-agent') || '';
  const hash = Buffer.from(userAgent).toString('base64').substring(0, 10);
  
  return `${ip}-${hash}`;
}

/**
 * Check rate limit for a client
 */
export function checkRateLimit(
  request: NextRequest, 
  limitType: keyof typeof RATE_LIMITS
): { allowed: boolean; remaining: number; resetTime: number } {
  const clientId = getClientId(request);
  const key = `${limitType}:${clientId}`;
  const config = RATE_LIMITS[limitType];
  
  const now = Date.now();
  let entry = rateLimitStore.get(key);
  
  // Clean up expired entries
  if (entry && now > entry.resetTime) {
    entry = undefined;
  }
  
  if (!entry) {
    entry = {
      count: 1,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(key, entry);
    
    return {
      allowed: true,
      remaining: config.requests - 1,
      resetTime: entry.resetTime,
    };
  }
  
  entry.count++;
  
  if (entry.count > config.requests) {
    entry.blocked = true;
    return {
      allowed: false,
      remaining: 0,
      resetTime: entry.resetTime,
    };
  }
  
  return {
    allowed: true,
    remaining: config.requests - entry.count,
    resetTime: entry.resetTime,
  };
}

/**
 * Block a client temporarily (for suspicious activity)
 */
export function blockClient(request: NextRequest, durationMs: number = 60 * 60 * 1000) {
  const clientId = getClientId(request);
  const key = `BLOCKED:${clientId}`;
  
  rateLimitStore.set(key, {
    count: 999,
    resetTime: Date.now() + durationMs,
    blocked: true,
  });
}

/**
 * Check if client is blocked
 */
export function isClientBlocked(request: NextRequest): boolean {
  const clientId = getClientId(request);
  const key = `BLOCKED:${clientId}`;
  const entry = rateLimitStore.get(key);
  
  if (!entry) return false;
  
  if (Date.now() > entry.resetTime) {
    rateLimitStore.delete(key);
    return false;
  }
  
  return entry.blocked;
}

/**
 * Clean up expired entries (call periodically)
 */
export function cleanupRateLimit() {
  const now = Date.now();
  
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
setInterval(cleanupRateLimit, 5 * 60 * 1000);