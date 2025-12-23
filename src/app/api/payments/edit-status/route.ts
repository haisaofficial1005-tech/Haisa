/**
 * Edit Payment Status API
 * Endpoint untuk mengubah status pembayaran yang sudah dikonfirmasi
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';

export const dynamic = 'force-dynamic';

interface EditStatusBody {
  paymentId: string;
  orderId: string;
  newStatus: string;
  notes?: string;
}

/**
 * POST /api/payments/edit-status
 * Edit status of a confirmed payment
 */
export async function POST(request: NextRequest) {
  try {
    // Validate authentication (admin/ops only)
    const authResult = await validateSession(request);
    if (!authResult.authenticated || !authResult.user) {
      return unauthorizedResponse();
    }

    if (authResult.user.role !== 'ADMIN' && authResult.user.role !== 'OPS') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Only admin/ops can edit payment status' },
        { status: 403 }
      );
    }

    const body = await request.json() as EditStatusBody;
    const { paymentId, orderId, newStatus, notes } = body;

    if (!paymentId || !orderId || !newStatus) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'paymentId, orderId, and newStatus are required' },
        { status: 400 }
      );
    }

    // Validate new status
    const validStatuses = ['PENDING', 'PAID', 'REJECTED'];
    if (!validStatuses.includes(newStatus)) {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Invalid status. Must be PENDING, PAID, or REJECTED' },
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

    // Determine ticket status based on payment status
    let ticketStatus = payment.ticket.status;
    let ticketPaymentStatus = newStatus;

    if (newStatus === 'PAID') {
      ticketStatus = 'RECEIVED';
    } else if (newStatus === 'REJECTED') {
      ticketStatus = 'DRAFT';
    } else if (newStatus === 'PENDING') {
      ticketStatus = 'DRAFT';
    }

    // Update payment and ticket status
    const [updatedPayment, updatedTicket] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newStatus,
          rawPayload: JSON.stringify({
            ...existingPayload,
            statusEditedAt: new Date().toISOString(),
            statusEditedBy: authResult.user.userId,
            statusEditedByName: authResult.user.name,
            previousStatus: payment.status,
            newStatus: newStatus,
            editNotes: notes || '',
            statusHistory: [
              ...(existingPayload.statusHistory || []),
              {
                from: payment.status,
                to: newStatus,
                editedAt: new Date().toISOString(),
                editedBy: authResult.user.name,
                notes: notes || '',
              },
            ],
          }),
        },
      }),
      prisma.ticket.update({
        where: { id: payment.ticketId },
        data: {
          paymentStatus: ticketPaymentStatus,
          status: ticketStatus,
        },
      }),
    ]);

    // Log the status change
    console.log(`Payment ${orderId} status changed from ${payment.status} to ${newStatus} by ${authResult.user.name} (${authResult.user.phone}) for ticket ${payment.ticket.ticketNo}`);

    return NextResponse.json({
      success: true,
      message: `Payment status changed to ${newStatus} successfully`,
      payment: {
        id: updatedPayment.id,
        orderId: updatedPayment.orderId,
        amount: updatedPayment.amount,
        status: updatedPayment.status,
        previousStatus: payment.status,
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
    console.error('Error editing payment status:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to edit payment status' },
      { status: 500 }
    );
  }
}