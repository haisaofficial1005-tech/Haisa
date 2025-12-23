/**
 * Agents API
 * Endpoint untuk mendapatkan daftar agent
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/users/agents
 * Get list of agents
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication (admin/ops only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (!['ADMIN', 'OPS'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops can view agents' },
        { status: 403 }
      );
    }

    // Get all agents
    const agents = await prisma.user.findMany({
      where: {
        role: {
          in: ['AGENT', 'OPS', 'ADMIN'],
        },
      },
      select: {
        id: true,
        name: true,
        phone: true,
        role: true,
        createdAt: true,
      },
      orderBy: { name: 'asc' },
    });

    return NextResponse.json({
      success: true,
      agents,
    });

  } catch (error) {
    console.error('Error getting agents:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get agents' },
      { status: 500 }
    );
  }
}