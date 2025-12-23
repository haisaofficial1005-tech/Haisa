/**
 * Manual Payment Confirmation API
 * Enhanced security with rate limiting and validation
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { withAuth, withRateLimit } from '@/core/auth/middleware';
import { validatePaymentAmount } from '@/core/security/validation';
import { logPaymentFraud } from '@/core/security/logger';
import { type JWTPayload } from '@/core/security/jwt';

export const dynamic = 'force-dynamic';

interface ManualConfirmBody {
  paymentId: string;
  orderId: string;
  notes?: string;
}

/**
 * POST /api/payments/manual-confirm
 * Manually confirm a QRIS payment
 */
export const POST = withRateLimit(
  withAuth(async (request: NextRequest, user: JWTPayload) => {
    try {
      if (!['ADMIN', 'OPS', 'AGENT'].includes(user.role)) {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Only admin/ops can confirm payments' },
          { status: 403 }
        );
      }

      const body = await request.json() as ManualConfirmBody;
      const { paymentId, orderId, notes } = body;

      if (!paymentId || !orderId) {
        return NextResponse.json(
          { error: 'MISSING_FIELDS', message: 'paymentId and orderId are required' },
          { status: 400 }
        );
      }

      // Find payment with additional security checks
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
        // Log potential fraud attempt
        logPaymentFraud({
          reason: 'Order ID mismatch',
          providedOrderId: orderId,
          actualOrderId: payment.orderId,
          paymentId,
        }, user.userId, request);
        
        return NextResponse.json(
          { error: 'ORDER_ID_MISMATCH', message: 'Order ID does not match' },
          { status: 400 }
        );
      }

      if (payment.status !== 'PENDING') {
        return NextResponse.json(
          { error: 'INVALID_STATUS', message: `Payment is already ${payment.status}` },
          { status: 400 }
        );
      }

      // Validate payment amount
      try {
        validatePaymentAmount(payment.amount);
      } catch (error) {
        logPaymentFraud({
          reason: 'Invalid payment amount',
          amount: payment.amount,
          paymentId,
        }, user.userId, request);
        
        return NextResponse.json(
          { error: 'INVALID_AMOUNT', message: error.message },
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

      // Update payment and ticket status in transaction
      const [updatedPayment, updatedTicket] = await prisma.$transaction([
        prisma.payment.update({
          where: { id: payment.id },
          data: {
            status: 'PAID',
            rawPayload: JSON.stringify({
              ...existingPayload,
              confirmedAt: new Date().toISOString(),
              confirmedBy: user.userId,
              confirmedByName: user.name,
              manualConfirmation: true,
              adminNotes: notes || '',
            }),
          },
        }),
        prisma.ticket.update({
          where: { id: payment.ticketId },
          data: {
            paymentStatus: 'PAID',
            status: 'RECEIVED',
          },
        }),
      ]);

      // Log the confirmation
      console.log(`Payment ${orderId} manually confirmed by ${user.name} (${user.phone}) for ticket ${payment.ticket.ticketNo}`);

      return NextResponse.json({
        success: true,
        message: 'Payment confirmed successfully',
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
      });

    } catch (error) {
      console.error('Error confirming payment:', error);
      return NextResponse.json(
        { error: 'INTERNAL_ERROR', message: 'Failed to confirm payment' },
        { status: 500 }
      );
    }
  }, ['ADMIN', 'OPS', 'AGENT']),
  'PAYMENT'
);