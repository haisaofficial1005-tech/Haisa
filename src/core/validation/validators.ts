/**
 * Input validation functions for Haisa WA
 * Requirements: 2.4, 2.5, 2.6, 3.1, 3.2, 3.3
 */

// Type alias (SQLite uses strings instead of enums)
type IssueType = string;

// ============================================================================
// Types
// ============================================================================

export interface CreateTicketInput {
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: Date;
  device: string;
  waVersion: string;
  description: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

export interface ValidationError {
  field: string;
  code: string;
  message: string;
}

export interface FileValidationInput {
  mimeType: string;
  size: number;
}

// ============================================================================
// Constants
// ============================================================================

/**
 * Sensitive keywords that should be blocked in ticket descriptions
 * Requirements: 2.5
 */
export const SENSITIVE_KEYWORDS = [
  'otp',
  'password',
  'pin',
  'verification code',
] as const;

/**
 * Allowed MIME types for file uploads
 * Requirements: 3.1
 */
export const ALLOWED_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/webp',
] as const;

/**
 * Maximum file size in bytes (10MB)
 * Requirements: 3.2
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024;

/**
 * Maximum number of attachments per ticket
 * Requirements: 3.3
 */
export const MAX_ATTACHMENTS_PER_TICKET = 5;

/**
 * Valid issue types
 */
export const VALID_ISSUE_TYPES: IssueType[] = [
  'ACCOUNT_BANNED',
  'ACCOUNT_SUSPENDED',
  'VERIFICATION_ISSUE',
  'HACKED_ACCOUNT',
  'OTHER',
];

// ============================================================================
// WhatsApp Number Validation (Requirements: 2.4)
// ============================================================================

/**
 * Validates a WhatsApp number in international format
 * Valid format: +[country code][number] where number is 7-15 digits
 * Examples: +6281234567890, +14155551234
 * 
 * @param number - The WhatsApp number to validate
 * @returns true if valid, false otherwise
 */
export function isValidWhatsAppNumber(number: string): boolean {
  if (!number || typeof number !== 'string') {
    return false;
  }

  // International format: + followed by country code (1-3 digits) and number (7-14 digits)
  // Total length: 8-17 characters including the +
  const internationalFormat = /^\+[1-9]\d{7,14}$/;
  
  return internationalFormat.test(number);
}

/**
 * Validates WhatsApp number and returns detailed error if invalid
 */
export function validateWhatsAppNumber(number: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!number || typeof number !== 'string') {
    errors.push({
      field: 'whatsAppNumber',
      code: 'INVALID_WA_NUMBER',
      message: 'WhatsApp number is required',
    });
  } else if (!isValidWhatsAppNumber(number)) {
    errors.push({
      field: 'whatsAppNumber',
      code: 'INVALID_WA_NUMBER',
      message: 'WhatsApp number must be in international format (e.g., +6281234567890)',
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Sensitive Keyword Detection (Requirements: 2.5)
// ============================================================================

/**
 * Checks if a description contains sensitive keywords
 * 
 * @param description - The text to check
 * @returns true if sensitive keywords are found, false otherwise
 */
export function containsSensitiveKeywords(description: string): boolean {
  if (!description || typeof description !== 'string') {
    return false;
  }

  const lowerDescription = description.toLowerCase();
  
  return SENSITIVE_KEYWORDS.some(keyword => lowerDescription.includes(keyword));
}

/**
 * Gets the list of sensitive keywords found in a description
 */
export function findSensitiveKeywords(description: string): string[] {
  if (!description || typeof description !== 'string') {
    return [];
  }

  const lowerDescription = description.toLowerCase();
  
  return SENSITIVE_KEYWORDS.filter(keyword => lowerDescription.includes(keyword));
}

/**
 * Validates description for sensitive keywords and returns detailed error if found
 */
export function validateDescription(description: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (containsSensitiveKeywords(description)) {
    const foundKeywords = findSensitiveKeywords(description);
    errors.push({
      field: 'description',
      code: 'SENSITIVE_CONTENT',
      message: `Description contains sensitive keywords: ${foundKeywords.join(', ')}. For security reasons, please do not include OTP, passwords, PINs, or verification codes.`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Required Fields Validation (Requirements: 2.6)
// ============================================================================

/**
 * Required fields for ticket creation
 */
export const REQUIRED_TICKET_FIELDS = [
  'whatsAppNumber',
  'countryRegion',
  'issueType',
  'incidentAt',
  'device',
  'waVersion',
  'description',
] as const;

/**
 * Checks if a value is empty (null, undefined, empty string, or whitespace only)
 */
export function isEmpty(value: unknown): boolean {
  if (value === null || value === undefined) {
    return true;
  }
  if (typeof value === 'string') {
    return value.trim().length === 0;
  }
  return false;
}

/**
 * Validates that all required fields are present and non-empty
 */
export function validateRequiredFields(input: Partial<CreateTicketInput>): ValidationResult {
  const errors: ValidationError[] = [];

  for (const field of REQUIRED_TICKET_FIELDS) {
    const value = input[field];
    
    if (isEmpty(value)) {
      errors.push({
        field,
        code: 'MISSING_REQUIRED_FIELD',
        message: `${field} is required`,
      });
    }
  }

  // Additional validation for issueType
  if (input.issueType && !VALID_ISSUE_TYPES.includes(input.issueType)) {
    errors.push({
      field: 'issueType',
      code: 'INVALID_ISSUE_TYPE',
      message: `issueType must be one of: ${VALID_ISSUE_TYPES.join(', ')}`,
    });
  }

  // Additional validation for incidentAt (must be a valid Date)
  if (input.incidentAt !== undefined && input.incidentAt !== null) {
    if (!(input.incidentAt instanceof Date) || isNaN(input.incidentAt.getTime())) {
      errors.push({
        field: 'incidentAt',
        code: 'INVALID_DATE',
        message: 'incidentAt must be a valid date',
      });
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// Complete Ticket Input Validation
// ============================================================================

/**
 * Validates complete ticket input including all requirements
 * - WhatsApp number format (2.4)
 * - Sensitive keyword blocking (2.5)
 * - Required fields (2.6)
 */
export function validateTicketInput(input: Partial<CreateTicketInput>): ValidationResult {
  const allErrors: ValidationError[] = [];

  // Validate required fields first
  const requiredResult = validateRequiredFields(input);
  allErrors.push(...requiredResult.errors);

  // Only validate format if field is present
  if (input.whatsAppNumber) {
    const waResult = validateWhatsAppNumber(input.whatsAppNumber);
    allErrors.push(...waResult.errors);
  }

  // Validate description for sensitive keywords
  if (input.description) {
    const descResult = validateDescription(input.description);
    allErrors.push(...descResult.errors);
  }

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

// ============================================================================
// File Validation (Requirements: 3.1, 3.2, 3.3)
// ============================================================================

/**
 * Validates file MIME type against allowlist
 * Requirements: 3.1
 * 
 * @param mimeType - The MIME type to validate
 * @returns true if allowed, false otherwise
 */
export function isValidMimeType(mimeType: string): boolean {
  if (!mimeType || typeof mimeType !== 'string') {
    return false;
  }
  
  return (ALLOWED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/**
 * Validates file MIME type and returns detailed error if invalid
 */
export function validateMimeType(mimeType: string): ValidationResult {
  const errors: ValidationError[] = [];

  if (!isValidMimeType(mimeType)) {
    errors.push({
      field: 'mimeType',
      code: 'INVALID_FILE_TYPE',
      message: `File type '${mimeType}' is not allowed. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates file size against maximum limit
 * Requirements: 3.2
 * 
 * @param size - File size in bytes
 * @returns true if within limit, false otherwise
 */
export function isValidFileSize(size: number): boolean {
  if (typeof size !== 'number' || isNaN(size)) {
    return false;
  }
  
  return size > 0 && size <= MAX_FILE_SIZE;
}

/**
 * Validates file size and returns detailed error if invalid
 */
export function validateFileSize(size: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (typeof size !== 'number' || isNaN(size) || size <= 0) {
    errors.push({
      field: 'size',
      code: 'INVALID_FILE_SIZE',
      message: 'File size must be a positive number',
    });
  } else if (size > MAX_FILE_SIZE) {
    const maxMB = MAX_FILE_SIZE / (1024 * 1024);
    const sizeMB = (size / (1024 * 1024)).toFixed(2);
    errors.push({
      field: 'size',
      code: 'FILE_TOO_LARGE',
      message: `File size (${sizeMB}MB) exceeds maximum limit of ${maxMB}MB`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates attachment count against maximum limit
 * Requirements: 3.3
 * 
 * @param currentCount - Current number of attachments on the ticket
 * @returns true if can add more, false otherwise
 */
export function canAddAttachment(currentCount: number): boolean {
  if (typeof currentCount !== 'number' || isNaN(currentCount) || currentCount < 0) {
    return false;
  }
  
  return currentCount < MAX_ATTACHMENTS_PER_TICKET;
}

/**
 * Validates attachment count and returns detailed error if limit reached
 */
export function validateAttachmentCount(currentCount: number): ValidationResult {
  const errors: ValidationError[] = [];

  if (!canAddAttachment(currentCount)) {
    errors.push({
      field: 'attachments',
      code: 'MAX_ATTACHMENTS',
      message: `Maximum of ${MAX_ATTACHMENTS_PER_TICKET} attachments per ticket reached`,
    });
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Validates complete file upload input
 * - MIME type (3.1)
 * - File size (3.2)
 */
export function validateFileUpload(input: FileValidationInput): ValidationResult {
  const allErrors: ValidationError[] = [];

  const mimeResult = validateMimeType(input.mimeType);
  allErrors.push(...mimeResult.errors);

  const sizeResult = validateFileSize(input.size);
  allErrors.push(...sizeResult.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}

/**
 * Validates file upload including attachment count check
 */
export function validateFileUploadWithCount(
  input: FileValidationInput,
  currentAttachmentCount: number
): ValidationResult {
  const allErrors: ValidationError[] = [];

  const fileResult = validateFileUpload(input);
  allErrors.push(...fileResult.errors);

  const countResult = validateAttachmentCount(currentAttachmentCount);
  allErrors.push(...countResult.errors);

  return {
    valid: allErrors.length === 0,
    errors: allErrors,
  };
}
