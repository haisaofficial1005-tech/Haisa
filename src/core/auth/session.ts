/**
 * Enhanced Session management utilities with JWT
 */

import { cookies } from 'next/headers';
import { verifySessionToken, shouldRefreshToken, generateSessionToken, type JWTPayload } from '@/core/security/jwt';

export interface SessionUser {
  userId: string;
  phone: string;
  name: string;
  role: string;
  loginAt: string;
  sessionId: string;
  deviceFingerprint?: string;
}

export async function getSession(): Promise<SessionUser | null> {
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get('haisa-session');

    if (!sessionCookie?.value) {
      return null;
    }

    // Verify JWT token
    const payload = verifySessionToken(sessionCookie.value);
    if (!payload) {
      return null;
    }

    // Check if token should be refreshed
    if (shouldRefreshToken(payload)) {
      try {
        // Generate new token with same data
        const newToken = generateSessionToken({
          userId: payload.userId,
          phone: payload.phone,
          name: payload.name,
          role: payload.role,
          deviceFingerprint: payload.deviceFingerprint,
        });

        // Update cookie
        cookieStore.set('haisa-session', newToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'strict',
          maxAge: 24 * 60 * 60, // 24 hours
          path: '/',
        });
        
        console.log('Session token refreshed for user:', payload.userId);
      } catch (refreshError) {
        console.error('Failed to refresh token:', refreshError);
        // Continue with existing token if refresh fails
      }
    }

    return {
      userId: payload.userId,
      phone: payload.phone,
      name: payload.name,
      role: payload.role,
      loginAt: payload.loginAt,
      sessionId: payload.sessionId,
      deviceFingerprint: payload.deviceFingerprint,
    };
  } catch (error) {
    console.error('Session error:', error);
    return null;
  }
}

export async function requireAuth(allowedRoles?: string[]): Promise<SessionUser> {
  const session = await getSession();
  
  if (!session) {
    throw new Error('Authentication required');
  }

  if (allowedRoles && !allowedRoles.includes(session.role)) {
    throw new Error('Insufficient permissions');
  }

  return session;
}

export async function requireAdminAuth(): Promise<SessionUser> {
  return requireAuth(['ADMIN', 'OPS', 'AGENT']);
}

export async function clearSession(): Promise<void> {
  const cookieStore = cookies();
  cookieStore.delete('haisa-session');
}