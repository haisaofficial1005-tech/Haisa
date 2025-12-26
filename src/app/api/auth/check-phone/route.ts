/**
 * Check Phone API - Step 1 of Login
 * Checks if phone number exists and whether user has password
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateLoginInput } from '@/core/security/validation';
import { checkRateLimit, isClientBlocked } from '@/core/security/rate-limit';
import { logLoginFailed, logRateLimitExceeded } from '@/core/security/logger';

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
      logRateLimitExceeded('/api/auth/check-phone', request);
      return NextResponse.json(
        { 
          success: false, 
          error: 'Terlalu banyak percobaan. Coba lagi nanti.',
          retryAfter: Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
        },
        { status: 429 }
      );
    }

    const { phone } = await request.json();

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
      validatedData = validateLoginInput(phone, '');
    } catch (error) {
      logLoginFailed(phone, `Validation error: ${error.message}`, request);
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    const { phone: normalizedPhone } = validatedData;

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
      select: {
        id: true,
        phone: true,
        name: true,
        hasPassword: true,
        role: true,
      },
    });

    if (user) {
      // User exists - check if they have password
      return NextResponse.json({
        success: true,
        userExists: true,
        hasPassword: user.hasPassword,
        userName: user.name,
        nextStep: user.hasPassword ? 'login' : 'set-password'
      });
    } else {
      // New user - needs to set password
      return NextResponse.json({
        success: true,
        userExists: false,
        hasPassword: false,
        nextStep: 'set-password'
      });
    }

  } catch (error) {
    console.error('Check phone error:', error);
    logLoginFailed('', `Server error: ${error instanceof Error ? error.message : 'Unknown'}`, request);
    
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan server' },
      { status: 500 }
    );
  }
}