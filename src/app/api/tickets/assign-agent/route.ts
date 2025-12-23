/**
 * Assign Agent to Ticket API
 * Endpoint untuk assign agent ke ticket
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface AssignAgentBody {
  ticketId: string;
  agentId: string;
  notes?: string;
}

/**
 * POST /api/tickets/assign-agent
 * Assign agent to ticket
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin/ops only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (!['ADMIN', 'OPS'].includes(authResult.user.role)) {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops can assign agents' },
        { status: 403 }
      );
    }

    const body = await request.json() as AssignAgentBody;
    const { ticketId, agentId, notes } = body;

    if (!ticketId || !agentId) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'ticketId and agentId are required' },
        { status: 400 }
      );
    }

    // Find ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
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

    // Find agent
    const agent = await prisma.user.findUnique({
      where: { id: agentId },
    });

    if (!agent) {
      return NextResponse.json(
        { error: 'AGENT_NOT_FOUND', message: 'Agent not found' },
        { status: 404 }
      );
    }

    if (!['AGENT', 'OPS', 'ADMIN'].includes(agent.role)) {
      return NextResponse.json(
        { error: 'INVALID_AGENT', message: 'User is not an agent' },
        { status: 400 }
      );
    }

    // Update ticket with assigned agent
    const updatedTicket = await prisma.ticket.update({
      where: { id: ticketId },
      data: {
        assignedAgentId: agentId,
      },
      include: {
        assignedAgent: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create audit log
    await prisma.auditLog.create({
      data: {
        actorId: authResult.user.userId,
        ticketId: ticket.id,
        action: 'AGENT_ASSIGNED',
        before: JSON.stringify({ 
          assignedAgentId: ticket.assignedAgentId,
          assignedAgentName: ticket.assignedAgent?.name || null,
        }),
        after: JSON.stringify({ 
          assignedAgentId: agentId,
          assignedAgentName: agent.name,
          notes: notes || '',
        }),
      },
    });

    // Log the assignment
    console.log(`Agent ${agent.name} (${agent.phone}) assigned to ticket ${ticket.ticketNo} by ${authResult.user.name} (${authResult.user.phone})`);

    return NextResponse.json({
      success: true,
      message: `Agent ${agent.name} assigned to ticket`,
      ticket: {
        id: updatedTicket.id,
        ticketNo: updatedTicket.ticketNo,
        assignedAgent: updatedTicket.assignedAgent,
        updatedAt: updatedTicket.updatedAt,
      },
    });

  } catch (error) {
    console.error('Error assigning agent:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to assign agent' },
      { status: 500 }
    );
  }
}