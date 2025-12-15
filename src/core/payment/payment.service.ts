/**
 * Payment Service
 * Requirements: 4.1, 4.2, 4.3, 4.4
 */

import { prisma } from '../db';
import type { Payment, Ticket } from '@prisma/client';
import type { PaymentProvider, WebhookPayload, PaymentOrder } from './provider';
import { createMidtransProvider } from './midtrans.provider';
import { createYukkProvider } from './yukk.provider';
import { getPaymentConfig } from '../config/payment.config';

// Type aliases for status strings (SQLite uses strings instead of enums)
type PaymentStatus = string;
type TicketStatus = string;

export interface CreatePaymentOrderParams {
  ticketId: string;
  amount: number;
  customerEmail: string;
  customerName: string;
  description?: string;
}

export interface PaymentServiceResult {
  payment: Payment;
  paymentOrder: PaymentOrder;
}

export interface WebhookResult {
  payment: Payment;
  ticket: Ticket;
  previousPaymentStatus: PaymentStatus;
  previousTicketStatus: TicketStatus;
}

/**
 * Creates the appropriate payment provider based on config
 */
function createDefaultProvider(): PaymentProvider {
  const config = getPaymentConfig();

  if (config.provider === 'yukk') {
    return createYukkProvider({
      clientId: config.yukkClientId,
      clientSecret: config.yukkClientSecret,
      apiKey: config.yukkApiKey,
      isProduction: config.isProduction,
    });
  }

  return createMidtransProvider();
}

/**
 * Payment Service
 * Handles payment order creation and webhook processing
 */
export class PaymentService {
  private provider: PaymentProvider;

  constructor(provider?: PaymentProvider) {
    this.provider = provider || createDefaultProvider();
  }

  /**
   * Creates a payment order for a ticket
   * Requirements: 4.1
   */
  async createOrder(params: CreatePaymentOrderParams): Promise<PaymentServiceResult> {
    const { ticketId, amount, customerEmail, customerName, description } = params;

    // Verify ticket exists and is in DRAFT status
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new Error('TICKET_NOT_FOUND');
    }

    if (ticket.status !== 'DRAFT') {
      throw new Error('INVALID_TICKET_STATUS');
    }

    // Check if there's already a pending payment
    const existingPayment = await prisma.payment.findFirst({
      where: {
        ticketId,
        status: 'PENDING',
      },
    });

    if (existingPayment) {
      // Return existing payment order
      const paymentOrder: PaymentOrder = {
        orderId: existingPayment.orderId,
        paymentUrl: `${this.getPaymentBaseUrl()}/snap/v2/vtweb/${existingPayment.orderId}`,
        amount: existingPayment.amount,
        currency: existingPayment.currency,
        expiresAt: new Date(existingPayment.createdAt.getTime() + 24 * 60 * 60 * 1000),
      };

      return { payment: existingPayment, paymentOrder };
    }

    // Create payment order via provider
    const paymentOrder = await this.provider.createOrder({
      ticketId,
      amount,
      customerEmail,
      customerName,
      description: description || `Payment for ticket ${ticket.ticketNo}`,
    });

    // Store payment record
    const payment = await prisma.payment.create({
      data: {
        ticketId,
        provider: this.provider.name,
        orderId: paymentOrder.orderId,
        amount: paymentOrder.amount,
        currency: paymentOrder.currency,
        status: 'PENDING',
      },
    });

    return { payment, paymentOrder };
  }

  /**
   * Handles payment webhook
   * Requirements: 4.2, 4.3, 4.4
   */
  async handleWebhook(payload: unknown, signature?: string): Promise<WebhookResult | null> {
    // Verify and parse webhook
    const webhookData = this.provider.verifyWebhook(payload, signature);
    
    if (!webhookData) {
      return null;
    }

    // Find payment by orderId
    const payment = await prisma.payment.findUnique({
      where: { orderId: webhookData.orderId },
      include: { ticket: true },
    });

    if (!payment) {
      throw new Error('PAYMENT_NOT_FOUND');
    }

    const previousPaymentStatus = payment.status;
    const previousTicketStatus = payment.ticket.status;

    // Determine new statuses based on webhook status
    const { newPaymentStatus, newTicketStatus } = this.determineNewStatuses(
      webhookData.status,
      previousTicketStatus
    );

    // Update payment and ticket in transaction
    const [updatedPayment, updatedTicket] = await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: newPaymentStatus as string,
          rawPayload: JSON.stringify(webhookData.rawPayload),
        },
      }),
      prisma.ticket.update({
        where: { id: payment.ticketId },
        data: {
          paymentStatus: newPaymentStatus as string,
          status: newTicketStatus as string,
        },
      }),
    ]);

    return {
      payment: updatedPayment,
      ticket: updatedTicket,
      previousPaymentStatus,
      previousTicketStatus,
    };
  }

  /**
   * Gets payment by ticket ID
   */
  async getPaymentByTicket(ticketId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: { ticketId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets payment by order ID
   */
  async getPaymentByOrderId(orderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { orderId },
    });
  }

  /**
   * Determines new payment and ticket statuses based on webhook status
   * Property 10: Payment Webhook State Machine
   */
  private determineNewStatuses(
    webhookStatus: WebhookPayload['status'],
    currentTicketStatus: TicketStatus
  ): { newPaymentStatus: PaymentStatus; newTicketStatus: TicketStatus } {
    switch (webhookStatus) {
      case 'success':
        return {
          newPaymentStatus: 'PAID',
          newTicketStatus: 'RECEIVED',
        };
      case 'failed':
        return {
          newPaymentStatus: 'FAILED',
          newTicketStatus: currentTicketStatus, // Keep current status (DRAFT)
        };
      case 'expired':
        return {
          newPaymentStatus: 'EXPIRED',
          newTicketStatus: currentTicketStatus, // Keep current status
        };
      default:
        return {
          newPaymentStatus: 'FAILED',
          newTicketStatus: currentTicketStatus,
        };
    }
  }

  private getPaymentBaseUrl(): string {
    const config = getPaymentConfig();

    if (config.provider === 'yukk') {
      return config.isProduction
        ? 'https://api.yukk.co.id'
        : 'https://api-sandbox.yukk.co.id';
    }

    return config.isProduction
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
  }
}

/**
 * Creates a PaymentService instance
 */
export function createPaymentService(provider?: PaymentProvider): PaymentService {
  return new PaymentService(provider);
}

/**
 * Default payment service instance
 */
export const paymentService = new PaymentService();
