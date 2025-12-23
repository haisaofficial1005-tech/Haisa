/**
 * QRIS Payment Confirmation API
 * Endpoint untuk konfirmasi pembayaran QRIS setelah verifikasi
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { validateSession, unauthorizedResponse } from '@/core/auth/middleware';
import { googleSyncService } from '@/core/google/sheets.sync';
import { attachmentService } from '@/core/attachments/attachment.service';
import { getWhatsAppService } from '@/core/whatsapp/whatsapp.service';

export const dynamic = 'force-dynamic';

interface ConfirmQrisBody {
  paymentId: string;
  orderId: string;
  confirmedAmount: number;
  uniqueCode: string;
  notes?: string;
}

/**
 * POST /api/payments/confirm-qris
 * Konfirmasi pembayaran QRIS dan update status
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
        { error: 'FORBIDDEN', message: 'Only admin can confirm QRIS payments' },
        { status: 403 }
      );
    }

    const body = await request.json() as ConfirmQrisBody;
    const { paymentId, orderId, confirmedAmount, uniqueCode, notes } = body;

    if (!paymentId || !orderId || !confirmedAmount || !uniqueCode) {
      return NextResponse.json(
        { error: 'MISSING_FIELDS', message: 'paymentId, orderId, confirmedAmount, and uniqueCode are required' },
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
            assignedAgent: true,
            attachments: true,
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

    if (payment.status !== 'PENDING') {
      return NextResponse.json(
        { error: 'INVALID_STATUS', message: 'Payment is not in pending status' },
        { status: 400 }
      );
    }

    // Verify amount and unique code
    if (payment.amount !== confirmedAmount) {
      return NextResponse.json(
        { error: 'AMOUNT_MISMATCH', message: 'Confirmed amount does not match payment amount' },
        { status: 400 }
      );
    }

    // Verify unique code from rawPayload
    try {
      const payload = JSON.parse(payment.rawPayload || '{}');
      if (payload.uniqueCode !== uniqueCode) {
        return NextResponse.json(
          { error: 'UNIQUE_CODE_MISMATCH', message: 'Unique code does not match' },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'Cannot verify unique code from payment data' },
        { status: 400 }
      );
    }

    // Update payment and ticket status in transaction
    const [updatedPayment, updatedTicket] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'PAID',
          rawPayload: JSON.stringify({
            ...JSON.parse(payment.rawPayload || '{}'),
            confirmedAt: new Date().toISOString(),
            confirmedBy: authResult.user.id,
            confirmedAmount,
            adminNotes: notes,
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

    // Trigger post-payment processes
    const fullTicket = payment.ticket;
    let attachmentUrls: string[] = [];

    // Sync to Google to create the Drive folder
    try {
      const syncResult = await googleSyncService.syncNewTicket(fullTicket);
      console.log('Google sync completed (folder created):', syncResult);

      // Upload attachments to the created Drive folder
      const ticketWithFolder = await prisma.ticket.findUnique({
        where: { id: payment.ticketId },
        include: { attachments: true },
      });

      if (ticketWithFolder && ticketWithFolder.googleDriveFolderId) {
        try {
          attachmentUrls = await attachmentService.uploadPendingToDrive(ticketWithFolder);
          console.log('Attachments uploaded to Drive:', attachmentUrls);

          // Update the Sheet row with attachment URLs if we have any
          if (attachmentUrls.length > 0) {
            const updatedTicketForSync = await prisma.ticket.findUnique({
              where: { id: payment.ticketId },
              include: { customer: true, assignedAgent: true },
            });
            if (updatedTicketForSync) {
              await googleSyncService.syncTicketUpdate({
                ...updatedTicketForSync,
                customer: updatedTicketForSync.customer,
                assignedAgent: updatedTicketForSync.assignedAgent,
              }, attachmentUrls);
            }
          }
        } catch (uploadError) {
          console.error('Failed to upload attachments to Drive:', uploadError);
        }
      }
    } catch (syncError) {
      console.error('Google sync failed:', syncError);
    }

    // Send WhatsApp notification
    try {
      const waService = getWhatsAppService();
      await waService.sendTicketNotification({
        ticketNo: fullTicket.ticketNo,
        customerName: fullTicket.customer.name || 'Customer',
        issueType: fullTicket.issueType,
        ticketId: fullTicket.id,
      });
      console.log('WhatsApp notification sent');
    } catch (waError) {
      console.error('WhatsApp notification failed:', waError);
    }

    return NextResponse.json({
      success: true,
      message: 'QRIS payment confirmed successfully',
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
      attachmentUrls,
    });

  } catch (error) {
    console.error('Error confirming QRIS payment:', error);
    return NextResponse.json(
      { error: 'INTERNAL_ERROR', message: 'Failed to confirm QRIS payment' },
      { status: 500 }
    );
  }
}