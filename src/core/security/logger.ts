/**
 * Security Logging System
 * Track security events and suspicious activities
 */

import winston from 'winston';
import { NextRequest } from 'next/server';

// Create logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: 'logs/error.log', 
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({ 
      filename: 'logs/security.log',
      level: 'warn',
      maxsize: 5242880, // 5MB
      maxFiles: 10,
    }),
    new winston.transports.File({ 
      filename: 'logs/combined.log',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    )
  }));
}

// Security event types
export enum SecurityEvent {
  LOGIN_SUCCESS = 'LOGIN_SUCCESS',
  LOGIN_FAILED = 'LOGIN_FAILED',
  LOGIN_BLOCKED = 'LOGIN_BLOCKED',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_TOKEN = 'INVALID_TOKEN',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DATA_BREACH_ATTEMPT = 'DATA_BREACH_ATTEMPT',
  FILE_UPLOAD_BLOCKED = 'FILE_UPLOAD_BLOCKED',
  PAYMENT_FRAUD_ATTEMPT = 'PAYMENT_FRAUD_ATTEMPT',
}

interface SecurityLogData {
  event: SecurityEvent;
  userId?: string;
  phone?: string;
  ip?: string;
  userAgent?: string;
  endpoint?: string;
  details?: any;
  severity?: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Extract client info from request
 */
function getClientInfo(request: NextRequest) {
  const forwarded = request.headers.get('x-forwarded-for');
  const ip = forwarded ? forwarded.split(',')[0] : 
             request.headers.get('x-real-ip') || 
             'unknown';
  
  return {
    ip,
    userAgent: request.headers.get('user-agent') || 'unknown',
    endpoint: request.nextUrl.pathname,
  };
}

/**
 * Log security events
 */
export function logSecurityEvent(data: SecurityLogData, request?: NextRequest) {
  const clientInfo = request ? getClientInfo(request) : {};
  
  const logData = {
    timestamp: new Date().toISOString(),
    ...data,
    ...clientInfo,
  };
  
  // Determine log level based on severity
  const severity = data.severity || 'medium';
  
  switch (severity) {
    case 'critical':
      logger.error('SECURITY_CRITICAL', logData);
      break;
    case 'high':
      logger.error('SECURITY_HIGH', logData);
      break;
    case 'medium':
      logger.warn('SECURITY_MEDIUM', logData);
      break;
    case 'low':
      logger.info('SECURITY_LOW', logData);
      break;
  }
  
  // Send alerts for critical events (implement email/slack notification)
  if (severity === 'critical') {
    // TODO: Implement alert system
    console.error('🚨 CRITICAL SECURITY EVENT:', logData);
  }
}

/**
 * Log successful login
 */
export function logLoginSuccess(userId: string, phone: string, request: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.LOGIN_SUCCESS,
    userId,
    phone,
    severity: 'low',
  }, request);
}

/**
 * Log failed login attempt
 */
export function logLoginFailed(phone: string, reason: string, request: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.LOGIN_FAILED,
    phone,
    details: { reason },
    severity: 'medium',
  }, request);
}

/**
 * Log rate limit exceeded
 */
export function logRateLimitExceeded(endpoint: string, request: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.RATE_LIMIT_EXCEEDED,
    details: { endpoint },
    severity: 'medium',
  }, request);
}

/**
 * Log unauthorized access attempt
 */
export function logUnauthorizedAccess(endpoint: string, userId?: string, request?: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.UNAUTHORIZED_ACCESS,
    userId,
    details: { endpoint },
    severity: 'high',
  }, request);
}

/**
 * Log suspicious activity
 */
export function logSuspiciousActivity(description: string, userId?: string, request?: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.SUSPICIOUS_ACTIVITY,
    userId,
    details: { description },
    severity: 'high',
  }, request);
}

/**
 * Log payment fraud attempt
 */
export function logPaymentFraud(details: any, userId?: string, request?: NextRequest) {
  logSecurityEvent({
    event: SecurityEvent.PAYMENT_FRAUD_ATTEMPT,
    userId,
    details,
    severity: 'critical',
  }, request);
}

export default logger;