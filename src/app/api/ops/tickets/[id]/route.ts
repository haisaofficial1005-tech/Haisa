/**
 * Operations Ticket Detail/Update API Route
 * Requirements: 8.2, 8.3, 8.4, 9.2, 9.3
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { canAccessTicket, canUpdateTicketStatus, canAssignAgent } from '@/core/auth/rbac';
import { updateStatus, assignAgent, addInternalNotes, isValidStatusTransition } from '@/core/tickets/ticket.service';
import { auditService } from '@/core/audit/audit.service';
import { appsScriptClient } from '@/core/google/appsScript.client';

// Type alias (SQLite uses strings instead of enums)
type TicketStatus = string;

interface RouteParams {
  params: Promise<{ id: string }>;
}

interface UpdateTicketBody {
  status?: TicketStatus;
  assignedAgentId?: string | null;
  notesInternal?: string;
}

/**
 * GET /api/ops/tickets/[id]
 * Gets ticket details for ops view
 * Requirements: 8.4
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateSession();
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const user = authResult.user;
    const { id } = await params;

    // Only AGENT and ADMIN can access ops endpoints
    if (user.role === 'CUSTOMER') {
      return forbiddenResponse('Access denied');
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            mimeType: true,
            size: true,
            driveFileId: true,
            driveFileUrl: true,
            createdAt: true,
          },
        },
        payments: {
          select: {
            id: true,
            orderId: true,
            amount: true,
            currency: true,
            status: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        auditLogs: {
          select: {
            id: true,
            action: true,
            before: true,
            after: true,
            createdAt: true,
            actor: {
              select: { id: true, name: true, email: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access based on role
    if (!canAccessTicket(user, ticket)) {
      return forbiddenResponse('You do not have access to this ticket');
    }

    return NextResponse.json({ ticket });

  } catch (error) {
    console.error('Error getting ops ticket:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get ticket' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/ops/tickets/[id]
 * Updates ticket status, assignment, or notes
 * Requirements: 8.2, 8.3, 9.2, 9.3
 */
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await validateSession();
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const user = authResult.user;
    const { id } = await params;

    // Only AGENT and ADMIN can update tickets
    if (user.role === 'CUSTOMER') {
      return forbiddenResponse('Access denied');
    }

    const body = await request.json() as UpdateTicketBody;

    // Get current ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: true,
        assignedAgent: true,
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access
    if (!canAccessTicket(user, ticket)) {
      return forbiddenResponse('You do not have access to this ticket');
    }

    let updatedTicket = ticket;
    const changes: string[] = [];

    // Handle status update
    if (body.status && body.status !== ticket.status) {
      // Check if user can update status
      if (!canUpdateTicketStatus(user, ticket)) {
        return forbiddenResponse('You cannot update the status of this ticket');
      }

      // Validate status transition
      if (!isValidStatusTransition(ticket.status, body.status)) {
        return NextResponse.json(
          { 
            error: 'INVALID_STATUS_TRANSITION', 
            message: `Cannot transition from ${ticket.status} to ${body.status}` 
          },
          { status: 400 }
        );
      }

      const previousStatus = ticket.status;
      updatedTicket = await updateStatus(id, body.status, user.id);
      
      // Log status change (Requirements: 11.2)
      await auditService.logStatusChange(user.id, id, previousStatus, body.status);
      changes.push(`status: ${previousStatus} → ${body.status}`);
    }

    // Handle agent assignment (admin only)
    if (body.assignedAgentId !== undefined && body.assignedAgentId !== ticket.assignedAgentId) {
      if (!canAssignAgent(user)) {
        return forbiddenResponse('Only admins can assign agents');
      }

      // Verify agent exists if assigning
      if (body.assignedAgentId) {
        const agent = await prisma.user.findUnique({
          where: { id: body.assignedAgentId },
        });
        
        if (!agent || (agent.role !== 'AGENT' && agent.role !== 'ADMIN')) {
          return NextResponse.json(
            { error: 'INVALID_AGENT', message: 'Invalid agent ID' },
            { status: 400 }
          );
        }
      }

      const previousAgentId = ticket.assignedAgentId;
      updatedTicket = await assignAgent(id, body.assignedAgentId, user.id);
      
      // Log assignment change (Requirements: 11.3)
      await auditService.logAssignmentChange(user.id, id, previousAgentId, body.assignedAgentId);
      changes.push(`assignedAgent: ${previousAgentId || 'none'} → ${body.assignedAgentId || 'none'}`);
    }

    // Handle internal notes update
    if (body.notesInternal !== undefined && body.notesInternal !== ticket.notesInternal) {
      const previousNotes = ticket.notesInternal;
      updatedTicket = await addInternalNotes(id, body.notesInternal, user.id);
      
      // Log note addition
      await auditService.logNoteAdded(user.id, id, previousNotes, body.notesInternal);
      changes.push('notesInternal updated');
    }

    // Sync to Google Sheets if there were changes
    if (changes.length > 0 && ticket.googleSheetRowIndex) {
      try {
        await appsScriptClient.ticketUpdated({
          ticketNo: ticket.ticketNo,
          rowIndex: ticket.googleSheetRowIndex,
          status: updatedTicket.status,
          assignedAgent: updatedTicket.assignedAgent?.name || null,
          notesInternal: updatedTicket.notesInternal || null,
          lastUpdatedAt: new Date().toISOString(),
        });
      } catch (syncError) {
        console.error('Google Sheets sync failed:', syncError);
        // Don't fail the request - sync can be retried
      }
    }

    // Fetch updated ticket with all relations
    const finalTicket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        customer: {
          select: { id: true, name: true, email: true },
        },
        assignedAgent: {
          select: { id: true, name: true, email: true },
        },
        attachments: true,
      },
    });

    return NextResponse.json({
      ticket: finalTicket,
      changes,
    });

  } catch (error) {
    if (error instanceof Error && error.message.includes('Invalid status transition')) {
      return NextResponse.json(
        { error: 'INVALID_STATUS_TRANSITION', message: error.message },
        { status: 400 }
      );
    }

    console.error('Error updating ops ticket:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to update ticket' },
      { status: 500 }
    );
  }
}
