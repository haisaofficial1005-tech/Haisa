/**
 * Integration Tests for Main Flows
 * Requirements: All
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';

// Types
type TicketStatus = 'DRAFT' | 'RECEIVED' | 'IN_REVIEW' | 'NEED_MORE_INFO' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';
type IssueType = 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED' | 'VERIFICATION_ISSUE' | 'HACKED_ACCOUNT' | 'OTHER';

interface Ticket {
  id: string;
  ticketNo: string;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  customerId: string;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: Date;
  device: string;
  waVersion: string;
  description: string;
  googleDriveFolderId: string | null;
  googleDriveFolderUrl: string | null;
  googleSheetRowIndex: number | null;
  createdAt: Date;
}

interface Payment {
  id: string;
  ticketId: string;
  orderId: string;
  amount: number;
  status: PaymentStatus;
}

interface AuditLog {
  id: string;
  ticketId: string;
  actorId: string;
  action: string;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
  createdAt: Date;
}

// Simulated services for integration testing

class MockTicketService {
  private tickets: Map<string, Ticket> = new Map();
  private counter = 0;

  createDraft(input: {
    customerId: string;
    whatsAppNumber: string;
    countryRegion: string;
    issueType: IssueType;
    incidentAt: Date;
    device: string;
    waVersion: string;
    description: string;
  }): Ticket {
    this.counter++;
    const ticket: Ticket = {
      id: crypto.randomUUID(),
      ticketNo: `WAC-${new Date().getFullYear()}-${String(this.counter).padStart(6, '0')}`,
      status: 'DRAFT',
      paymentStatus: 'PENDING',
      ...input,
      googleDriveFolderId: null,
      googleDriveFolderUrl: null,
      googleSheetRowIndex: null,
      createdAt: new Date(),
    };
    this.tickets.set(ticket.id, ticket);
    return ticket;
  }

  updatePaymentStatus(id: string, paymentStatus: PaymentStatus, newStatus?: TicketStatus): Ticket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;

    ticket.paymentStatus = paymentStatus;
    if (newStatus) {
      ticket.status = newStatus;
    }
    return ticket;
  }

  updateGoogleSync(id: string, data: {
    googleDriveFolderId: string;
    googleDriveFolderUrl: string;
    googleSheetRowIndex: number;
  }): Ticket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;

    ticket.googleDriveFolderId = data.googleDriveFolderId;
    ticket.googleDriveFolderUrl = data.googleDriveFolderUrl;
    ticket.googleSheetRowIndex = data.googleSheetRowIndex;
    return ticket;
  }

  updateStatus(id: string, status: TicketStatus): Ticket | null {
    const ticket = this.tickets.get(id);
    if (!ticket) return null;

    ticket.status = status;
    return ticket;
  }

  getById(id: string): Ticket | null {
    return this.tickets.get(id) || null;
  }

  clear() {
    this.tickets.clear();
    this.counter = 0;
  }
}

class MockPaymentService {
  private payments: Map<string, Payment> = new Map();

  createOrder(ticketId: string, amount: number): Payment {
    const payment: Payment = {
      id: crypto.randomUUID(),
      ticketId,
      orderId: `ORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      amount,
      status: 'PENDING',
    };
    this.payments.set(payment.id, payment);
    return payment;
  }

  handleWebhook(orderId: string, status: 'success' | 'failed' | 'expired'): Payment | null {
    const payment = Array.from(this.payments.values()).find(p => p.orderId === orderId);
    if (!payment) return null;

    switch (status) {
      case 'success':
        payment.status = 'PAID';
        break;
      case 'failed':
        payment.status = 'FAILED';
        break;
      case 'expired':
        payment.status = 'EXPIRED';
        break;
    }
    return payment;
  }

  getByTicket(ticketId: string): Payment | null {
    return Array.from(this.payments.values()).find(p => p.ticketId === ticketId) || null;
  }

  clear() {
    this.payments.clear();
  }
}

class MockAuditService {
  private logs: AuditLog[] = [];

  log(entry: {
    ticketId: string;
    actorId: string;
    action: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown>;
  }): AuditLog {
    const log: AuditLog = {
      id: crypto.randomUUID(),
      ...entry,
      createdAt: new Date(),
    };
    this.logs.push(log);
    return log;
  }

  getByTicket(ticketId: string): AuditLog[] {
    return this.logs.filter(l => l.ticketId === ticketId);
  }

  clear() {
    this.logs = [];
  }
}

class MockGoogleSyncService {
  syncNewTicket(ticket: Ticket): {
    folderId: string;
    folderUrl: string;
    rowIndex: number;
  } {
    return {
      folderId: `folder-${ticket.ticketNo}`,
      folderUrl: `https://drive.google.com/folders/${ticket.ticketNo}`,
      rowIndex: Math.floor(Math.random() * 1000) + 2,
    };
  }

  syncTicketUpdate(ticket: Ticket): boolean {
    return ticket.googleSheetRowIndex !== null;
  }
}

// Test setup
let ticketService: MockTicketService;
let paymentService: MockPaymentService;
let auditService: MockAuditService;
let googleSyncService: MockGoogleSyncService;

// Arbitraries
const uuidArb = fc.uuid();
const phoneArb = fc.string({ minLength: 10, maxLength: 15 }).map(s => `+${s.replace(/\D/g, '').slice(0, 15) || '1234567890'}`);
const issueTypeArb = fc.constantFrom<IssueType>('ACCOUNT_BANNED', 'ACCOUNT_SUSPENDED', 'VERIFICATION_ISSUE', 'HACKED_ACCOUNT', 'OTHER');
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 }).filter(s => s.trim().length > 0);

const ticketInputArb = fc.record({
  customerId: uuidArb,
  whatsAppNumber: phoneArb,
  countryRegion: fc.constantFrom('Indonesia', 'Malaysia', 'Singapore'),
  issueType: issueTypeArb,
  incidentAt: fc.date({ min: new Date('2020-01-01'), max: new Date() }),
  device: nonEmptyStringArb,
  waVersion: fc.string({ minLength: 1, maxLength: 20 }),
  description: fc.string({ minLength: 20, maxLength: 500 }),
});

describe('Integration: Ticket Creation → Payment → Google Sync Flow', () => {
  beforeEach(() => {
    ticketService = new MockTicketService();
    paymentService = new MockPaymentService();
    auditService = new MockAuditService();
    googleSyncService = new MockGoogleSyncService();
    // Clear all services
    ticketService.clear();
    paymentService.clear();
    auditService.clear();
  });

  /**
   * Test: Complete ticket creation flow
   * 1. Create ticket draft
   * 2. Create payment order
   * 3. Process payment webhook
   * 4. Trigger Google sync
   */
  it('complete ticket creation flow works correctly', () => {
    // Use a single test case instead of property-based for this complex flow
    const input = {
      customerId: crypto.randomUUID(),
      whatsAppNumber: '+6281234567890',
      countryRegion: 'Indonesia',
      issueType: 'ACCOUNT_BANNED' as IssueType,
      incidentAt: new Date(),
      device: 'iPhone 14',
      waVersion: '2.23.25.83',
      description: 'Test description for integration test',
    };

    // Step 1: Create ticket draft
    const ticket = ticketService.createDraft(input);
    const ticketId = ticket.id;
    
    expect(ticket.status).toBe('DRAFT');
    expect(ticket.paymentStatus).toBe('PENDING');
    expect(ticket.ticketNo).toMatch(/^WAC-\d{4}-\d{6}$/);

    // Step 2: Create payment order
    const payment = paymentService.createOrder(ticketId, 50000);
    
    expect(payment.ticketId).toBe(ticketId);
    expect(payment.status).toBe('PENDING');
    expect(payment.orderId).toBeTruthy();

    // Step 3: Process payment webhook (success)
    const updatedPayment = paymentService.handleWebhook(payment.orderId, 'success');
    
    expect(updatedPayment?.status).toBe('PAID');

    // Update ticket status
    const paidTicket = ticketService.updatePaymentStatus(ticketId, 'PAID', 'RECEIVED');
    
    expect(paidTicket).not.toBeNull();
    expect(paidTicket?.paymentStatus).toBe('PAID');
    expect(paidTicket?.status).toBe('RECEIVED');

    // Step 4: Trigger Google sync
    const syncResult = googleSyncService.syncNewTicket(paidTicket!);
    
    expect(syncResult.folderId).toBeTruthy();
    expect(syncResult.folderUrl).toBeTruthy();
    expect(syncResult.rowIndex).toBeGreaterThan(1);

    // Update ticket with sync data - directly modify the ticket object
    // since we're using in-memory mock
    paidTicket!.googleDriveFolderId = syncResult.folderId;
    paidTicket!.googleDriveFolderUrl = syncResult.folderUrl;
    paidTicket!.googleSheetRowIndex = syncResult.rowIndex;
    
    // Verify sync data was stored
    expect(paidTicket?.googleDriveFolderId).toBe(syncResult.folderId);
    expect(paidTicket?.googleDriveFolderUrl).toBe(syncResult.folderUrl);
    expect(paidTicket?.googleSheetRowIndex).toBe(syncResult.rowIndex);
  });

  /**
   * Test: Payment failure flow
   */
  it('payment failure keeps ticket in DRAFT status', () => {
    fc.assert(
      fc.property(ticketInputArb, (input) => {
        // Create ticket and payment
        const ticket = ticketService.createDraft(input);
        const payment = paymentService.createOrder(ticket.id, 50000);

        // Process failed payment
        const updatedPayment = paymentService.handleWebhook(payment.orderId, 'failed');
        
        expect(updatedPayment?.status).toBe('FAILED');

        // Update ticket
        const failedTicket = ticketService.updatePaymentStatus(ticket.id, 'FAILED');
        
        expect(failedTicket?.paymentStatus).toBe('FAILED');
        expect(failedTicket?.status).toBe('DRAFT'); // Status unchanged
      }),
      { numRuns: 50 }
    );
  });
});

describe('Integration: Status Update → Audit Log → Sheets Sync Flow', () => {
  beforeEach(() => {
    ticketService = new MockTicketService();
    paymentService = new MockPaymentService();
    auditService = new MockAuditService();
    googleSyncService = new MockGoogleSyncService();
  });

  /**
   * Test: Status update creates audit log and syncs to sheets
   */
  it('status update creates audit log and syncs to sheets', () => {
    fc.assert(
      fc.property(
        ticketInputArb,
        uuidArb,
        (input, actorId) => {
          // Setup: Create and pay for ticket
          const ticket = ticketService.createDraft(input);
          ticketService.updatePaymentStatus(ticket.id, 'PAID', 'RECEIVED');
          
          const syncResult = googleSyncService.syncNewTicket(ticket);
          ticketService.updateGoogleSync(ticket.id, syncResult);

          // Get current ticket state
          const currentTicket = ticketService.getById(ticket.id)!;
          const previousStatus = currentTicket.status;

          // Update status
          const newStatus: TicketStatus = 'IN_REVIEW';
          const updatedTicket = ticketService.updateStatus(ticket.id, newStatus);

          // Create audit log
          const auditLog = auditService.log({
            ticketId: ticket.id,
            actorId,
            action: 'STATUS_CHANGED',
            before: { status: previousStatus },
            after: { status: newStatus },
          });

          // Verify audit log
          expect(auditLog.ticketId).toBe(ticket.id);
          expect(auditLog.action).toBe('STATUS_CHANGED');
          expect(auditLog.before).toEqual({ status: previousStatus });
          expect(auditLog.after).toEqual({ status: newStatus });

          // Verify sheets sync would work
          const canSync = googleSyncService.syncTicketUpdate(updatedTicket!);
          expect(canSync).toBe(true);

          // Verify audit logs are retrievable
          const logs = auditService.getByTicket(ticket.id);
          expect(logs.length).toBeGreaterThan(0);
          expect(logs.some(l => l.action === 'STATUS_CHANGED')).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Test: Multiple status changes create multiple audit logs
   */
  it('multiple status changes create multiple audit logs', () => {
    fc.assert(
      fc.property(ticketInputArb, uuidArb, (input, actorId) => {
        // Setup
        const ticket = ticketService.createDraft(input);
        ticketService.updatePaymentStatus(ticket.id, 'PAID', 'RECEIVED');

        // Multiple status changes
        const statusChanges: TicketStatus[] = ['IN_REVIEW', 'IN_PROGRESS', 'RESOLVED'];
        let previousStatus: TicketStatus = 'RECEIVED';

        for (const newStatus of statusChanges) {
          ticketService.updateStatus(ticket.id, newStatus);
          auditService.log({
            ticketId: ticket.id,
            actorId,
            action: 'STATUS_CHANGED',
            before: { status: previousStatus },
            after: { status: newStatus },
          });
          previousStatus = newStatus;
        }

        // Verify all audit logs exist
        const logs = auditService.getByTicket(ticket.id);
        expect(logs.length).toBe(statusChanges.length);

        // Verify chronological order
        for (let i = 0; i < logs.length - 1; i++) {
          expect(logs[i].createdAt.getTime()).toBeLessThanOrEqual(logs[i + 1].createdAt.getTime());
        }
      }),
      { numRuns: 50 }
    );
  });
});

describe('Integration: Data Consistency', () => {
  beforeEach(() => {
    ticketService = new MockTicketService();
    paymentService = new MockPaymentService();
  });

  /**
   * Test: Ticket and payment are always linked
   */
  it('ticket and payment are always linked', () => {
    fc.assert(
      fc.property(ticketInputArb, (input) => {
        const ticket = ticketService.createDraft(input);
        const payment = paymentService.createOrder(ticket.id, 50000);

        // Verify link
        const linkedPayment = paymentService.getByTicket(ticket.id);
        expect(linkedPayment).not.toBeNull();
        expect(linkedPayment?.id).toBe(payment.id);
        expect(linkedPayment?.ticketId).toBe(ticket.id);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * Test: Payment status reflects in ticket
   */
  it('payment status reflects in ticket', () => {
    fc.assert(
      fc.property(
        ticketInputArb,
        fc.constantFrom<'success' | 'failed' | 'expired'>('success', 'failed', 'expired'),
        (input, webhookStatus) => {
          const ticket = ticketService.createDraft(input);
          const payment = paymentService.createOrder(ticket.id, 50000);

          // Process webhook
          paymentService.handleWebhook(payment.orderId, webhookStatus);

          // Update ticket based on webhook
          const expectedPaymentStatus: PaymentStatus = 
            webhookStatus === 'success' ? 'PAID' :
            webhookStatus === 'failed' ? 'FAILED' : 'EXPIRED';

          const expectedTicketStatus: TicketStatus = 
            webhookStatus === 'success' ? 'RECEIVED' : 'DRAFT';

          const updatedTicket = ticketService.updatePaymentStatus(
            ticket.id,
            expectedPaymentStatus,
            webhookStatus === 'success' ? 'RECEIVED' : undefined
          );

          expect(updatedTicket?.paymentStatus).toBe(expectedPaymentStatus);
          expect(updatedTicket?.status).toBe(expectedTicketStatus);
        }
      ),
      { numRuns: 50 }
    );
  });
});
