/**
 * Test utilities and helpers for Haisa WA
 */

import * as fc from 'fast-check';

/**
 * Arbitrary for generating valid WhatsApp numbers in international format
 */
export const validWhatsAppNumberArb = fc.tuple(
  fc.constantFrom('+62', '+1', '+44', '+91', '+81', '+86'),
  fc.stringMatching(/^[0-9]{9,12}$/)
).map(([prefix, number]) => `${prefix}${number}`);

/**
 * Arbitrary for generating invalid WhatsApp numbers
 */
export const invalidWhatsAppNumberArb = fc.oneof(
  fc.constant(''),
  fc.constant('12345'),
  fc.constant('abc123'),
  fc.string({ minLength: 1, maxLength: 5 }),
);

/**
 * Arbitrary for generating valid email addresses
 */
export const validEmailArb = fc.emailAddress();

/**
 * Arbitrary for generating valid user names
 */
export const validNameArb = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0);

/**
 * Arbitrary for generating ticket descriptions without sensitive keywords
 */
export const safeDescriptionArb = fc.string({ minLength: 10, maxLength: 1000 })
  .filter(s => {
    const lower = s.toLowerCase();
    return !lower.includes('otp') && 
           !lower.includes('password') && 
           !lower.includes('pin') &&
           !lower.includes('verification code');
  });

/**
 * Arbitrary for generating descriptions with sensitive keywords
 */
export const sensitiveDescriptionArb = fc.oneof(
  fc.constant('Please send me the OTP code'),
  fc.constant('I forgot my password'),
  fc.constant('What is my PIN?'),
  fc.constant('Send verification code'),
  fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s} OTP ${s}`),
  fc.string({ minLength: 5, maxLength: 50 }).map(s => `${s} password ${s}`),
);


/**
 * Arbitrary for generating valid MIME types for uploads
 */
export const validMimeTypeArb = fc.constantFrom(
  'image/png',
  'image/jpeg',
  'image/webp'
);

/**
 * Arbitrary for generating invalid MIME types
 */
export const invalidMimeTypeArb = fc.constantFrom(
  'application/pdf',
  'text/plain',
  'application/javascript',
  'image/gif',
  'video/mp4',
  'application/octet-stream'
);

/**
 * Arbitrary for generating valid file sizes (under 10MB)
 */
export const validFileSizeArb = fc.integer({ min: 1, max: 10 * 1024 * 1024 - 1 });

/**
 * Arbitrary for generating invalid file sizes (over 10MB)
 */
export const invalidFileSizeArb = fc.integer({ min: 10 * 1024 * 1024, max: 100 * 1024 * 1024 });

/**
 * Arbitrary for generating country/region codes
 */
export const countryRegionArb = fc.constantFrom(
  'ID', 'US', 'GB', 'IN', 'JP', 'CN', 'SG', 'MY', 'AU', 'DE'
);

/**
 * Arbitrary for generating device types
 */
export const deviceTypeArb = fc.constantFrom(
  'iPhone 15 Pro',
  'Samsung Galaxy S24',
  'Google Pixel 8',
  'Xiaomi 14',
  'OnePlus 12'
);

/**
 * Arbitrary for generating WhatsApp versions
 */
export const waVersionArb = fc.tuple(
  fc.integer({ min: 2, max: 2 }),
  fc.integer({ min: 20, max: 25 }),
  fc.integer({ min: 1, max: 99 }),
  fc.integer({ min: 1, max: 99 })
).map(([major, minor, patch, build]) => `${major}.${minor}.${patch}.${build}`);

/**
 * Arbitrary for generating issue types
 */
export const issueTypeArb = fc.constantFrom(
  'ACCOUNT_BANNED',
  'ACCOUNT_SUSPENDED',
  'VERIFICATION_ISSUE',
  'HACKED_ACCOUNT',
  'OTHER'
);

/**
 * Arbitrary for generating ticket status
 */
export const ticketStatusArb = fc.constantFrom(
  'DRAFT',
  'RECEIVED',
  'IN_REVIEW',
  'NEED_MORE_INFO',
  'IN_PROGRESS',
  'RESOLVED',
  'CLOSED',
  'REJECTED'
);

/**
 * Arbitrary for generating payment status
 */
export const paymentStatusArb = fc.constantFrom(
  'PENDING',
  'PAID',
  'FAILED',
  'EXPIRED',
  'REFUNDED'
);

/**
 * Arbitrary for generating user roles
 */
export const userRoleArb = fc.constantFrom('CUSTOMER', 'AGENT', 'ADMIN');

/**
 * Arbitrary for generating UUIDs
 */
export const uuidArb = fc.uuid();

/**
 * Arbitrary for generating dates within a reasonable range
 */
export const dateArb = fc.date({
  min: new Date('2020-01-01T00:00:00.000Z'),
  max: new Date('2030-12-31T23:59:59.999Z'),
}).filter(d => !isNaN(d.getTime()));

/**
 * Default number of iterations for property tests
 */
export const DEFAULT_NUM_RUNS = 100;
