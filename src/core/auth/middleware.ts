/**
 * API Authentication Middleware
 * Simple session-based auth with Turso
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';

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
 * Validates session from request cookies
 */
export async function validateSession(request: NextRequest): Promise<AuthResult> {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return { authenticated: false, user: null, error: 'No session token' };
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      return { authenticated: false, user: null, error: 'Session expired' };
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
    return { authenticated: false, user: null, error: 'Validation failed' };
  }
}


export function unauthorizedResponse(message = 'Unauthorized'): NextResponse {
  return NextResponse.json({ error: message, code: 'UNAUTHORIZED' }, { status: 401 });
}

export function forbiddenResponse(message = 'Forbidden'): NextResponse {
  return NextResponse.json({ error: message, code: 'FORBIDDEN' }, { status: 403 });
}

export async function requireAuth(request: NextRequest): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const result = await validateSession(request);
  if (!result.authenticated || !result.user) {
    return unauthorizedResponse(result.error);
  }
  return { user: result.user };
}

export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<{ user: AuthenticatedUser } | NextResponse> {
  const authResult = await requireAuth(request);
  if (authResult instanceof NextResponse) return authResult;
  if (!allowedRoles.includes(authResult.user.role)) {
    return forbiddenResponse('Insufficient permissions');
  }
  return authResult;
}
