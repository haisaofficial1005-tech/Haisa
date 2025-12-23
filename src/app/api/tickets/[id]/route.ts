/**
 * Ticket Detail API Routes
 * Requirements: 7.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { canAccessTicket } from '@/core/auth/rbac';
import { getById } from '@/core/tickets/ticket.service';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export const dynamic = 'force-dynamic';

/**
 * GET /api/tickets/[id]
 * Gets ticket details with attachments
 * Requirements: 7.3
 * Property 17: RBAC Access Control
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const { id } = await params;
    const user = authResult.user;

    // Get ticket with RBAC check
    const ticket = await getById(id, user.id, user.role as 'CUSTOMER' | 'AGENT' | 'ADMIN');

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Access denied')) {
      return forbiddenResponse('You do not have access to this ticket');
    }

    console.error('Error getting ticket:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get ticket' },
      { status: 500 }
    );
  }
}
