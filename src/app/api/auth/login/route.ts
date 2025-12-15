/**
 * Simple WhatsApp Number Login API
 * No hashing, direct lookup in Turso
 * Phone format: 6281234567890 (no + sign)
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/core/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { phone, name } = body;

    if (!phone) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }

    // Normalize phone number - keep only digits, remove +, spaces, dashes
    const normalizedPhone = String(phone).replace(/[^\d]/g, '');

    if (normalizedPhone.length < 10) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid' }, { status: 400 });
    }

    // Find or create user by phone
    let user = await prisma.user.findFirst({
      where: { email: normalizedPhone },
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: normalizedPhone,
          name: name || `User ${normalizedPhone.slice(-4)}`,
          role: 'CUSTOMER',
        },
      });
    }

    // Create simple session token
    const sessionToken = crypto.randomUUID();
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

    // Store session in database
    await prisma.session.create({
      data: {
        id: crypto.randomUUID(),
        sessionToken,
        userId: user.id,
        expires,
      },
    });

    // Set session cookie
    const cookieStore = await cookies();
    cookieStore.set('session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      expires,
      path: '/',
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        phone: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ 
      error: 'Login gagal, coba lagi',
      debug: process.env.NODE_ENV !== 'production' ? String(error) : undefined
    }, { status: 500 });
  }
}
