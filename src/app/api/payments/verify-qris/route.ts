/**
 * QRIS Payment Verification API
 * Endpoint untuk verifikasi pembayaran QRIS berdasarkan kode unik
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface VerifyQrisBody {
  amount: number;
  uniqueCode: string;
  orderId?: string;
}

/**
 * POST /api/payments/verify-qris
 * Verifikasi pembayaran QRIS berdasarkan nominal dan kode unik
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
        { error: 'FORBIDDEN', message: 'Only admin can verify QRIS payments' },
        { status: 403 }
      );
    }

    const body = await request.json() as VerifyQrisBody;
    const { amount, uniqueCode, orderId } = body;

    if (!amount || !uniqueCode) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'amount and uniqueCode are required' },
        { status: 400 }
      );
    }

    // Find payments that match the criteria
    let payments;
    
    if (orderId) {
      // Search by specific order ID
      payments = await prisma.payment.findMany({
        where: {
          orderId,
          status: 'PENDING',
        },
        include: {
          ticket: {
            include: {
              customer: true,
            },
          },
        },
      });
    } else {
      // Search by amount (which should include the unique code)
      payments = await prisma.payment.findMany({
        where: {
          amount,
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
    }

    if (payments.length === 0) {
      return NextResponse.json(
        { error: 'PAYMENT_NOT_FOUND', message: 'No matching pending QRIS payment found' },
        { status: 404 }
      );
    }

    // Filter by unique code from rawPayload
    const matchingPayments = payments.filter(payment => {
      try {
        const payload = JSON.parse(payment.rawPayload || '{}');
        return payload.uniqueCode === uniqueCode;
      } catch {
        return false;
      }
    });

    if (matchingPayments.length === 0) {
      return NextResponse.json(
        { error: 'UNIQUE_CODE_MISMATCH', message: 'Unique code does not match any payment' },
        { status: 404 }
      );
    }

    if (matchingPayments.length > 1) {
      return NextResponse.json(
        { error: 'MULTIPLE_MATCHES', message: 'Multiple payments found with same criteria' },
        { status: 400 }
      );
    }

    const payment = matchingPayments[0];

    return NextResponse.json({
      success: true,
      payment: {
        id: payment.id,
        orderId: payment.orderId,
        amount: payment.amount,
        uniqueCode,
        status: payment.status,
        createdAt: payment.createdAt,
      },
      ticket: {
        id: payment.ticket.id,
        ticketNo: payment.ticket.ticketNo,
        status: payment.ticket.status,
        paymentStatus: payment.ticket.paymentStatus,
      },
      customer: {
        name: payment.ticket.customer.name,
        email: payment.ticket.customer.email,
      },
      message: 'Payment found and ready for confirmation',
    });

  } catch (error) {
    console.error('Error verifying QRIS payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to verify QRIS payment' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/payments/verify-qris?amount=50123&uniqueCode=123
 * Alternative GET method for verification
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const uniqueCode = searchParams.get('uniqueCode');
    const orderId = searchParams.get('orderId');

    if (!amount || !uniqueCode) {
      return NextResponse.json(
        { error: 'MISSING_PARAMS', message: 'amount and uniqueCode parameters are required' },
        { status: 400 }
      );
    }

    // Create a mock request body and call POST method
    const mockRequest = {
      json: async () => ({
        amount: parseInt(amount, 10),
        uniqueCode,
        orderId: orderId || undefined,
      }),
    } as NextRequest;

    return await POST(mockRequest);

  } catch (error) {
    console.error('Error in GET verify QRIS:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to verify QRIS payment' },
      { status: 500 }
    );
  }
}