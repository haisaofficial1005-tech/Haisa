/**
 * Payment Webhook API Route
 * Requirements: 4.2, 4.3, 4.4, 4.5
 */

import { NextRequest, NextResponse } from 'next/server';
import { paymentService } from '@/core/payment/payment.service';
import { googleSyncService } from '@/core/google/sheets.sync';
import { getWhatsAppService } from '@/core/whatsapp/whatsapp.service';
import { prisma } from '@/core/db';

/**
 * POST /api/webhooks/payment
 * Handles payment gateway webhook
 * Requirements: 4.2, 4.3, 4.4, 4.5
 * 
 * Property 10: Payment Webhook State Machine
 * Property 24: Webhook Payload Preservation
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw payload for preservation (Property 24)
    const payload = await request.json();
    
    // Get signature from header (for verification)
    const signature = request.headers.get('x-signature') || undefined;

    // Process webhook (Property 10: State Machine)
    const result = await paymentService.handleWebhook(payload, signature);

    if (!result) {
      return NextResponse.json(
        { error: 'INVALID_WEBHOOK', message: 'Invalid or unverified webhook payload' },
        { status: 400 }
      );
    }

    const { payment, ticket, previousPaymentStatus, previousTicketStatus } = result;

    // If payment succeeded, trigger Google sync and WhatsApp notification
    if (payment.status === 'PAID' && previousPaymentStatus !== 'PAID') {
      // Get full ticket with customer for sync
      const fullTicket = await prisma.ticket.findUnique({
        where: { id: ticket.id },
        include: {
          customer: true,
          assignedAgent: true,
        },
      });

      if (fullTicket) {
        // Trigger Google sync (Requirements: 4.5)
        try {
          const syncResult = await googleSyncService.syncNewTicket(fullTicket);
          console.log('Google sync completed:', syncResult);
        } catch (syncError) {
          console.error('Google sync failed:', syncError);
          // Don't fail the webhook - sync can be retried
        }

        // Send WhatsApp notification (Requirements: 10.1, 10.2)
        try {
          const waService = getWhatsAppService();
          await waService.sendTicketNotification({
            ticketNo: fullTicket.ticketNo,
            customerName: fullTicket.customer.name,
            issueType: fullTicket.issueType,
            ticketId: fullTicket.id,
          });
          console.log('WhatsApp notification sent');
        } catch (waError) {
          console.error('WhatsApp notification failed:', waError);
          // Don't fail the webhook - notification is non-blocking
        }
      }
    }

    return NextResponse.json({
      success: true,
      orderId: payment.orderId,
      paymentStatus: payment.status,
      ticketStatus: ticket.status,
    });

  } catch (error) {
    console.error('Error processing payment webhook:', error);
    
    // Return 200 to prevent webhook retries for processing errors
    // The payment gateway will retry on 5xx errors
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
