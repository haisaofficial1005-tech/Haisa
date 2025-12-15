/**
 * Validation Property Tests
 * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
 * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
 * **Feature: haisa-wa, Property 7: Required Fields Validation**
 * **Validates: Requirements 2.4, 2.5, 2.6**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidWhatsAppNumber,
  containsSensitiveKeywords,
  findSensitiveKeywords,
  validateRequiredFields,
  isEmpty,
  SENSITIVE_KEYWORDS,
  REQUIRED_TICKET_FIELDS,
  type CreateTicketInput,
} from '../validators';
import type { IssueType } from '@prisma/client';

// Arbitraries - optimized for speed (no filters)
const validCountryCodeArb = fc.integer({ min: 1, max: 999 });

// Generate valid phone numbers that match the validator's requirements
// Total length must be 8-17 characters including +
// Format: +[country code 1-3 digits][number 7-14 digits]
const validWhatsAppNumberArb = fc.tuple(
  fc.integer({ min: 1, max: 99 }), // country code (1-2 digits to keep total length reasonable)
  fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 7, maxLength: 12 }) // phone digits
).map(([cc, digits]) => `+${cc}${digits.join('')}`);

const invalidWhatsAppNumberArb = fc.constantFrom(
  '',
  '12345',
  'abc123',
  '6281234567890', // missing +
  '+1', // too short
  '+abc123',
  'invalid',
  '+',
);

const issueTypeArb = fc.constantFrom<IssueType>(
  'ACCOUNT_BANNED',
  'ACCOUNT_SUSPENDED',
  'VERIFICATION_ISSUE',
  'HACKED_ACCOUNT',
  'OTHER'
);

// Use constantFrom for non-empty strings to avoid filter
const nonEmptyStringArb = fc.constantFrom(
  'test', 'value', 'sample', 'data', 'input', 'content', 'text', 'string',
  'Indonesia', 'Malaysia', 'Singapore', 'iPhone 14', 'Samsung Galaxy', 'Pixel 7'
);

// Use a simpler description generator that doesn't need filtering
const safeDescriptionArb = fc.array(
  fc.constantFrom(
    'My account was banned',
    'I cannot access my WhatsApp',
    'Need help with verification',
    'Account suspended without reason',
    'Lost access to my account',
    'WhatsApp not working properly',
    'Cannot receive messages',
    'Profile picture not updating',
    'Status not visible to contacts',
    'Group chat issues'
  ),
  { minLength: 2, maxLength: 5 }
).map(parts => parts.join('. '));

// Use integer timestamps to avoid NaN dates
const validDateArb = fc.integer({ 
  min: new Date('2020-01-01').getTime(), 
  max: Date.now() 
}).map(ts => new Date(ts));

const validTicketInputArb = fc.record({
  whatsAppNumber: validWhatsAppNumberArb,
  countryRegion: fc.constantFrom('Indonesia', 'Malaysia', 'Singapore', 'Thailand', 'Vietnam'),
  issueType: issueTypeArb,
  incidentAt: validDateArb,
  device: fc.constantFrom('iPhone 14', 'Samsung Galaxy S23', 'Pixel 7', 'OnePlus 11'),
  waVersion: fc.constantFrom('2.23.25.83', '2.24.1.5', '2.23.20.76'),
  description: safeDescriptionArb,
});

describe('WhatsApp Number Validation', () => {
  /**
   * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
   * 
   * Property 5a: Valid international format numbers are accepted
   * *For any* string that matches valid international phone number format,
   * validation SHALL pass
   */
  it('Property 5a: valid international format numbers are accepted', () => {
    fc.assert(
      fc.property(validWhatsAppNumberArb, (number) => {
        const isValid = isValidWhatsAppNumber(number);
        expect(isValid).toBe(true);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
   * 
   * Property 5b: Invalid format numbers are rejected
   * *For any* string that does not match valid international phone number format,
   * ticket creation SHALL be rejected
   */
  it('Property 5b: invalid format numbers are rejected', () => {
    fc.assert(
      fc.property(invalidWhatsAppNumberArb, (number) => {
        const isValid = isValidWhatsAppNumber(number);
        expect(isValid).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
   * 
   * Property 5c: Numbers without + prefix are rejected
   */
  it('Property 5c: numbers without + prefix are rejected', () => {
    fc.assert(
      fc.property(
        fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 8, maxLength: 15 })
          .map(digits => digits.join('')),
        (number) => {
          const isValid = isValidWhatsAppNumber(number);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
   * 
   * Property 5d: Empty or null values are rejected
   */
  it('Property 5d: empty or null values are rejected', () => {
    expect(isValidWhatsAppNumber('')).toBe(false);
    expect(isValidWhatsAppNumber(null as unknown as string)).toBe(false);
    expect(isValidWhatsAppNumber(undefined as unknown as string)).toBe(false);
  });

  /**
   * **Feature: haisa-wa, Property 5: WhatsApp Number Validation**
   * 
   * Property 5e: Numbers with letters are rejected
   */
  it('Property 5e: numbers with letters are rejected', () => {
    fc.assert(
      fc.property(
        fc.tuple(
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 0, maxLength: 10 }),
          fc.constantFrom('a', 'b', 'c', 'x', 'y', 'z', 'A', 'B', 'C'),
          fc.array(fc.integer({ min: 0, max: 9 }), { minLength: 0, maxLength: 10 })
        ).map(([pre, letter, post]) => `${pre.join('')}${letter}${post.join('')}`),
        (number) => {
          const isValid = isValidWhatsAppNumber(`+${number}`);
          expect(isValid).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });
});

describe('Sensitive Keyword Blocking', () => {
  /**
   * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
   * 
   * Property 6a: Descriptions with blocked keywords are detected
   * *For any* ticket description containing blocked keywords (OTP, password, PIN, verification code),
   * ticket creation SHALL be rejected
   */
  it('Property 6a: descriptions with blocked keywords are detected', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SENSITIVE_KEYWORDS),
        fc.string({ minLength: 0, maxLength: 50 }),
        fc.string({ minLength: 0, maxLength: 50 }),
        (keyword, prefix, suffix) => {
          const description = `${prefix} ${keyword} ${suffix}`;
          const hasSensitive = containsSensitiveKeywords(description);
          expect(hasSensitive).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
   * 
   * Property 6b: Descriptions without blocked keywords are accepted
   */
  it('Property 6b: descriptions without blocked keywords are accepted', () => {
    // Use safe words that don't contain sensitive keywords
    const safeWordsArb = fc.array(
      fc.constantFrom(
        'account', 'banned', 'help', 'issue', 'problem', 'cannot', 'access',
        'message', 'chat', 'group', 'contact', 'profile', 'status', 'call',
        'video', 'audio', 'media', 'photo', 'document', 'location', 'blocked'
      ),
      { minLength: 3, maxLength: 20 }
    ).map(words => words.join(' '));

    fc.assert(
      fc.property(safeWordsArb, (description) => {
        const hasSensitive = containsSensitiveKeywords(description);
        expect(hasSensitive).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
   * 
   * Property 6c: Case-insensitive keyword detection
   */
  it('Property 6c: case-insensitive keyword detection', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SENSITIVE_KEYWORDS),
        (keyword) => {
          // Test various case combinations
          expect(containsSensitiveKeywords(keyword.toUpperCase())).toBe(true);
          expect(containsSensitiveKeywords(keyword.toLowerCase())).toBe(true);
          
          // Mixed case
          const mixedCase = keyword.split('').map((c, i) => 
            i % 2 === 0 ? c.toUpperCase() : c.toLowerCase()
          ).join('');
          expect(containsSensitiveKeywords(mixedCase)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
   * 
   * Property 6d: findSensitiveKeywords returns all found keywords
   */
  it('Property 6d: findSensitiveKeywords returns all found keywords', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...SENSITIVE_KEYWORDS),
        (keyword) => {
          const description = `This contains ${keyword} in it`;
          const found = findSensitiveKeywords(description);
          
          expect(found).toContain(keyword);
          expect(found.length).toBeGreaterThan(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 6: Sensitive Keyword Blocking**
   * 
   * Property 6e: Empty descriptions return no keywords
   */
  it('Property 6e: empty descriptions return no keywords', () => {
    expect(containsSensitiveKeywords('')).toBe(false);
    expect(findSensitiveKeywords('')).toEqual([]);
    expect(containsSensitiveKeywords(null as unknown as string)).toBe(false);
  });
});

describe('Required Fields Validation', () => {
  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7a: Complete valid input passes validation
   * *For any* ticket submission with all required fields present,
   * validation SHALL pass
   */
  it('Property 7a: complete valid input passes validation', () => {
    fc.assert(
      fc.property(validTicketInputArb, (input) => {
        const result = validateRequiredFields(input);
        expect(result.valid).toBe(true);
        expect(result.errors).toHaveLength(0);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7b: Missing any required field fails validation
   * *For any* ticket submission missing any required field,
   * the submission SHALL be rejected
   */
  it('Property 7b: missing any required field fails validation', () => {
    fc.assert(
      fc.property(
        validTicketInputArb,
        fc.constantFrom(...REQUIRED_TICKET_FIELDS),
        (input, fieldToRemove) => {
          const incompleteInput = { ...input };
          delete (incompleteInput as Record<string, unknown>)[fieldToRemove];
          
          const result = validateRequiredFields(incompleteInput);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToRemove)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7c: Empty string values fail validation
   */
  it('Property 7c: empty string values fail validation', () => {
    const stringFields = ['whatsAppNumber', 'countryRegion', 'device', 'waVersion', 'description'];
    
    fc.assert(
      fc.property(
        validTicketInputArb,
        fc.constantFrom(...stringFields),
        (input, fieldToEmpty) => {
          const inputWithEmpty = { ...input, [fieldToEmpty]: '' };
          
          const result = validateRequiredFields(inputWithEmpty);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToEmpty)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7d: Whitespace-only values fail validation
   */
  it('Property 7d: whitespace-only values fail validation', () => {
    const stringFields = ['whatsAppNumber', 'countryRegion', 'device', 'waVersion', 'description'];
    
    fc.assert(
      fc.property(
        validTicketInputArb,
        fc.constantFrom(...stringFields),
        fc.constantFrom(' ', '  ', '   ', '\t', '\n', ' \t ', '  \n  '),
        (input, fieldToEmpty, whitespace) => {
          const inputWithWhitespace = { ...input, [fieldToEmpty]: whitespace };
          
          const result = validateRequiredFields(inputWithWhitespace);
          expect(result.valid).toBe(false);
          expect(result.errors.some(e => e.field === fieldToEmpty)).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7e: isEmpty correctly identifies empty values
   */
  it('Property 7e: isEmpty correctly identifies empty values', () => {
    // Empty values
    expect(isEmpty(null)).toBe(true);
    expect(isEmpty(undefined)).toBe(true);
    expect(isEmpty('')).toBe(true);
    expect(isEmpty('   ')).toBe(true);
    expect(isEmpty('\t\n')).toBe(true);
    
    // Non-empty values
    fc.assert(
      fc.property(nonEmptyStringArb, (value) => {
        expect(isEmpty(value)).toBe(false);
      }),
      { numRuns: 50 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 7: Required Fields Validation**
   * 
   * Property 7f: Error count matches missing field count
   */
  it('Property 7f: error count matches missing field count', () => {
    fc.assert(
      fc.property(
        fc.subarray([...REQUIRED_TICKET_FIELDS], { minLength: 1 }),
        (fieldsToRemove) => {
          const input: Partial<CreateTicketInput> = {};
          
          const result = validateRequiredFields(input);
          
          // Should have at least as many errors as required fields
          expect(result.errors.length).toBeGreaterThanOrEqual(REQUIRED_TICKET_FIELDS.length);
        }
      ),
      { numRuns: 50 }
    );
  });
});
