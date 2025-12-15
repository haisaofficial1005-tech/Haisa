/**
 * Error Handling Module
 * Requirements: Error Handling section
 */

import { NextResponse } from 'next/server';

/**
 * Application error codes
 */
export const ErrorCodes = {
  // Input Validation Errors
  INVALID_WA_NUMBER: 'INVALID_WA_NUMBER',
  SENSITIVE_CONTENT: 'SENSITIVE_CONTENT',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_FILE_TYPE: 'INVALID_FILE_TYPE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  MAX_ATTACHMENTS: 'MAX_ATTACHMENTS',

  // Authentication/Authorization Errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  INVALID_SYNC_SECRET: 'INVALID_SYNC_SECRET',

  // Business Logic Errors
  TICKET_NOT_FOUND: 'TICKET_NOT_FOUND',
  PAYMENT_NOT_PAID: 'PAYMENT_NOT_PAID',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  ALREADY_PAID: 'ALREADY_PAID',
  INVALID_AGENT: 'INVALID_AGENT',

  // External Service Errors
  PAYMENT_GATEWAY_ERROR: 'PAYMENT_GATEWAY_ERROR',
  GOOGLE_SYNC_ERROR: 'GOOGLE_SYNC_ERROR',
  WHATSAPP_SEND_ERROR: 'WHATSAPP_SEND_ERROR',

  // Generic Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

/**
 * HTTP status codes for each error code
 */
const errorStatusCodes: Record<ErrorCode, number> = {
  // 400 Bad Request
  [ErrorCodes.INVALID_WA_NUMBER]: 400,
  [ErrorCodes.SENSITIVE_CONTENT]: 400,
  [ErrorCodes.MISSING_REQUIRED_FIELD]: 400,
  [ErrorCodes.INVALID_FILE_TYPE]: 400,
  [ErrorCodes.FILE_TOO_LARGE]: 400,
  [ErrorCodes.MAX_ATTACHMENTS]: 400,
  [ErrorCodes.INVALID_STATUS_TRANSITION]: 400,
  [ErrorCodes.INVALID_AGENT]: 400,
  [ErrorCodes.VALIDATION_ERROR]: 400,

  // 401 Unauthorized
  [ErrorCodes.UNAUTHORIZED]: 401,
  [ErrorCodes.INVALID_SYNC_SECRET]: 401,

  // 402 Payment Required
  [ErrorCodes.PAYMENT_NOT_PAID]: 402,

  // 403 Forbidden
  [ErrorCodes.FORBIDDEN]: 403,

  // 404 Not Found
  [ErrorCodes.TICKET_NOT_FOUND]: 404,

  // 409 Conflict
  [ErrorCodes.ALREADY_PAID]: 409,

  // 429 Too Many Requests
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: 429,

  // 500 Internal Server Error
  [ErrorCodes.INTERNAL_ERROR]: 500,

  // 503 Service Unavailable
  [ErrorCodes.PAYMENT_GATEWAY_ERROR]: 503,
  [ErrorCodes.GOOGLE_SYNC_ERROR]: 503,
  [ErrorCodes.WHATSAPP_SEND_ERROR]: 503,
};

/**
 * Application Error class
 */
export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = errorStatusCodes[code] || 500;
    this.details = details;
  }

  toJSON() {
    return {
      error: this.code,
      message: this.message,
      ...(this.details && { details: this.details }),
    };
  }
}

/**
 * Create an error response
 */
export function createErrorResponse(error: AppError): NextResponse {
  return NextResponse.json(error.toJSON(), { status: error.statusCode });
}

/**
 * Handle unknown errors and convert to AppError
 */
export function handleError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // Log the original error
    console.error('Unhandled error:', error);

    // Check for known error patterns
    if (error.message.includes('Access denied')) {
      return new AppError(ErrorCodes.FORBIDDEN, error.message);
    }

    if (error.message.includes('not found')) {
      return new AppError(ErrorCodes.TICKET_NOT_FOUND, error.message);
    }

    if (error.message.includes('Invalid status transition')) {
      return new AppError(ErrorCodes.INVALID_STATUS_TRANSITION, error.message);
    }

    return new AppError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred');
  }

  return new AppError(ErrorCodes.INTERNAL_ERROR, 'An unexpected error occurred');
}

/**
 * Error handler wrapper for API routes
 */
export function withErrorHandler<T>(
  handler: () => Promise<T>
): Promise<T | NextResponse> {
  return handler().catch((error) => {
    const appError = handleError(error);
    return createErrorResponse(appError);
  });
}

/**
 * Validation error helper
 */
export function validationError(
  message: string,
  fields?: string[]
): AppError {
  return new AppError(
    ErrorCodes.VALIDATION_ERROR,
    message,
    fields ? { fields } : undefined
  );
}

/**
 * Not found error helper
 */
export function notFoundError(resource: string): AppError {
  return new AppError(
    ErrorCodes.TICKET_NOT_FOUND,
    `${resource} not found`
  );
}

/**
 * Unauthorized error helper
 */
export function unauthorizedError(message: string = 'Unauthorized'): AppError {
  return new AppError(ErrorCodes.UNAUTHORIZED, message);
}

/**
 * Forbidden error helper
 */
export function forbiddenError(message: string = 'Forbidden'): AppError {
  return new AppError(ErrorCodes.FORBIDDEN, message);
}
