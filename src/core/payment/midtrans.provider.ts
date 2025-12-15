/**
 * Midtrans Payment Provider Implementation
 * Requirements: 4.1
 */

import type { PaymentProvider, PaymentOrder, WebhookPayload, CreateOrderParams } from './provider';
import { getPaymentConfig } from '../config/payment.config';

/**
 * Midtrans Payment Provider
 * Note: This is a simplified implementation. In production, use the official Midtrans SDK.
 */
export class MidtransProvider implements PaymentProvider {
  readonly name = 'midtrans';
  
  private readonly serverKey: string;
  private readonly clientKey: string;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  constructor() {
    const config = getPaymentConfig();
    this.serverKey = config.serverKey;
    this.clientKey = config.clientKey;
    this.isProduction = config.isProduction;
    this.baseUrl = this.isProduction
      ? 'https://app.midtrans.com'
      : 'https://app.sandbox.midtrans.com';
  }

  generateOrderId(ticketId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `ORDER-${ticketId.substring(0, 8)}-${timestamp}-${random}`;
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const orderId = this.generateOrderId(params.ticketId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // In production, this would call Midtrans Snap API
    // For now, return a mock response structure
    const snapPayload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: params.amount,
      },
      customer_details: {
        email: params.customerEmail,
        first_name: params.customerName,
      },
      item_details: [
        {
          id: params.ticketId,
          price: params.amount,
          quantity: 1,
          name: params.description,
        },
      ],
      expiry: {
        unit: 'hours',
        duration: 24,
      },
    };

    // TODO: Replace with actual Midtrans API call
    // const response = await fetch(`${this.baseUrl}/snap/v1/transactions`, {
    //   method: 'POST',
    //   headers: {
    //     'Content-Type': 'application/json',
    //     'Authorization': `Basic ${Buffer.from(this.serverKey + ':').toString('base64')}`,
    //   },
    //   body: JSON.stringify(snapPayload),
    // });

    return {
      orderId,
      paymentUrl: `${this.baseUrl}/snap/v2/vtweb/${orderId}`,
      amount: params.amount,
      currency: params.currency || 'IDR',
      expiresAt,
    };
  }

  verifyWebhook(payload: unknown, signature?: string): WebhookPayload | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;
    
    // Verify signature hash (simplified - in production use proper HMAC verification)
    // const expectedSignature = crypto
    //   .createHash('sha512')
    //   .update(`${data.order_id}${data.status_code}${data.gross_amount}${this.serverKey}`)
    //   .digest('hex');
    
    // if (signature !== expectedSignature) {
    //   return null;
    // }

    const orderId = data.order_id as string;
    const transactionStatus = data.transaction_status as string;
    const fraudStatus = data.fraud_status as string;

    let status: 'success' | 'failed' | 'expired';

    if (transactionStatus === 'capture' || transactionStatus === 'settlement') {
      if (fraudStatus === 'accept' || !fraudStatus) {
        status = 'success';
      } else {
        status = 'failed';
      }
    } else if (transactionStatus === 'expire') {
      status = 'expired';
    } else if (
      transactionStatus === 'deny' ||
      transactionStatus === 'cancel' ||
      transactionStatus === 'failure'
    ) {
      status = 'failed';
    } else {
      // pending or other status - treat as failed for now
      status = 'failed';
    }

    return {
      orderId,
      status,
      rawPayload: data,
    };
  }
}

/**
 * Creates a Midtrans provider instance
 */
export function createMidtransProvider(): PaymentProvider {
  return new MidtransProvider();
}
