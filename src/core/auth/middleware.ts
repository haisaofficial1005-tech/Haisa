/**
 * API Authentication Middleware
 * Simple session-based auth with Turso
 */

import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/core/db';

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
 */
export async function validateSession(): Promise<AuthResult> {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session-token')?.value;

    if (!sessionToken) {
      return {
        authenticated: false,
        user: null,
        error: 'No session token',
      };
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return {
        authenticated: false,
        user: null,
        error: 'Session expired or invalid',
      };
    }

    return {
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        name: session.user.name || '',
        role: session.user.role,
      },
    };
  } catch (error) {
    console.error('Session validation error:', error);
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
