/**
 * Payment Creation API Route
 * Requirements: 4.1
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { canAccessTicket } from '@/core/auth/rbac';
import { paymentService } from '@/core/payment/payment.service';

interface CreatePaymentBody {
  ticketId: string;
}

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create
 * Creates a payment order for a ticket
 * Requirements: 4.1
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    const body = await request.json() as CreatePaymentBody;
    const user = authResult.user;

    if (!body.ticketId) {
      return NextResponse.json(
        { error: 'MISSING_TICKET_ID', message: 'ticketId is required' },
        { status: 400 }
      );
    }

    // Get ticket
    const ticket = await prisma.ticket.findUnique({
      where: { id: body.ticketId },
      include: { customer: true },
    });

    if (!ticket) {
      return NextResponse.json(
        { error: 'TICKET_NOT_FOUND', message: 'Ticket not found' },
        { status: 404 }
      );
    }

    // Check access (only ticket owner can create payment)
    if (ticket.customerId !== user.id && user.role !== 'ADMIN') {
      return forbiddenResponse('You can only create payments for your own tickets');
    }

    // Check if ticket is in DRAFT status
    if (ticket.status !== 'DRAFT') {
      return NextResponse.json(
        { error: 'INVALID_TICKET_STATUS', message: 'Payment can only be created for DRAFT tickets' },
        { status: 400 }
      );
    }

    // Check if payment already exists and is not expired
    if (ticket.paymentStatus === 'PAID') {
      return NextResponse.json(
        { error: 'ALREADY_PAID', message: 'Ticket has already been paid' },
        { status: 400 }
      );
    }

    // Create payment order
    const { payment, paymentOrder } = await paymentService.createOrder({
      ticketId: ticket.id,
      amount: 50000, // Fixed amount in IDR
      customerEmail: ticket.customer.email,
      customerName: ticket.customer.name,
      description: `Payment for ticket ${ticket.ticketNo}`,
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
      paymentUrl: paymentOrder.paymentUrl,
      expiresAt: paymentOrder.expiresAt,
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create payment' },
      { status: 500 }
    );
  }
}
