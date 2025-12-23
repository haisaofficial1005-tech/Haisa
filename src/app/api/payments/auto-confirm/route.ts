/**
 * Auto Confirm Payment API
 * Endpoint untuk konfirmasi pembayaran otomatis (development/testing)
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface AutoConfirmBody {
  orderId?: string;
  confirmAll?: boolean;
}

/**
 * POST /api/payments/auto-confirm
 * Auto-confirm QRIS payments (for development/testing)
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin can auto-confirm payments' },
        { status: 403 }
      );
    }

    const body = await request.json() as AutoConfirmBody;
    const { orderId, confirmAll } = body;

    let paymentsToConfirm;

    if (orderId) {
      // Confirm specific payment
      paymentsToConfirm = await prisma.payment.findMany({
        where: {
          orderId,
          status: 'PENDING',
          provider: 'QRIS',
        },
        include: {
          ticket: {
            include: {
              customer: true,
            },
          },
        },
      });
    } else if (confirmAll) {
      // Confirm all pending QRIS payments
      paymentsToConfirm = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          provider: 'QRIS',
        },
        include: {
          ticket: {
            include: {
              customer: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'Either orderId or confirmAll must be provided' },
        { status: 400 }
      );
    }

    if (paymentsToConfirm.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No pending QRIS payments found to confirm',
        confirmedCount: 0,
      });
    }

    const confirmedPayments = [];

    for (const payment of paymentsToConfirm) {
      try {
        // Update payment and ticket status
        const [updatedPayment, updatedTicket] = await prisma.$transaction([
          prisma.payment.update({
            where: { id: payment.id },
            data: {
              status: 'PAID',
              rawPayload: JSON.stringify({
                ...JSON.parse(payment.rawPayload || '{}'),
                confirmedAt: new Date().toISOString(),
                confirmedBy: authResult.user.id,
                autoConfirmed: true,
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

        confirmedPayments.push({
          orderId: updatedPayment.orderId,
          ticketNo: payment.ticket.ticketNo,
          amount: updatedPayment.amount,
          paymentStatus: updatedPayment.status,
          ticketStatus: updatedTicket.status,
        });

        console.log(`Auto-confirmed payment: ${updatedPayment.orderId} for ticket ${payment.ticket.ticketNo}`);

      } catch (error) {
        console.error(`Failed to confirm payment ${payment.orderId}:`, error);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Successfully confirmed ${confirmedPayments.length} payments`,
      confirmedCount: confirmedPayments.length,
      confirmedPayments,
    });

  } catch (error) {
    console.error('Error auto-confirming payments:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to auto-confirm payments' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/auto-confirm
 * Get pending QRIS payments that can be auto-confirmed
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication (admin only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin can view pending payments' },
        { status: 403 }
      );
    }

    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        provider: 'QRIS',
      },
      include: {
        ticket: {
          select: {
            ticketNo: true,
            status: true,
            paymentStatus: true,
            customer: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const formattedPayments = pendingPayments.map(payment => {
      let uniqueCode = '';
      try {
        const payload = JSON.parse(payment.rawPayload || '{}');
        uniqueCode = payload.uniqueCode || '';
      } catch {
        // ignore
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        uniqueCode,
        status: payment.status,
        createdAt: payment.createdAt,
        ticket: {
          ticketNo: payment.ticket.ticketNo,
          status: payment.ticket.status,
          paymentStatus: payment.ticket.paymentStatus,
          customer: payment.ticket.customer,
        },
      };
    });

    return NextResponse.json({
      success: true,
      pendingCount: formattedPayments.length,
      pendingPayments: formattedPayments,
    });

  } catch (error) {
    console.error('Error getting pending payments:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get pending payments' },
      { status: 500 }
    );
  }
}