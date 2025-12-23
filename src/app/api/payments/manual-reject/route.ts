/**
 * Manual Payment Rejection API
 * Endpoint untuk reject pembayaran QRIS secara manual
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface ManualRejectBody {
  paymentId: string;
  orderId: string;
  notes?: string;
}

/**
 * POST /api/payments/manual-reject
 * Manually reject a QRIS payment
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin/ops only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS' && authResult.user.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops can reject payments' },
        { status: 403 }
      );
    }

    const body = await request.json() as ManualRejectBody;
    const { paymentId, orderId, notes } = body;

    if (!paymentId || !orderId) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'paymentId and orderId are required' },
        { status: 400 }
      );
    }

    // Find payment
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: {
        ticket: {
          include: {
            customer: true,
          },
        },
      },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'PAYMENT_NOT_FOUND', message: 'Payment not found' },
        { status: 404 }
      );
    }

    if (payment.orderId !== orderId) {
      return NextResponse.json(
        { error: 'ORDER_ID_MISMATCH', message: 'Order ID does not match' },
        { status: 400 }
      );
    }

    // Parse existing rawPayload
    let existingPayload = {};
    try {
      existingPayload = JSON.parse(payment.rawPayload || '{}');
    } catch {
      // ignore
    }

    // Update payment status to REJECTED
    const [updatedPayment, updatedTicket] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          rawPayload: JSON.stringify({
            ...existingPayload,
            rejectedAt: new Date().toISOString(),
            rejectedBy: authResult.user.userId,
            rejectedByName: authResult.user.name,
            manualRejection: true,
            adminNotes: notes || '',
          }),
        },
      }),
      prisma.ticket.update({
        where: { id: payment.ticketId },
        data: {
          paymentStatus: 'REJECTED',
          status: 'DRAFT', // Keep as draft since payment was rejected
        },
      }),
    ]);

    // Log the rejection
    console.log(`Payment ${orderId} manually rejected by ${authResult.user.name} (${authResult.user.phone}) for ticket ${payment.ticket.ticketNo}`);

    return NextResponse.json({
      success: true,
      message: 'Payment rejected successfully',
      payment: {
        id: updatedPayment.id,
        orderId: updatedPayment.orderId,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
      },
      ticket: {
        id: updatedTicket.id,
        ticketNo: updatedTicket.ticketNo,
        status: updatedTicket.status,
        paymentStatus: updatedTicket.paymentStatus,
      },
      ticketStatus: updatedTicket.status,
      paymentStatus: updatedPayment.status,
    });

  } catch (error) {
    console.error('Error rejecting payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to reject payment' },
      { status: 500 }
    );
  }
}