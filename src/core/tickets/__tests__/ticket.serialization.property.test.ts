/**
 * Property-based tests for Ticket Serialization
 * **Feature: haisa-wa, Property 25: Ticket Serialization Round-Trip**
 * **Validates: Requirements 13.5, 13.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { TicketStatus, PaymentStatus, IssueType } from '@prisma/client';
import {
  serializeTicket,
  deserializeTicket,
  ticketToJson,
  ticketFromJson,
  ticketsAreEquivalent,
} from '../ticket.serialization';
import type { TicketWithRelations } from '../ticket.types';
import {
  DEFAULT_NUM_RUNS,
  validWhatsAppNumberArb,
  countryRegionArb,
  deviceTypeArb,
  waVersionArb,
  safeDescriptionArb,
  issueTypeArb,
  ticketStatusArb,
  paymentStatusArb,
  uuidArb,
  dateArb,
  validEmailArb,
  validNameArb,
} from '../../../test/helpers';

// Arbitrary for generating ticket with relations
const ticketWithRelationsArb = fc.record({
  id: uuidArb,
  ticketNo: fc.tuple(
    fc.integer({ min: 2020, max: 2030 }),
    fc.integer({ min: 1, max: 999999 })
  ).map(([year, seq]) => `WAC-${year}-${seq.toString().padStart(6, '0')}`),
  customerId: uuidArb,
  status: ticketStatusArb.map(s => s as TicketStatus),
  paymentStatus: paymentStatusArb.map(s => s as PaymentStatus),
  assignedAgentId: fc.option(uuidArb, { nil: null }),
  whatsAppNumber: validWhatsAppNumberArb,
  countryRegion: countryRegionArb,
  issueType: issueTypeArb.map(s => s as IssueType),
  incidentAt: dateArb,
  device: deviceTypeArb,
  waVersion: waVersionArb,
  description: safeDescriptionArb,
  notesInternal: fc.option(fc.string({ minLength: 1, maxLength: 500 }), { nil: null }),
  googleDriveFolderId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: null }),
  googleDriveFolderUrl: fc.option(fc.webUrl(), { nil: null }),
  googleSheetRowIndex: fc.option(fc.integer({ min: 1, max: 10000 }), { nil: null }),
  createdAt: dateArb,
  updatedAt: dateArb,
  closedAt: fc.option(dateArb, { nil: null }),
  customer: fc.option(
    fc.record({
      id: uuidArb,
      email: validEmailArb,
      name: validNameArb,
    }),
    { nil: undefined }
  ),
  assignedAgent: fc.option(
    fc.record({
      id: uuidArb,
      email: validEmailArb,
      name: validNameArb,
    }),
    { nil: null }
  ),
  attachments: fc.option(
    fc.array(
      fc.record({
        id: uuidArb,
        fileName: fc.string({ minLength: 1, maxLength: 100 }),
        mimeType: fc.constantFrom('image/png', 'image/jpeg', 'image/webp'),
        size: fc.integer({ min: 1, max: 10 * 1024 * 1024 }),
        driveFileId: fc.option(fc.string({ minLength: 10, maxLength: 50 }), { nil: null }),
        driveFileUrl: fc.option(fc.webUrl(), { nil: null }),
        createdAt: dateArb,
      }),
      { minLength: 0, maxLength: 5 }
    ),
    { nil: undefined }
  ),
}) as fc.Arbitrary<TicketWithRelations>;

describe('Ticket Serialization Properties', () => {
  /**
   * **Feature: haisa-wa, Property 25: Ticket Serialization Round-Trip**
   * *For any* valid Ticket object, serializing to JSON and deserializing back 
   * SHALL produce an equivalent Ticket object.
   * **Validates: Requirements 13.5, 13.6**
   */
  describe('Property 25: Ticket Serialization Round-Trip', () => {
    it('serialize then deserialize should produce equivalent ticket', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const serialized = serializeTicket(ticket);
          const deserialized = deserializeTicket(serialized);
          
          expect(ticketsAreEquivalent(ticket, deserialized)).toBe(true);
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('ticketToJson then ticketFromJson should produce equivalent ticket', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const json = ticketToJson(ticket);
          const parsed = ticketFromJson(json);
          
          expect(ticketsAreEquivalent(ticket, parsed)).toBe(true);
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('serialized ticket should be valid JSON', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const json = ticketToJson(ticket);
          
          // Should not throw
          expect(() => JSON.parse(json)).not.toThrow();
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('serialized dates should be ISO strings', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const serialized = serializeTicket(ticket);
          
          // Check date fields are ISO strings
          expect(typeof serialized.incidentAt).toBe('string');
          expect(typeof serialized.createdAt).toBe('string');
          expect(typeof serialized.updatedAt).toBe('string');
          
          // Should be parseable as dates
          expect(new Date(serialized.incidentAt).toISOString()).toBe(serialized.incidentAt);
          expect(new Date(serialized.createdAt).toISOString()).toBe(serialized.createdAt);
          expect(new Date(serialized.updatedAt).toISOString()).toBe(serialized.updatedAt);
          
          if (serialized.closedAt) {
            expect(typeof serialized.closedAt).toBe('string');
            expect(new Date(serialized.closedAt).toISOString()).toBe(serialized.closedAt);
          }
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('deserialized dates should be Date objects', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const serialized = serializeTicket(ticket);
          const deserialized = deserializeTicket(serialized);
          
          expect(deserialized.incidentAt).toBeInstanceOf(Date);
          expect(deserialized.createdAt).toBeInstanceOf(Date);
          expect(deserialized.updatedAt).toBeInstanceOf(Date);
          
          if (deserialized.closedAt) {
            expect(deserialized.closedAt).toBeInstanceOf(Date);
          }
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('double serialization should be idempotent', () => {
      fc.assert(
        fc.property(ticketWithRelationsArb, (ticket) => {
          const json1 = ticketToJson(ticket);
          const parsed1 = ticketFromJson(json1);
          const json2 = ticketToJson(parsed1);
          
          expect(json1).toBe(json2);
        }),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });
  });
});
