/**
 * Get Current User Session API
 * Returns current user information if authenticated
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/core/auth/session';

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: 'No active session' },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        userId: session.userId,
        phone: session.phone,
        name: session.name,
        role: session.role,
        loginAt: session.loginAt,
        sessionId: session.sessionId,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    return NextResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  }
}