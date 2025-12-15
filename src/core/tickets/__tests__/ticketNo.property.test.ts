/**
 * Property-based tests for TicketNo generator
 * **Feature: haisa-wa, Property 3: TicketNo Format and Uniqueness**
 * **Validates: Requirements 2.2**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidTicketNoFormat,
  formatTicketNo,
  extractYearFromTicketNo,
  extractSequenceFromTicketNo,
} from '../ticketNo';
import { DEFAULT_NUM_RUNS } from '../../../test/helpers';

describe('TicketNo Format and Uniqueness', () => {
  /**
   * **Feature: haisa-wa, Property 3: TicketNo Format and Uniqueness**
   * *For any* created ticket, the ticketNo SHALL match the pattern `WAC-\d{4}-\d{6}` 
   * and SHALL be unique across all tickets.
   * **Validates: Requirements 2.2**
   */
  describe('Property 3: TicketNo Format', () => {
    it('should generate valid format for any year and sequence', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 999999 }),
          (year, sequence) => {
            const ticketNo = formatTicketNo(year, sequence);
            
            // Must match pattern WAC-YYYY-NNNNNN
            expect(isValidTicketNoFormat(ticketNo)).toBe(true);
            expect(ticketNo).toMatch(/^WAC-\d{4}-\d{6}$/);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should preserve year in formatted ticket number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 999999 }),
          (year, sequence) => {
            const ticketNo = formatTicketNo(year, sequence);
            const extractedYear = extractYearFromTicketNo(ticketNo);
            
            expect(extractedYear).toBe(year);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should preserve sequence in formatted ticket number', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 999999 }),
          (year, sequence) => {
            const ticketNo = formatTicketNo(year, sequence);
            const extractedSeq = extractSequenceFromTicketNo(ticketNo);
            
            expect(extractedSeq).toBe(sequence);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should pad sequence to 6 digits', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 999999 }),
          (year, sequence) => {
            const ticketNo = formatTicketNo(year, sequence);
            const seqPart = ticketNo.substring(9);
            
            expect(seqPart.length).toBe(6);
            expect(seqPart).toMatch(/^\d{6}$/);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });
  });

  describe('TicketNo Uniqueness', () => {
    it('different sequences should produce different ticket numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2099 }),
          fc.integer({ min: 1, max: 999998 }),
          (year, seq1) => {
            const seq2 = seq1 + 1;
            const ticketNo1 = formatTicketNo(year, seq1);
            const ticketNo2 = formatTicketNo(year, seq2);
            
            expect(ticketNo1).not.toBe(ticketNo2);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('different years should produce different ticket numbers', () => {
      fc.assert(
        fc.property(
          fc.integer({ min: 2020, max: 2098 }),
          fc.integer({ min: 1, max: 999999 }),
          (year1, sequence) => {
            const year2 = year1 + 1;
            const ticketNo1 = formatTicketNo(year1, sequence);
            const ticketNo2 = formatTicketNo(year2, sequence);
            
            expect(ticketNo1).not.toBe(ticketNo2);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });
  });

  describe('Format Validation', () => {
    it('should reject invalid formats', () => {
      fc.assert(
        fc.property(
          fc.oneof(
            fc.constant(''),
            fc.constant('WAC-2025'),
            fc.constant('WAC-2025-12345'),
            fc.constant('WAC-2025-1234567'),
            fc.constant('ABC-2025-123456'),
            fc.constant('WAC-25-123456'),
            fc.string({ minLength: 0, maxLength: 20 }).filter(s => !s.match(/^WAC-\d{4}-\d{6}$/))
          ),
          (invalidTicketNo) => {
            expect(isValidTicketNoFormat(invalidTicketNo)).toBe(false);
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should return null for invalid format when extracting year', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }).filter(s => !s.match(/^WAC-\d{4}-\d{6}$/)),
          (invalidTicketNo) => {
            expect(extractYearFromTicketNo(invalidTicketNo)).toBeNull();
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });

    it('should return null for invalid format when extracting sequence', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 0, maxLength: 20 }).filter(s => !s.match(/^WAC-\d{4}-\d{6}$/)),
          (invalidTicketNo) => {
            expect(extractSequenceFromTicketNo(invalidTicketNo)).toBeNull();
          }
        ),
        { numRuns: DEFAULT_NUM_RUNS }
      );
    });
  });
});
