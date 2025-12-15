/**
 * Validation module exports
 */

export {
  // Types
  type CreateTicketInput,
  type ValidationResult,
  type ValidationError,
  type FileValidationInput,
  
  // Constants
  SENSITIVE_KEYWORDS,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
  MAX_ATTACHMENTS_PER_TICKET,
  VALID_ISSUE_TYPES,
  REQUIRED_TICKET_FIELDS,
  
  // WhatsApp validation
  isValidWhatsAppNumber,
  validateWhatsAppNumber,
  
  // Sensitive keyword detection
  containsSensitiveKeywords,
  findSensitiveKeywords,
  validateDescription,
  
  // Required fields validation
  isEmpty,
  validateRequiredFields,
  
  // Complete ticket validation
  validateTicketInput,
  
  // File validation
  isValidMimeType,
  validateMimeType,
  isValidFileSize,
  validateFileSize,
  canAddAttachment,
  validateAttachmentCount,
  validateFileUpload,
  validateFileUploadWithCount,
} from './validators';
