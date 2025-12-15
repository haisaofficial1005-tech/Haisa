/**
 * Apps Script Client Property Tests
 * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
 * **Validates: Requirements 6.5**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';

/**
 * Validates X-SYNC-SECRET header
 * Property 16: Apps Script Secret Validation
 */
function validateSyncSecret(
  providedSecret: string | null | undefined,
  expectedSecret: string
): boolean {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < providedSecret.length; i++) {
    result |= providedSecret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  
  return result === 0;
}

// Arbitraries
const secretArb = fc.string({ minLength: 16, maxLength: 64 }).filter(s => s.length > 0);
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 100 });

describe('Apps Script Secret Validation', () => {
  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16a: Valid secrets pass validation
   * *For any* valid secret, providing the same secret SHALL pass validation
   */
  it('Property 16a: valid secrets pass validation', () => {
    fc.assert(
      fc.property(secretArb, (secret) => {
        const result = validateSyncSecret(secret, secret);
        expect(result).toBe(true);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16b: Different secrets fail validation
   * *For any* two different secrets, validation SHALL fail
   */
  it('Property 16b: different secrets fail validation', () => {
    fc.assert(
      fc.property(
        secretArb,
        secretArb.filter(s => s.length > 0),
        (secret1, secret2) => {
          fc.pre(secret1 !== secret2);
          const result = validateSyncSecret(secret1, secret2);
          expect(result).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16c: Null provided secret fails validation
   * *For any* expected secret, providing null SHALL fail validation
   */
  it('Property 16c: null provided secret fails validation', () => {
    fc.assert(
      fc.property(secretArb, (expectedSecret) => {
        const result = validateSyncSecret(null, expectedSecret);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16d: Undefined provided secret fails validation
   * *For any* expected secret, providing undefined SHALL fail validation
   */
  it('Property 16d: undefined provided secret fails validation', () => {
    fc.assert(
      fc.property(secretArb, (expectedSecret) => {
        const result = validateSyncSecret(undefined, expectedSecret);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16e: Empty expected secret fails validation
   * *For any* provided secret, empty expected secret SHALL fail validation
   */
  it('Property 16e: empty expected secret fails validation', () => {
    fc.assert(
      fc.property(nonEmptyStringArb, (providedSecret) => {
        const result = validateSyncSecret(providedSecret, '');
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16f: Empty provided secret fails validation
   * *For any* expected secret, empty provided secret SHALL fail validation
   */
  it('Property 16f: empty provided secret fails validation', () => {
    fc.assert(
      fc.property(secretArb, (expectedSecret) => {
        const result = validateSyncSecret('', expectedSecret);
        expect(result).toBe(false);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16g: Validation is deterministic
   * *For any* pair of secrets, calling validation multiple times
   * SHALL return the same result
   */
  it('Property 16g: validation is deterministic', () => {
    fc.assert(
      fc.property(
        fc.oneof(secretArb, fc.constant(null), fc.constant(undefined), fc.constant('')),
        secretArb,
        (provided, expected) => {
          const result1 = validateSyncSecret(provided, expected);
          const result2 = validateSyncSecret(provided, expected);
          const result3 = validateSyncSecret(provided, expected);
          
          expect(result1).toBe(result2);
          expect(result2).toBe(result3);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16h: Secrets with different lengths fail validation
   * *For any* two secrets with different lengths, validation SHALL fail
   */
  it('Property 16h: secrets with different lengths fail validation', () => {
    fc.assert(
      fc.property(
        fc.string({ minLength: 10, maxLength: 20 }),
        fc.string({ minLength: 21, maxLength: 40 }),
        (short, long) => {
          fc.pre(short.length !== long.length);
          
          const result1 = validateSyncSecret(short, long);
          const result2 = validateSyncSecret(long, short);
          
          expect(result1).toBe(false);
          expect(result2).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 16: Apps Script Secret Validation**
   * 
   * Property 16i: Validation is symmetric for matching secrets
   * *For any* secret, validation(a, b) === validation(b, a) when a === b
   */
  it('Property 16i: validation is symmetric for matching secrets', () => {
    fc.assert(
      fc.property(secretArb, (secret) => {
        const result1 = validateSyncSecret(secret, secret);
        const result2 = validateSyncSecret(secret, secret);
        
        expect(result1).toBe(result2);
        expect(result1).toBe(true);
      }),
      { numRuns: 100 }
    );
  });
});
