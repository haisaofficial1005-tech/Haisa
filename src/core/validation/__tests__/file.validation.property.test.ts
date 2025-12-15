/**
 * Property-based tests for file type validation
 * 
 * **Feature: haisa-wa, Property 8: File Type Validation**
 * 
 * For any file upload with MIME type not in the allowlist (image/png, image/jpeg, image/webp),
 * the upload SHALL be rejected.
 * 
 * **Validates: Requirements 3.1**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import {
  isValidMimeType,
  validateMimeType,
  ALLOWED_MIME_TYPES,
} from '../validators';
import {
  validMimeTypeArb,
  invalidMimeTypeArb,
  DEFAULT_NUM_RUNS,
} from '@/test/helpers';

describe('File Type Validation Property Tests', () => {
  /**
   * **Feature: haisa-wa, Property 8: File Type Validation**
   * 
   * For any file upload with MIME type not in the allowlist (image/png, image/jpeg, image/webp),
   * the upload SHALL be rejected.
   * 
   * **Validates: Requirements 3.1**
   */
  it('Property 8: File Type Validation - invalid MIME types are rejected', () => {
    fc.assert(
      fc.property(invalidMimeTypeArb, (mimeType) => {
        // Invalid MIME types should be rejected
        const isValid = isValidMimeType(mimeType);
        expect(isValid).toBe(false);

        // validateMimeType should return validation errors
        const result = validateMimeType(mimeType);
        expect(result.valid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
        expect(result.errors[0].code).toBe('INVALID_FILE_TYPE');

        return true;
      }),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });

  /**
   * Property 8 (corollary): Valid MIME types are accepted
   * 
   * For any file upload with MIME type in the allowlist, the upload SHALL be accepted.
   */
  it('Property 8 (corollary): Valid MIME types are accepted', () => {
    fc.assert(
      fc.property(validMimeTypeArb, (mimeType) => {
        // Valid MIME types should be accepted
        const isValid = isValidMimeType(mimeType);
        expect(isValid).toBe(true);

        // validateMimeType should return no errors
        const result = validateMimeType(mimeType);
        expect(result.valid).toBe(true);
        expect(result.errors.length).toBe(0);

        return true;
      }),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });

  /**
   * Property 8 (exhaustive): All allowed MIME types are exactly the expected set
   * 
   * Ensures the allowlist contains exactly: image/png, image/jpeg, image/webp
   */
  it('Property 8 (exhaustive): Allowlist contains exactly the expected MIME types', () => {
    const expectedTypes = ['image/png', 'image/jpeg', 'image/webp'];
    
    // Verify allowlist matches expected types
    expect(ALLOWED_MIME_TYPES).toHaveLength(expectedTypes.length);
    expectedTypes.forEach(type => {
      expect(ALLOWED_MIME_TYPES).toContain(type);
    });

    // Verify each expected type is valid
    expectedTypes.forEach(type => {
      expect(isValidMimeType(type)).toBe(true);
    });
  });

  /**
   * Property 8 (random strings): Arbitrary strings not in allowlist are rejected
   * 
   * Tests with completely random strings to ensure robustness
   */
  it('Property 8 (random strings): Random strings not in allowlist are rejected', () => {
    fc.assert(
      fc.property(fc.string(), (randomString) => {
        // Skip if the random string happens to be a valid MIME type
        fc.pre(!ALLOWED_MIME_TYPES.includes(randomString as typeof ALLOWED_MIME_TYPES[number]));

        // Random strings should be rejected
        const isValid = isValidMimeType(randomString);
        expect(isValid).toBe(false);

        return true;
      }),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });

  /**
   * Property 8 (edge cases): Empty and null-like values are rejected
   */
  it('Property 8 (edge cases): Empty and null-like values are rejected', () => {
    const edgeCases = ['', ' ', null, undefined];
    
    edgeCases.forEach(value => {
      const isValid = isValidMimeType(value as string);
      expect(isValid).toBe(false);
    });
  });
});
