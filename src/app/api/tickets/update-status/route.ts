/**
 * Update Ticket Status API
 * Endpoint untuk mengubah status ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface UpdateStatusBody {
  ticketId: string;
  status: string;
  notes?: string;
}

/**
 * POST /api/tickets/update-status
 * Update ticket status
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin/ops/agent only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (!['ADMIN', 'OPS', 'AGENT'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops/agent can update ticket status' },
        { status: 403 }
      );
    }

    const body = await request.json() as UpdateStatusBody;
    const { ticketId, status, notes } = body;

    if (!ticketId || !status) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'ticketId and status are required' },
        { status: 400 }
      );
    }

    // Validate status
    const validStatuses = ['DRAFT', 'RECEIVED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Invalid status' },
        { status: 400 }
      );
    }

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        customer: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Update ticket status
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status,
        ...(status === 'CLOSED' && { closedAt: new Date() }),
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: authResult.user.userId,
        ticketId: ticket.id,
        action: 'STATUS_UPDATE',
        before: JSON.stringify({ status: ticket.status }),
        after: JSON.stringify({ status, notes: notes || '' }),
      },
    });

    // Log the status change
    console.log(`Ticket ${ticket.ticketNo} status changed from ${ticket.status} to ${status} by ${authResult.user.name} (${authResult.user.phone})`);

    return NextResponse.json({
      success: true,
      message: `Ticket status updated to ${status}`,
      ticket: {
        id: updatedTicket.id,
        ticketNo: updatedTicket.ticketNo,
        status: updatedTicket.status,
        updatedAt: updatedTicket.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error updating ticket status:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update ticket status' },
      { status: 500 }
    );
  }
}