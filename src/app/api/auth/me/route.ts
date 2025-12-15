/**
 * Get current user API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;

    if (!sessionToken) {
      return NextResponse.json({ user: null });
    }

    const session = await prisma.session.findUnique({
      where: { sessionToken },
      include: { user: true },
    });

    if (!session || session.expires < new Date()) {
      const response = NextResponse.json({ user: null });
      response.cookies.delete('session-token');
      return response;
    }

    return NextResponse.json({
      user: {
        id: session.user.id,
        phone: session.user.email,
        name: session.user.name,
        role: session.user.role,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return NextResponse.json({ user: null });
  }
}
