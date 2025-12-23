/**
 * JWT Token Management
 * Secure session management without OTP
 */

import jwt from 'jsonwebtoken';
import crypto from 'crypto';

const JWT_SECRET = process.env.JWT_SECRET || 'haisa-wa-secret-key-change-in-production';
const JWT_EXPIRES_IN = '24h'; // 24 hours instead of 30 days

export interface JWTPayload {
  userId: string;
  phone: string;
  name: string;
  role: string;
  sessionId: string;
  loginAt: string;
  deviceFingerprint?: string;
}

/**
 * Generate secure session token
 */
export function generateSessionToken(payload: Omit<JWTPayload, 'sessionId' | 'loginAt'>): string {
  const sessionId = crypto.randomUUID();
  const loginAt = new Date().toISOString();
  
  const tokenPayload: JWTPayload = {
    ...payload,
    sessionId,
    loginAt,
  };

  return jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
    issuer: 'haisa-wa',
    audience: 'haisa-wa-users',
  });
}

/**
 * Verify and decode session token
 */
export function verifySessionToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'haisa-wa',
      audience: 'haisa-wa-users',
    }) as JWTPayload;

    return decoded;
  } catch (error) {
    console.error('JWT verification failed:', error);
    return null;
  }
}

/**
 * Generate device fingerprint for additional security
 */
export function generateDeviceFingerprint(userAgent: string, ip: string): string {
  const data = `${userAgent}-${ip}-${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Refresh token if it's close to expiry
 */
export function shouldRefreshToken(payload: JWTPayload): boolean {
  const loginTime = new Date(payload.loginAt).getTime();
  const now = Date.now();
  const hoursSinceLogin = (now - loginTime) / (1000 * 60 * 60);
  
  // Refresh if token is older than 20 hours (4 hours before expiry)
  return hoursSinceLogin > 20;
}