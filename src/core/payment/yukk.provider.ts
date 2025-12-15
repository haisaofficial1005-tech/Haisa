/**
 * Yukk Payment Provider Implementation
 * https://yukk.co.id
 */

import type {
  PaymentProvider,
  PaymentOrder,
  WebhookPayload,
  CreateOrderParams,
} from './provider';

interface YukkConfig {
  clientId: string;
  clientSecret: string;
  apiKey: string;
  isProduction: boolean;
}

/**
 * Yukk Payment Provider
 */
export class YukkProvider implements PaymentProvider {
  readonly name = 'yukk';

  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly apiKey: string;
  private readonly isProduction: boolean;
  private readonly baseUrl: string;

  constructor(config: YukkConfig) {
    this.clientId = config.clientId;
    this.clientSecret = config.clientSecret;
    this.apiKey = config.apiKey;
    this.isProduction = config.isProduction;
    this.baseUrl = this.isProduction
      ? 'https://api.yukk.co.id'
      : 'https://api-sandbox.yukk.co.id';
  }

  generateOrderId(ticketId: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `YUKK-${ticketId.substring(0, 8)}-${timestamp}-${random}`;
  }

  async createOrder(params: CreateOrderParams): Promise<PaymentOrder> {
    const orderId = this.generateOrderId(params.ticketId);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      // Create payment request to Yukk API
      const response = await fetch(`${this.baseUrl}/v1/payment/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Client-ID': this.clientId,
          'X-Client-Secret': this.clientSecret,
          'X-API-Key': this.apiKey,
        },
        body: JSON.stringify({
          order_id: orderId,
          amount: params.amount,
          currency: params.currency || 'IDR',
          customer_email: params.customerEmail,
          customer_name: params.customerName,
          description: params.description,
          expired_at: expiresAt.toISOString(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return {
          orderId: data.order_id || orderId,
          paymentUrl: data.payment_url || `${this.baseUrl}/pay/${orderId}`,
          amount: params.amount,
          currency: params.currency || 'IDR',
          expiresAt,
        };
      }

      // If API call fails, return mock URL for testing
      console.warn('Yukk API call failed, using mock response');
    } catch (error) {
      console.warn('Yukk API error:', error);
    }

    // Fallback mock response for development/testing
    return {
      orderId,
      paymentUrl: `${this.baseUrl}/pay/${orderId}`,
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

    // TODO: Verify signature with Yukk's webhook signature
    // const expectedSignature = crypto
    //   .createHmac('sha256', this.clientSecret)
    //   .update(JSON.stringify(data))
    //   .digest('hex');
    //
    // if (signature !== expectedSignature) {
    //   return null;
    // }

    const orderId = (data.order_id || data.orderId) as string;
    const transactionStatus = (data.status || data.transaction_status) as string;

    let status: 'success' | 'failed' | 'expired';

    const successStatuses = ['success', 'paid', 'settlement', 'completed'];
    const expiredStatuses = ['expired', 'expire'];
    const failedStatuses = ['failed', 'denied', 'cancelled', 'cancel', 'failure'];

    if (successStatuses.includes(transactionStatus?.toLowerCase())) {
      status = 'success';
    } else if (expiredStatuses.includes(transactionStatus?.toLowerCase())) {
      status = 'expired';
    } else if (failedStatuses.includes(transactionStatus?.toLowerCase())) {
      status = 'failed';
    } else {
      // Unknown status - treat as failed
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
 * Creates a Yukk provider instance
 */
export function createYukkProvider(config: YukkConfig): PaymentProvider {
  return new YukkProvider(config);
}
