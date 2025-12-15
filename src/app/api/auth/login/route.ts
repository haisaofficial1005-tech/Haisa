/**
 * Simple WhatsApp Number Login API
 * No hashing, direct lookup in Turso
 */

import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { prisma } from '@/core/db';

export async function POST(request: NextRequest) {
  try {
    const { phone, name } = await request.json();

    if (!phone) {
      return NextResponse.json({ error: 'Phone number required' }, { status: 400 });
    }

    // Normalize phone number (remove spaces, dashes)
    const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

    // Find or create user by phone
    let user = await prisma.user.findFirst({
      where: { email: normalizedPhone }, // Using email field to store phone
    });

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: normalizedPhone, // Store phone in email field
          name: name || `User ${normalizedPhone.slice(-4)}`,
          role: 'CUSTOMER',
          updatedAt: new Date(),
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
    return NextResponse.json({ error: 'Login failed' }, { status: 500 });
  }
}
