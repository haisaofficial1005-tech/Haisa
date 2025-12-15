/**
 * Webhook Payload Preservation Property Tests
 * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
 * **Validates: Requirements 13.3**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types
interface WebhookPayload {
  order_id: string;
  transaction_status: string;
  gross_amount: string;
  payment_type: string;
  transaction_time: string;
  fraud_status?: string;
  [key: string]: unknown;
}

interface PaymentRecord {
  id: string;
  orderId: string;
  status: string;
  rawPayload: Record<string, unknown> | null;
}

/**
 * Simulates storing webhook payload in payment record
 * Property 24: Webhook Payload Preservation
 */
function storeWebhookPayload(
  payment: PaymentRecord,
  webhookPayload: WebhookPayload
): PaymentRecord {
  return {
    ...payment,
    rawPayload: { ...webhookPayload },
  };
}

/**
 * Validates that rawPayload contains the complete original webhook
 */
function validatePayloadPreservation(
  originalPayload: WebhookPayload,
  storedPayload: Record<string, unknown> | null
): boolean {
  if (!storedPayload) {
    return false;
  }

  // Check all original fields are preserved
  for (const key of Object.keys(originalPayload)) {
    if (storedPayload[key] !== originalPayload[key]) {
      return false;
    }
  }

  return true;
}

/**
 * Extracts key fields from webhook payload
 */
function extractWebhookFields(payload: WebhookPayload): {
  orderId: string;
  status: string;
  amount: string;
} {
  return {
    orderId: payload.order_id,
    status: payload.transaction_status,
    amount: payload.gross_amount,
  };
}

// Arbitraries
const orderIdArb = fc.string({ minLength: 10, maxLength: 50 })
  .filter(s => s.length > 0)
  .map(s => `ORDER-${s}`);

const transactionStatusArb = fc.constantFrom(
  'capture', 'settlement', 'pending', 'deny', 'cancel', 'expire', 'failure'
);

const amountArb = fc.integer({ min: 1000, max: 10000000 }).map(n => String(n));

const paymentTypeArb = fc.constantFrom(
  'credit_card', 'bank_transfer', 'gopay', 'shopeepay', 'qris'
);

const timestampArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts).toISOString());

const fraudStatusArb = fc.oneof(
  fc.constant('accept'),
  fc.constant('challenge'),
  fc.constant('deny'),
  fc.constant(undefined)
);

const webhookPayloadArb = fc.record({
  order_id: orderIdArb,
  transaction_status: transactionStatusArb,
  gross_amount: amountArb,
  payment_type: paymentTypeArb,
  transaction_time: timestampArb,
  fraud_status: fraudStatusArb,
}).map(p => {
  // Remove undefined fraud_status
  if (p.fraud_status === undefined) {
    const { fraud_status, ...rest } = p;
    return rest as WebhookPayload;
  }
  return p as WebhookPayload;
});

const paymentRecordArb = fc.record({
  id: fc.uuid(),
  orderId: orderIdArb,
  status: fc.constantFrom('PENDING', 'PAID', 'FAILED', 'EXPIRED'),
  rawPayload: fc.constant(null),
});

describe('Webhook Payload Preservation', () => {
  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24a: rawPayload contains complete original webhook JSON
   * *For any* payment webhook received, the rawPayload field in Payment record
   * SHALL contain the complete original webhook JSON
   */
  it('Property 24a: rawPayload contains complete original webhook JSON', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          
          expect(updated.rawPayload).not.toBeNull();
          expect(updated.rawPayload).toEqual(webhookPayload);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24b: All webhook fields are preserved
   * *For any* webhook payload, all fields SHALL be preserved in rawPayload
   */
  it('Property 24b: all webhook fields are preserved', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          
          const isPreserved = validatePayloadPreservation(
            webhookPayload,
            updated.rawPayload
          );
          
          expect(isPreserved).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24c: order_id is preserved
   */
  it('Property 24c: order_id is preserved', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          
          expect(updated.rawPayload?.order_id).toBe(webhookPayload.order_id);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24d: transaction_status is preserved
   */
  it('Property 24d: transaction_status is preserved', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          
          expect(updated.rawPayload?.transaction_status).toBe(webhookPayload.transaction_status);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24e: gross_amount is preserved
   */
  it('Property 24e: gross_amount is preserved', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          
          expect(updated.rawPayload?.gross_amount).toBe(webhookPayload.gross_amount);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24f: Payload storage is deterministic
   */
  it('Property 24f: payload storage is deterministic', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated1 = storeWebhookPayload(payment, webhookPayload);
          const updated2 = storeWebhookPayload(payment, webhookPayload);
          const updated3 = storeWebhookPayload(payment, webhookPayload);
          
          expect(updated1.rawPayload).toEqual(updated2.rawPayload);
          expect(updated2.rawPayload).toEqual(updated3.rawPayload);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 24: Webhook Payload Preservation**
   * 
   * Property 24g: Key fields can be extracted from preserved payload
   */
  it('Property 24g: key fields can be extracted from preserved payload', () => {
    fc.assert(
      fc.property(
        paymentRecordArb,
        webhookPayloadArb,
        (payment, webhookPayload) => {
          const updated = storeWebhookPayload(payment, webhookPayload);
          const extracted = extractWebhookFields(updated.rawPayload as WebhookPayload);
          
          expect(extracted.orderId).toBe(webhookPayload.order_id);
          expect(extracted.status).toBe(webhookPayload.transaction_status);
          expect(extracted.amount).toBe(webhookPayload.gross_amount);
        }
      ),
      { numRuns: 100 }
    );
  });
});
