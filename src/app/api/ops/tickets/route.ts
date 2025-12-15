/**
 * Operations Ticket List API Route
 * Requirements: 8.1, 9.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { buildTicketWhereClause } from '@/core/auth/rbac';

// Type aliases (SQLite uses strings instead of enums)
type TicketStatus = string;
type PaymentStatus = string;

interface TicketFilters {
  status?: TicketStatus;
  paymentStatus?: PaymentStatus;
  assignedAgentId?: string;
  search?: string;
}

/**
 * GET /api/ops/tickets
 * Lists tickets for agents/admins based on role
 * Requirements: 8.1, 9.1
 * Property 17: RBAC Access Control
 */
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const user = authResult.user;

    // Only AGENT and ADMIN can access ops endpoints
    if (user.role === 'CUSTOMER') {
      return forbiddenResponse('Access denied. Ops endpoints are for agents and admins only.');
    }

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const filters: TicketFilters = {
      status: searchParams.get('status') as TicketStatus | undefined,
      paymentStatus: searchParams.get('paymentStatus') as PaymentStatus | undefined,
      assignedAgentId: searchParams.get('assignedAgentId') || undefined,
      search: searchParams.get('search') || undefined,
    };

    // Build base where clause based on role (Property 17)
    const baseWhereClause = buildTicketWhereClause(user);

    // Build additional filters
    const additionalFilters: Record<string, unknown> = {};
    
    if (filters.status) {
      additionalFilters.status = filters.status;
    }
    
    if (filters.paymentStatus) {
      additionalFilters.paymentStatus = filters.paymentStatus;
    }
    
    if (filters.assignedAgentId) {
      additionalFilters.assignedAgentId = filters.assignedAgentId;
    }

    // Search by ticketNo or customer name/email
    if (filters.search) {
      additionalFilters.OR = [
        { ticketNo: { contains: filters.search, mode: 'insensitive' } },
        { customer: { name: { contains: filters.search, mode: 'insensitive' } } },
        { customer: { email: { contains: filters.search, mode: 'insensitive' } } },
      ];
    }

    // Combine where clauses
    const whereClause = {
      ...baseWhereClause,
      ...additionalFilters,
      // Exclude DRAFT tickets from ops view (they haven't paid yet)
      status: filters.status || { not: 'DRAFT' },
    };

    // Get tickets with pagination
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      prisma.ticket.findMany({
        where: whereClause,
        select: {
          id: true,
          ticketNo: true,
          status: true,
          paymentStatus: true,
          issueType: true,
          whatsAppNumber: true,
          countryRegion: true,
          createdAt: true,
          updatedAt: true,
          googleDriveFolderUrl: true,
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          assignedAgent: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          _count: {
            select: {
              attachments: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.ticket.count({ where: whereClause }),
    ]);

    return NextResponse.json({
      tickets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });

  } catch (error) {
    console.error('Error listing ops tickets:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to list tickets' },
      { status: 500 }
    );
  }
}
