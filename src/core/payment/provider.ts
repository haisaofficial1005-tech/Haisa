/**
 * Payment Provider Interface
 * Requirements: 4.1
 */

export interface PaymentOrder {
  orderId: string;
  paymentUrl: string;
  amount: number;
  currency: string;
  expiresAt: Date;
}

export interface WebhookPayload {
  orderId: string;
  status: 'success' | 'failed' | 'expired';
  rawPayload: Record<string, unknown>;
}

export interface CreateOrderParams {
  ticketId: string;
  amount: number;
  currency?: string;
  customerEmail: string;
  customerName: string;
  description: string;
}

/**
 * Payment Provider Interface
 * Abstraction for different payment gateways
 */
export interface PaymentProvider {
  /**
   * Provider name identifier
   */
  readonly name: string;

  /**
   * Creates a payment order
   */
  createOrder(params: CreateOrderParams): Promise<PaymentOrder>;

  /**
   * Verifies and parses a webhook payload
   * Returns null if verification fails
   */
  verifyWebhook(payload: unknown, signature?: string): WebhookPayload | null;

  /**
   * Generates a unique order ID
   */
  generateOrderId(ticketId: string): string;
}
