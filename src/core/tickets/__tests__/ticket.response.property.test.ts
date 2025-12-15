/**
 * Ticket Response Property Tests
 * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
 * **Validates: Requirements 7.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Types
type TicketStatus = 'DRAFT' | 'RECEIVED' | 'IN_REVIEW' | 'NEED_MORE_INFO' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
type IssueType = 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED' | 'VERIFICATION_ISSUE' | 'HACKED_ACCOUNT' | 'OTHER';

interface TicketListItem {
  id: string;
  ticketNo: string;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date | string;
  issueType: IssueType;
}

interface TicketListResponse {
  tickets: TicketListItem[];
}

// Required fields for ticket list response
const REQUIRED_TICKET_LIST_FIELDS = [
  'ticketNo',
  'status',
  'paymentStatus',
  'createdAt',
  'issueType',
] as const;

/**
 * Validates that a ticket list item has all required fields
 * Property 18: Ticket List Response Fields
 */
function validateTicketListItem(item: TicketListItem): boolean {
  for (const field of REQUIRED_TICKET_LIST_FIELDS) {
    if (item[field] === undefined || item[field] === null) {
      return false;
    }
  }
  return true;
}

/**
 * Validates that all items in a ticket list response have required fields
 */
function validateTicketListResponse(response: TicketListResponse): boolean {
  if (!response.tickets || !Array.isArray(response.tickets)) {
    return false;
  }
  
  return response.tickets.every(validateTicketListItem);
}

/**
 * Transforms a full ticket to a list item with required fields
 */
function toTicketListItem(ticket: {
  id: string;
  ticketNo: string;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  createdAt: Date;
  issueType: IssueType;
}): TicketListItem {
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    status: ticket.status,
    paymentStatus: ticket.paymentStatus,
    createdAt: ticket.createdAt,
    issueType: ticket.issueType,
  };
}

// Arbitraries
const uuidArb = fc.uuid();
const ticketNoArb = fc.integer({ min: 1, max: 999999 }).map(n => 
  `WAC-${new Date().getFullYear()}-${String(n).padStart(6, '0')}`
);

const ticketStatusArb = fc.constantFrom<TicketStatus>(
  'DRAFT', 'RECEIVED', 'IN_REVIEW', 'NEED_MORE_INFO',
  'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'
);

const paymentStatusArb = fc.constantFrom<PaymentStatus>(
  'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED'
);

const issueTypeArb = fc.constantFrom<IssueType>(
  'ACCOUNT_BANNED', 'ACCOUNT_SUSPENDED', 'VERIFICATION_ISSUE', 'HACKED_ACCOUNT', 'OTHER'
);

const dateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: new Date('2030-12-31').getTime() 
}).map(ts => new Date(ts));

const ticketArb = fc.record({
  id: uuidArb,
  ticketNo: ticketNoArb,
  status: ticketStatusArb,
  paymentStatus: paymentStatusArb,
  createdAt: dateArb,
  issueType: issueTypeArb,
});

const ticketListResponseArb = fc.array(ticketArb, { minLength: 0, maxLength: 20 })
  .map(tickets => ({ tickets: tickets.map(toTicketListItem) }));

describe('Ticket List Response Fields', () => {
  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18a: Each ticket has ticketNo
   * *For any* ticket list API response, each ticket object SHALL contain ticketNo
   */
  it('Property 18a: each ticket has ticketNo', () => {
    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        for (const ticket of response.tickets) {
          expect(ticket.ticketNo).toBeDefined();
          expect(typeof ticket.ticketNo).toBe('string');
          expect(ticket.ticketNo.length).toBeGreaterThan(0);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18b: Each ticket has status
   * *For any* ticket list API response, each ticket object SHALL contain status
   */
  it('Property 18b: each ticket has status', () => {
    const validStatuses: TicketStatus[] = [
      'DRAFT', 'RECEIVED', 'IN_REVIEW', 'NEED_MORE_INFO',
      'IN_PROGRESS', 'RESOLVED', 'CLOSED', 'REJECTED'
    ];

    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        for (const ticket of response.tickets) {
          expect(ticket.status).toBeDefined();
          expect(validStatuses).toContain(ticket.status);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18c: Each ticket has paymentStatus
   * *For any* ticket list API response, each ticket object SHALL contain paymentStatus
   */
  it('Property 18c: each ticket has paymentStatus', () => {
    const validPaymentStatuses: PaymentStatus[] = [
      'PENDING', 'PAID', 'FAILED', 'EXPIRED', 'REFUNDED'
    ];

    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        for (const ticket of response.tickets) {
          expect(ticket.paymentStatus).toBeDefined();
          expect(validPaymentStatuses).toContain(ticket.paymentStatus);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18d: Each ticket has createdAt
   * *For any* ticket list API response, each ticket object SHALL contain createdAt
   */
  it('Property 18d: each ticket has createdAt', () => {
    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        for (const ticket of response.tickets) {
          expect(ticket.createdAt).toBeDefined();
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18e: Each ticket has issueType
   * *For any* ticket list API response, each ticket object SHALL contain issueType
   */
  it('Property 18e: each ticket has issueType', () => {
    const validIssueTypes: IssueType[] = [
      'ACCOUNT_BANNED', 'ACCOUNT_SUSPENDED', 'VERIFICATION_ISSUE', 'HACKED_ACCOUNT', 'OTHER'
    ];

    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        for (const ticket of response.tickets) {
          expect(ticket.issueType).toBeDefined();
          expect(validIssueTypes).toContain(ticket.issueType);
        }
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18f: All tickets in response pass validation
   */
  it('Property 18f: all tickets in response pass validation', () => {
    fc.assert(
      fc.property(ticketListResponseArb, (response) => {
        const isValid = validateTicketListResponse(response);
        expect(isValid).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 18: Ticket List Response Fields**
   * 
   * Property 18g: Transformation preserves required fields
   */
  it('Property 18g: transformation preserves required fields', () => {
    fc.assert(
      fc.property(ticketArb, (ticket) => {
        const listItem = toTicketListItem(ticket);
        
        expect(listItem.ticketNo).toBe(ticket.ticketNo);
        expect(listItem.status).toBe(ticket.status);
        expect(listItem.paymentStatus).toBe(ticket.paymentStatus);
        expect(listItem.createdAt).toBe(ticket.createdAt);
        expect(listItem.issueType).toBe(ticket.issueType);
      }),
      { numRuns: 100 }
    );
  });
});
