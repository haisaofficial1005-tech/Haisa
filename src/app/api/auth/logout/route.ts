/**
 * Logout API
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const sessionToken = request.cookies.get('session-token')?.value;

    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { sessionToken },
      });
    }

    const response = NextResponse.json({ success: true });
    response.cookies.delete('session-token');
    return response;
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json({ error: 'Logout failed' }, { status: 500 });
  }
}
