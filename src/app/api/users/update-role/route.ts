/**
 * Update User Role API
 * Endpoint untuk mengubah role user
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface UpdateRoleBody {
  userId: string;
  role: string;
  notes?: string;
}

/**
 * POST /api/users/update-role
 * Update user role
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
        { error: 'FORBIDDEN', message: 'Only admin can update user roles' },
        { status: 403 }
      );
    }

    const body = await request.json() as UpdateRoleBody;
    const { userId, role, notes } = body;

    if (!userId || !role) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'userId and role are required' },
        { status: 400 }
      );
    }

    // Validate role
    const validRoles = ['CUSTOMER', 'AGENT', 'OPS', 'ADMIN'];
    if (!validRoles.includes(role)) {
      return NextResponse.json(
        { error: 'INVALID_ROLE', message: 'Invalid role' },
        { status: 400 }
      );
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return NextResponse.json(
        { error: 'USER_NOT_FOUND', message: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from changing their own role
    if (userId === authResult.user.userId) {
      return NextResponse.json(
        { error: 'CANNOT_CHANGE_OWN_ROLE', message: 'Cannot change your own role' },
        { status: 400 }
      );
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role },
    });

    // Log the role change
    console.log(`User ${user.name} (${user.phone}) role changed from ${user.role} to ${role} by ${authResult.user.name} (${authResult.user.phone})`);

    return NextResponse.json({
      success: true,
      message: `User role updated to ${role}`,
      user: {
        id: updatedUser.id,
        name: updatedUser.name,
        phone: updatedUser.phone,
        role: updatedUser.role,
        updatedAt: updatedUser.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating user role:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update user role' },
      { status: 500 }
    );
  }
}