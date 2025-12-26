/**
 * Set Password API - For new users or users without password
 * Creates account with password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { cookies } from 'next/headers';
import { generateSessionToken, generateDeviceFingerprint } from '@/core/security/jwt';
import { validateLoginInput } from '@/core/security/validation';
import { hashPassword } from '@/core/security/encryption';
import { checkRateLimit, isClientBlocked } from '@/core/security/rate-limit';
import { logLoginSuccess, logLoginFailed, logRateLimitExceeded } from '@/core/security/logger';

export async function POST(request: NextRequest) {
  try {
    // Check if client is blocked
    if (isClientBlocked(request)) {
      return NextResponse.json(
        { success: false, error: 'Akses diblokir sementara karena aktivitas mencurigakan' },
        { status: 429 }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(request, 'LOGIN');
    if (!rateLimit.allowed) {
      logRateLimitExceeded('/api/auth/set-password', request);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Terlalu banyak percobaan. Coba lagi nanti.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const { phone, name, password } = await request.json();

    if (!phone || !password) {
      logLoginFailed(phone || '', 'Missing phone or password', request);
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp dan password diperlukan' },
        { status: 400 }
      );
    }

    // Validate password
    if (password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Password minimal 6 karakter' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = validateLoginInput(phone, name || '');
    } catch (error) {
      logLoginFailed(phone, `Validation error: ${error.message}`, request);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const { phone: normalizedPhone, name: sanitizedName } = validatedData;

    // Hash password
    const passwordHash = await hashPassword(password);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (user) {
      // Update existing user with password
      user = await prisma.user.update({
        where: { id: user.id },
        data: {
          hasPassword: true,
          passwordHash,
          name: sanitizedName || user.name,
        },
      });
    } else {
      // Create new user with password
      const uniqueEmail = `${normalizedPhone}@haisa.wa`;
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: sanitizedName || `User ${normalizedPhone}`,
          email: uniqueEmail,
          role: 'CUSTOMER',
          hasPassword: true,
          passwordHash,
        },
      });
    }

    // Generate device fingerprint for additional security
    const userAgent = request.headers.get('user-agent') || '';
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0] : 'unknown';
    const deviceFingerprint = generateDeviceFingerprint(userAgent, ip);

    // Generate secure JWT token
    const sessionToken = generateSessionToken({
      userId: user.id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      deviceFingerprint,
    });

    // Set secure session cookie
    const cookieStore = cookies();
    cookieStore.set('haisa-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/',
    });

    // Log successful login
    logLoginSuccess(user.id, user.phone, request);

    console.log('Password set successfully for user:', {
      id: user.id,
      phone: user.phone,
      role: user.role,
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.phone,
        name: user.name,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Set password error:', error);
    logLoginFailed('', `Server error: ${error instanceof Error ? error.message : 'Unknown'}`, request);
    
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}