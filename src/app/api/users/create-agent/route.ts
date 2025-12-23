/**
 * Create Agent API
 * Endpoint untuk membuat agent baru
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface CreateAgentBody {
  name: string;
  phone: string;
  role: string;
}

/**
 * POST /api/users/create-agent
 * Create new agent
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin can create agents' },
        { status: 403 }
      );
    }

    const body = await request.json() as CreateAgentBody;
    const { name, phone, role } = body;

    if (!name || !phone || !role) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'name, phone, and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['AGENT', 'OPS', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'INVALID_ROLE', message: 'Invalid role. Must be AGENT, OPS, or ADMIN' },
        { status: 400 }
      );
    }

    // Normalize phone number
    const normalizedPhone = phone.replace(/[^\d]/g, '');
    if (normalizedPhone.length < 10) {
      return NextResponse.json(
        { error: 'INVALID_PHONE', message: 'Invalid phone number' },
        { status: 400 }
      );
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { phone: normalizedPhone },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'USER_EXISTS', message: 'User with this phone number already exists' },
        { status: 400 }
      );
    }

    // Create new agent
    const newAgent = await prisma.user.create({
      data: {
        name,
        phone: normalizedPhone,
        email: `${normalizedPhone}@haisa.wa`,
        role,
      },
    });

    // Log the creation
    console.log(`New agent ${name} (${normalizedPhone}) with role ${role} created by ${authResult.user.name} (${authResult.user.phone})`);

    return NextResponse.json({
      success: true,
      message: `Agent ${name} created successfully`,
      agent: {
        id: newAgent.id,
        name: newAgent.name,
        phone: newAgent.phone,
        role: newAgent.role,
        createdAt: newAgent.createdAt,
      },
    });

  } catch (error) {
    console.error('Error creating agent:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create agent' },
      { status: 500 }
    );
  }
}