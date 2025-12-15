/**
 * Ticket API Routes
 * Requirements: 2.1, 2.2, 2.3, 7.1, 7.2
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { canAccessTicket, buildTicketWhereClause } from '@/core/auth/rbac';
import { createDraft } from '@/core/tickets/ticket.service';
import { paymentService } from '@/core/payment/payment.service';
import { 
  isValidWhatsAppNumber, 
  validateDescription, 
} from '@/core/validation/validators';

// Type alias (SQLite uses strings instead of enums)
type IssueType = string;

interface CreateTicketBody {
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: string;
  device: string;
  waVersion: string;
  description: string;
}

/**
 * POST /api/tickets
 * Creates a new ticket draft and payment order
 * Requirements: 2.1, 2.2, 2.3
 */
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const body = await request.json() as CreateTicketBody;

    // Validate required fields (Property 7)
    const requiredFields = [
      'whatsAppNumber',
      'countryRegion',
      'issueType',
      'incidentAt',
      'device',
      'waVersion',
      'description',
    ];
    
    const missingFields = requiredFields.filter(
      field => !body[field as keyof CreateTicketBody]
    );
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: 'MISSING_REQUIRED_FIELD', fields: missingFields },
        { status: 400 }
      );
    }

    // Validate WhatsApp number (Property 5)
    if (!isValidWhatsAppNumber(body.whatsAppNumber)) {
      return NextResponse.json(
        { error: 'INVALID_WA_NUMBER', message: 'Invalid WhatsApp number format' },
        { status: 400 }
      );
    }

    // Validate description for sensitive keywords (Property 6)
    const descriptionValidation = validateDescription(body.description);
    if (!descriptionValidation.valid) {
      return NextResponse.json(
        { 
          error: 'SENSITIVE_CONTENT', 
          message: descriptionValidation.errors[0]?.message || 'Description contains blocked keywords',
        },
        { status: 400 }
      );
    }

    // Create ticket draft (Property 2: Initial State)
    const ticket = await createDraft({
      customerId: authResult.user.id,
      whatsAppNumber: body.whatsAppNumber,
      countryRegion: body.countryRegion,
      issueType: body.issueType,
      incidentAt: new Date(body.incidentAt),
      device: body.device,
      waVersion: body.waVersion,
      description: body.description,
    });

    // Create payment order (Property 4: Ticket-Payment Association)
    const { payment, paymentOrder } = await paymentService.createOrder({
      ticketId: ticket.id,
      amount: 50000, // Fixed amount in IDR
      customerEmail: authResult.user.email,
      customerName: authResult.user.name,
      description: `Payment for ticket ${ticket.ticketNo}`,
    });

    return NextResponse.json({
      ticket: {
        id: ticket.id,
        ticketNo: ticket.ticketNo,
        status: ticket.status,
        paymentStatus: ticket.paymentStatus,
        createdAt: ticket.createdAt,
      },
      payment: {
        orderId: paymentOrder.orderId,
        paymentUrl: paymentOrder.paymentUrl,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        expiresAt: paymentOrder.expiresAt,
      },
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating ticket:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create ticket' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/tickets
 * Lists tickets for the current user
 * Requirements: 7.1, 7.2
 * Property 17: RBAC Access Control
 * Property 18: Ticket List Response Fields
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const user = authResult.user;

    // Build where clause based on role (Property 17)
    const whereClause = buildTicketWhereClause(user);

    // Get tickets with required fields (Property 18)
    const tickets = await prisma.ticket.findMany({
      where: whereClause,
      select: {
        id: true,
        ticketNo: true,
        status: true,
        paymentStatus: true,
        createdAt: true,
        issueType: true,
        whatsAppNumber: true,
        countryRegion: true,
        assignedAgentId: true,
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ tickets });

  } catch (error) {
    console.error('Error listing tickets:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to list tickets' },
      { status: 500 }
    );
  }
}
