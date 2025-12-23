/**
 * Pending Payments List API
 * Endpoint untuk mendapatkan daftar pembayaran yang menunggu konfirmasi
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

/**
 * GET /api/payments/pending-list
 * Get list of pending QRIS payments for manual verification
 */
export async function GET(request: NextRequest) {
  try {
    // Validate authentication (admin/ops only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS' && authResult.user.role !== 'AGENT') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops can view pending payments' },
        { status: 403 }
      );
    }

    // Get pending QRIS payments
    const pendingPayments = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        provider: 'QRIS',
      },
      include: {
        ticket: {
          select: {
            id: true,
            ticketNo: true,
            status: true,
            paymentStatus: true,
            whatsAppNumber: true,
            issueType: true,
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

    // Format pending payments
    const formattedPending = pendingPayments.map(payment => {
      let uniqueCode = '';
      let baseAmount = 50000;
      try {
        const payload = JSON.parse(payment.rawPayload || '{}');
        uniqueCode = payload.uniqueCode || '';
        baseAmount = payload.baseAmount || 50000;
      } catch {
        // ignore
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        uniqueCode,
        baseAmount,
        status: payment.status,
        provider: payment.provider,
        createdAt: payment.createdAt,
        ticket: payment.ticket,
      };
    });

    // Get recently confirmed payments (today)
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const recentConfirmed = await prisma.payment.findMany({
      where: {
        status: 'PAID',
        provider: 'QRIS',
        updatedAt: {
          gte: today,
        },
      },
      include: {
        ticket: {
          select: {
            ticketNo: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    const formattedConfirmed = recentConfirmed.map(payment => {
      let confirmedAt = payment.updatedAt.toISOString();
      try {
        const payload = JSON.parse(payment.rawPayload || '{}');
        confirmedAt = payload.confirmedAt || payment.updatedAt.toISOString();
      } catch {
        // ignore
      }

      return {
        id: payment.id,
        orderId: payment.orderId,
        ticketNo: payment.ticket.ticketNo,
        amount: payment.amount,
        confirmedAt,
      };
    });

    return NextResponse.json({
      success: true,
      pendingCount: formattedPending.length,
      pendingPayments: formattedPending,
      recentConfirmed: formattedConfirmed,
    });

  } catch (error) {
    console.error('Error getting pending payments:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to get pending payments' },
      { status: 500 }
    );
  }
}