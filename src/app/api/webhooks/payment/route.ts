/**
 * Payment Webhook API Route - QRIS Implementation
 * Handles QRIS payment confirmations
 */

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/core/db';
import { googleSyncService } from '@/core/google/sheets.sync';
import { attachmentService } from '@/core/attachments/attachment.service';
import { getWhatsAppService } from '@/core/whatsapp/whatsapp.service';

/**
 * POST /api/webhooks/payment
 * Handles QRIS payment confirmation webhook
 * This is a simplified webhook for QRIS payments
 */
export async function POST(request: NextRequest) {
  try {
    // Get payload
    const payload = await request.json();
    
    // For QRIS, we expect a simple payload with orderId and status
    const { orderId, status, amount, uniqueCode } = payload;

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'INVALID_PAYLOAD', message: 'orderId and status are required' },
        { status: 400 }
      );
    }

    // Find payment by orderId
    const payment = await prisma.payment.findUnique({
      where: { orderId },
      include: { ticket: { include: { customer: true } } },
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'PAYMENT_NOT_FOUND', message: 'Payment not found' },
        { status: 404 }
      );
    }

    const previousPaymentStatus = payment.status;
    const previousTicketStatus = payment.ticket.status;

    // Determine new statuses based on webhook status
    let newPaymentStatus = payment.status;
    let newTicketStatus = payment.ticket.status;

    switch (status.toLowerCase()) {
      case 'success':
      case 'paid':
      case 'settlement':
        newPaymentStatus = 'PAID';
        newTicketStatus = 'RECEIVED';
        break;
      case 'failed':
      case 'deny':
        newPaymentStatus = 'FAILED';
        // Keep current ticket status
        break;
      case 'expired':
      case 'cancel':
        newPaymentStatus = 'EXPIRED';
        // Keep current ticket status
        break;
      default:
        // Unknown status, keep current
        break;
    }

    // Update payment and ticket in transaction
    const [updatedPayment, updatedTicket] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus,
          rawPayload: JSON.stringify({
            ...payload,
            processedAt: new Date().toISOString(),
          }),
        },
      }),
      prisma.ticket.update({
        where: { id: payment.ticketId },
        data: {
          paymentStatus: newPaymentStatus,
          status: newTicketStatus,
        },
      }),
    ]);

    // If payment succeeded, trigger Google sync and WhatsApp notification
    if (newPaymentStatus === 'PAID' && previousPaymentStatus !== 'PAID') {
      // Get full ticket with customer and attachments for sync
      const fullTicket = await prisma.ticket.findUnique({
        where: { id: payment.ticketId },
        include: {
          customer: true,
          assignedAgent: true,
          attachments: true,
        },
      });

      if (fullTicket) {
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
      }
    }

    return NextResponse.json({
      success: true,
      orderId: updatedPayment.orderId,
      paymentStatus: updatedPayment.status,
      ticketStatus: updatedTicket.status,
      message: 'QRIS payment webhook processed successfully',
    });

  } catch (error) {
    console.error('Error processing QRIS payment webhook:', error);
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'PROCESSING_ERROR', 
        message: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 200 }
    );
  }
}
