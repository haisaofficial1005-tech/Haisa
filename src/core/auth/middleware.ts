/**
 * API Authentication Middleware
 * Requirements: 12.3
 */

import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from './auth.options';

// Type alias (SQLite uses strings instead of enums)
type UserRole = string;

export interface AuthenticatedUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
}

export interface AuthResult {
  authenticated: boolean;
  user: AuthenticatedUser | null;
  error?: string;
}

/**
 * Validates session and returns authenticated user
 * Property 22: API Authentication
 */
export async function validateSession(): Promise<AuthResult> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session || !session.user) {
      return {
        authenticated: false,
        user: null,
        error: 'No valid session',
      };
    }

    const user = session.user as AuthenticatedUser;
    
    if (!user.id || !user.email) {
      return {
        authenticated: false,
        user: null,
        error: 'Invalid session data',
      };
    }

    return {
      authenticated: true,
      user,
    };
  } catch (error) {
    return {
      authenticated: false,
      user: null,
      error: 'Session validation failed',
    };
  }
}

/**
 * Creates an unauthorized response
 */
export function unauthorizedResponse(message: string = 'Unauthorized'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'UNAUTHORIZED' },
    { status: 401 }
  );
}

/**
 * Creates a forbidden response
 */
export function forbiddenResponse(message: string = 'Forbidden'): NextResponse {
  return NextResponse.json(
    { error: message, code: 'FORBIDDEN' },
    { status: 403 }
  );
}

/**
 * Middleware to require authentication
 * Returns 401 if not authenticated
 */
export async function requireAuth(): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const result = await validateSession();
  
  if (!result.authenticated || !result.user) {
    return unauthorizedResponse(result.error);
  }
  
  return { user: result.user };
}

/**
 * Middleware to require specific role(s)
 * Returns 401 if not authenticated, 403 if wrong role
 */
export async function requireRole(
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth();
  
  if (authResult instanceof NextResponse) {
    return authResult;
  }
  
  if (!allowedRoles.includes(authResult.user.role)) {
    return forbiddenResponse('Insufficient permissions');
  }
  
  return authResult;
}

/**
 * Checks if a request has valid authentication
 * Pure function for testing
 */
export function isAuthenticated(session: unknown): boolean {
  if (!session || typeof session !== 'object') {
    return false;
  }
  
  const s = session as Record<string, unknown>;
  
  if (!s.user || typeof s.user !== 'object') {
    return false;
  }
  
  const user = s.user as Record<string, unknown>;
  
  return (
    typeof user.id === 'string' &&
    user.id.length > 0 &&
    typeof user.email === 'string' &&
    user.email.length > 0
  );
}

/**
 * Extracts user from session
 * Pure function for testing
 */
export function extractUserFromSession(session: unknown): AuthenticatedUser | null {
  if (!isAuthenticated(session)) {
    return null;
  }
  
  const s = session as { user: Record<string, unknown> };
  const user = s.user;
  
  return {
    id: user.id as string,
    email: user.email as string,
    name: (user.name as string) || '',
    role: (user.role as UserRole) || 'CUSTOMER',
  };
}
