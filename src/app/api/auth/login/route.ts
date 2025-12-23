/**
 * Custom Login API for Phone-based Authentication
 * Enhanced security with JWT, rate limiting, and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { cookies } from 'next/headers';
import { generateSessionToken, generateDeviceFingerprint } from '@/core/security/jwt';
import { validateLoginInput } from '@/core/security/validation';
import { checkRateLimit, isClientBlocked, blockClient } from '@/core/security/rate-limit';
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
      logRateLimitExceeded('/api/auth/login', request);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Terlalu banyak percobaan login. Coba lagi nanti.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const { phone, name } = await request.json();

    if (!phone) {
      logLoginFailed('', 'Missing phone number', request);
      return NextResponse.json(
        { success: false, error: 'Nomor WhatsApp diperlukan' },
        { status: 400 }
      );
    }

    // Validate and sanitize input
    let validatedData;
    try {
      validatedData = validateLoginInput(phone, name);
    } catch (error) {
      logLoginFailed(phone, `Validation error: ${error.message}`, request);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const { phone: normalizedPhone, name: sanitizedName } = validatedData;

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (!user) {
      // Create new customer user with unique email
      const uniqueEmail = `${normalizedPhone}@haisa.wa`;
      user = await prisma.user.create({
        data: {
          phone: normalizedPhone,
          name: sanitizedName || `User ${normalizedPhone}`,
          email: uniqueEmail,
          role: 'CUSTOMER',
        },
      });
    } else if (sanitizedName && user.name !== sanitizedName) {
      // Update name if provided and different
      user = await prisma.user.update({
        where: { id: user.id },
        data: { name: sanitizedName },
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
    console.error('Login error:', error);
    
    // Log the error but don't expose details
    logLoginFailed('', `Server error: ${error instanceof Error ? error.message : 'Unknown'}`, request);
    
    // Block client if too many server errors (potential attack)
    const errorCount = (global as any).loginErrors || 0;
    (global as any).loginErrors = errorCount + 1;
    
    if (errorCount > 10) {
      blockClient(request, 60 * 60 * 1000); // Block for 1 hour
    }
    
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}