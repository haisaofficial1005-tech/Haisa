/**
 * Enhanced Authentication middleware for API routes
 */

import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, type JWTPayload } from '@/core/security/jwt';
import { checkRateLimit, isClientBlocked } from '@/core/security/rate-limit';
import { logUnauthorizedAccess, logRateLimitExceeded } from '@/core/security/logger';

export interface AuthResult {
  authenticated: boolean;
  user: JWTPayload | null;
}

export async function validateSession(request: NextRequest): Promise<AuthResult> {
  try {
    // Check if client is blocked
    if (isClientBlocked(request)) {
      return { authenticated: false, user: null };
    }

    // Get session from cookie
    const sessionCookie = request.cookies.get('haisa-session');
    
    if (!sessionCookie?.value) {
      return { authenticated: false, user: null };
    }

    // Verify JWT token
    const payload = verifySessionToken(sessionCookie.value);
    if (!payload) {
      return { authenticated: false, user: null };
    }

    return { authenticated: true, user: payload };
  } catch (error) {
    console.error('Session validation error:', error);
    return { authenticated: false, user: null };
  }
}

export function unauthorizedResponse(message?: string) {
  return NextResponse.json(
    { error: 'UNAUTHORIZED', message: message || 'Authentication required' },
    { status: 401 }
  );
}

export function forbiddenResponse(message?: string) {
  return NextResponse.json(
    { error: 'FORBIDDEN', message: message || 'Insufficient permissions' },
    { status: 403 }
  );
}

export function rateLimitResponse(retryAfter: number) {
  return NextResponse.json(
    { 
      error: 'RATE_LIMIT_EXCEEDED', 
      message: 'Too many requests',
      retryAfter 
    },
    { 
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
      }
    }
  );
}

/**
 * Middleware wrapper for API routes with rate limiting
 */
export function withRateLimit(
  handler: (request: NextRequest) => Promise<NextResponse>,
  limitType: 'API_GENERAL' | 'PAYMENT' | 'FILE_UPLOAD' = 'API_GENERAL'
) {
  return async (request: NextRequest) => {
    // Check rate limit
    const rateLimit = checkRateLimit(request, limitType);
    if (!rateLimit.allowed) {
      logRateLimitExceeded(request.nextUrl.pathname, request);
      return rateLimitResponse(Math.ceil((rateLimit.resetTime - Date.now()) / 1000));
    }

    return handler(request);
  };
}

/**
 * Middleware wrapper for authenticated API routes
 */
export function withAuth(
  handler: (request: NextRequest, user: JWTPayload) => Promise<NextResponse>,
  allowedRoles?: string[]
) {
  return async (request: NextRequest) => {
    const authResult = await validateSession(request);
    
    if (!authResult.authenticated || !authResult.user) {
      logUnauthorizedAccess(request.nextUrl.pathname, undefined, request);
      return unauthorizedResponse();
    }

    if (allowedRoles && !allowedRoles.includes(authResult.user.role)) {
      logUnauthorizedAccess(request.nextUrl.pathname, authResult.user.userId, request);
      return forbiddenResponse();
    }

    return handler(request, authResult.user);
  };
}