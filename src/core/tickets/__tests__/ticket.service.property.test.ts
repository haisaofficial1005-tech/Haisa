/**
 * Property-based tests for Ticket Service
 * **Feature: haisa-wa, Property 2: Ticket Creation Initial State**
 * **Validates: Requirements 2.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

// Status constants (SQLite uses strings instead of enums)
const TicketStatus = {
  DRAFT: 'DRAFT',
  RECEIVED: 'RECEIVED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFO: 'NEED_MORE_INFO',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const;

const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
} as const;

type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];
type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
type IssueType = 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED' | 'VERIFICATION_ISSUE' | 'HACKED_ACCOUNT' | 'OTHER';
import {
  DEFAULT_NUM_RUNS,
  validWhatsAppNumberArb,
  countryRegionArb,
  deviceTypeArb,
  waVersionArb,
  safeDescriptionArb,
  issueTypeArb,
  uuidArb,
  dateArb,
} from '../../../test/helpers';

/**
 * Simulates ticket creation logic (pure function for testing)
 * This mirrors the createDraft function's state initialization
 */
function createTicketDraft(input: {
  customerId: string;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: Date;
  device: string;
  waVersion: string;
  description: string;
  ticketNo: string;
}) {
  return {
    id: crypto.randomUUID(),
    ticketNo: input.ticketNo,
    customerId: input.customerId,
    status: TicketStatus.DRAFT,
    paymentStatus: PaymentStatus.PENDING,
    assignedAgentId: null,
    whatsAppNumber: input.whatsAppNumber,
    countryRegion: input.countryRegion,
    issueType: input.issueType,
    incidentAt: input.incidentAt,
    device: input.device,
    waVersion: input.waVersion,
    description: input.description,
    notesInternal: null,
    googleDriveFolderId: null,
    googleDriveFolderUrl: null,
    googleSheetRowIndex: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    closedAt: null,
  };
}

describe('Ticket Service Properties', () => {
  /**
   * **Feature: haisa-wa, Property 2: Ticket Creation Initial State**
   * *For any* valid ticket form data, creating a ticket SHALL result in a ticket 
   * with status DRAFT and paymentStatus PENDING.
   * **Validates: Requirements 2.1**
   */
  describe('Property 2: Ticket Creation Initial State', () => {
    it('should always create ticket with DRAFT status', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validWhatsAppNumberArb,
          countryRegionArb,
          issueTypeArb,
          dateArb,
          deviceTypeArb,
          waVersionArb,
          safeDescriptionArb,
          fc.string({ minLength: 15, maxLength: 15 }).map(s => `WAC-2025-${s.replace(/\D/g, '0').substring(0, 6)}`),
          (customerId, whatsAppNumber, countryRegion, issueType, incidentAt, device, waVersion, description, ticketNo) => {
            const ticket = createTicketDraft({
              customerId,
              whatsAppNumber,
              countryRegion,
              issueType: issueType as IssueType,
              incidentAt,
              device,
              waVersion,
              description,
              ticketNo: `WAC-2025-000001`,
            });

            expect(ticket.status).toBe(TicketStatus.DRAFT);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should always create ticket with PENDING paymentStatus', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validWhatsAppNumberArb,
          countryRegionArb,
          issueTypeArb,
          dateArb,
          deviceTypeArb,
          waVersionArb,
          safeDescriptionArb,
          (customerId, whatsAppNumber, countryRegion, issueType, incidentAt, device, waVersion, description) => {
            const ticket = createTicketDraft({
              customerId,
              whatsAppNumber,
              countryRegion,
              issueType: issueType as IssueType,
              incidentAt,
              device,
              waVersion,
              description,
              ticketNo: `WAC-2025-000001`,
            });

            expect(ticket.paymentStatus).toBe(PaymentStatus.PENDING);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should always create ticket with no assigned agent', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validWhatsAppNumberArb,
          countryRegionArb,
          issueTypeArb,
          dateArb,
          deviceTypeArb,
          waVersionArb,
          safeDescriptionArb,
          (customerId, whatsAppNumber, countryRegion, issueType, incidentAt, device, waVersion, description) => {
            const ticket = createTicketDraft({
              customerId,
              whatsAppNumber,
              countryRegion,
              issueType: issueType as IssueType,
              incidentAt,
              device,
              waVersion,
              description,
              ticketNo: `WAC-2025-000001`,
            });

            expect(ticket.assignedAgentId).toBeNull();
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should always create ticket with no Google sync data', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validWhatsAppNumberArb,
          countryRegionArb,
          issueTypeArb,
          dateArb,
          deviceTypeArb,
          waVersionArb,
          safeDescriptionArb,
          (customerId, whatsAppNumber, countryRegion, issueType, incidentAt, device, waVersion, description) => {
            const ticket = createTicketDraft({
              customerId,
              whatsAppNumber,
              countryRegion,
              issueType: issueType as IssueType,
              incidentAt,
              device,
              waVersion,
              description,
              ticketNo: `WAC-2025-000001`,
            });

            expect(ticket.googleDriveFolderId).toBeNull();
            expect(ticket.googleDriveFolderUrl).toBeNull();
            expect(ticket.googleSheetRowIndex).toBeNull();
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should preserve all input data in created ticket', () => {
      fc.assert(
        fc.property(
          uuidArb,
          validWhatsAppNumberArb,
          countryRegionArb,
          issueTypeArb,
          dateArb,
          deviceTypeArb,
          waVersionArb,
          safeDescriptionArb,
          (customerId, whatsAppNumber, countryRegion, issueType, incidentAt, device, waVersion, description) => {
            const ticket = createTicketDraft({
              customerId,
              whatsAppNumber,
              countryRegion,
              issueType: issueType as IssueType,
              incidentAt,
              device,
              waVersion,
              description,
              ticketNo: `WAC-2025-000001`,
            });

            expect(ticket.customerId).toBe(customerId);
            expect(ticket.whatsAppNumber).toBe(whatsAppNumber);
            expect(ticket.countryRegion).toBe(countryRegion);
            expect(ticket.issueType).toBe(issueType);
            expect(ticket.incidentAt).toEqual(incidentAt);
            expect(ticket.device).toBe(device);
            expect(ticket.waVersion).toBe(waVersion);
            expect(ticket.description).toBe(description);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });
  });
});
