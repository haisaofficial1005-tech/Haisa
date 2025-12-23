/**
 * Payment Creation API Route - QRIS Implementation
 * Creates QRIS payment for tickets
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse, forbiddenResponse } from '@/core/auth/middleware';
import { generateQrisUniqueCode, calculateQrisAmount, getGmailSaleBasePrice } from '@/core/payment/qris';

interface CreatePaymentBody {
  ticketId: string;
}

export const dynamic = 'force-dynamic';

/**
 * POST /api/payments/create
 * Creates a QRIS payment for a ticket
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

    // Check if there's already a pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        ticketId: ticket.id,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Parse rawPayload to get QRIS data
      let qrisData = { uniqueCode: '', baseAmount: 50000 };
      try {
        qrisData = JSON.parse(existingPayment.rawPayload || '{}');
      } catch (error) {
        console.error('Error parsing existing payment rawPayload:', error);
      }

      return NextResponse.json({
        payment: {
          id: existingPayment.id,
          orderId: existingPayment.orderId,
          amount: existingPayment.amount,
          currency: existingPayment.currency,
          status: existingPayment.status,
        },
        paymentMethod: 'QRIS',
        qrisAmount: existingPayment.amount,
        qrisUniqueCode: qrisData.uniqueCode,
        baseAmount: qrisData.baseAmount,
        message: 'Payment already exists',
      });
    }

    // Generate QRIS payment data
    const baseAmount = getGmailSaleBasePrice(); // 50,000 IDR
    const uniqueCode = generateQrisUniqueCode();
    const totalAmount = calculateQrisAmount(baseAmount, uniqueCode);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        ticketId: ticket.id,
        provider: 'QRIS',
        orderId: `QRIS-${ticket.ticketNo}-${Date.now()}`,
        amount: totalAmount,
        currency: 'IDR',
        status: 'PENDING',
        rawPayload: JSON.stringify({
          baseAmount,
          uniqueCode,
          totalAmount,
          paymentMethod: 'QRIS',
        }),
      },
    });

    return NextResponse.json({
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      },
      paymentMethod: 'QRIS',
      qrisAmount: totalAmount,
      qrisUniqueCode: uniqueCode,
      baseAmount,
      message: 'QRIS payment created successfully',
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating QRIS payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to create QRIS payment' },
      { status: 500 }
    );
  }
}
