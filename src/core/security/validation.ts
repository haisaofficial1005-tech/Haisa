/**
 * Input Validation & Sanitization
 * Secure input handling without heavy dependencies
 */

import { z } from 'zod';

// Simple HTML sanitization without external dependencies
function stripHtml(input: string): string {
  return input
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/&[^;]+;/g, '') // Remove HTML entities
    .replace(/[<>\"'&]/g, '') // Remove dangerous characters
    .trim();
}

// Validation schemas
export const phoneSchema = z.string()
  .regex(/^62\d{9,13}$/, 'Nomor WhatsApp harus format Indonesia (62xxxxxxxxx)')
  .min(11, 'Nomor WhatsApp terlalu pendek')
  .max(15, 'Nomor WhatsApp terlalu panjang');

export const nameSchema = z.string()
  .min(2, 'Nama minimal 2 karakter')
  .max(100, 'Nama maksimal 100 karakter')
  .regex(/^[a-zA-Z\s\u00C0-\u017F\u0100-\u024F\u1E00-\u1EFF]+$/, 'Nama hanya boleh huruf dan spasi');

export const emailSchema = z.string()
  .email('Format email tidak valid')
  .max(255, 'Email terlalu panjang');

export const passwordSchema = z.string()
  .min(8, 'Password minimal 8 karakter')
  .max(128, 'Password maksimal 128 karakter')
  .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password harus mengandung huruf kecil, besar, dan angka');

export const ticketDescriptionSchema = z.string()
  .min(10, 'Deskripsi minimal 10 karakter')
  .max(2000, 'Deskripsi maksimal 2000 karakter');

export const amountSchema = z.number()
  .positive('Jumlah harus positif')
  .max(100000000, 'Jumlah terlalu besar'); // 100 juta max

// Sanitization functions
export function sanitizeString(input: string): string {
  if (!input) return '';
  
  // Remove HTML tags and dangerous characters
  const cleaned = stripHtml(input);
  
  // Additional cleaning and length limit
  return cleaned.substring(0, 2000);
}

export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digits
  let cleaned = phone.replace(/[^\d]/g, '');
  
  // Convert to Indonesian format
  if (cleaned.startsWith('0')) {
    cleaned = '62' + cleaned.substring(1);
  } else if (cleaned.startsWith('8')) {
    cleaned = '62' + cleaned;
  }
  
  return cleaned;
}

export function sanitizeEmail(email: string): string {
  if (!email) return '';
  
  return email
    .toLowerCase()
    .trim()
    .replace(/[<>\"']/g, '')
    .substring(0, 255);
}

// Validation functions
export function validateLoginInput(phone: string, name?: string) {
  const sanitizedPhone = sanitizePhone(phone);
  const sanitizedName = name ? sanitizeString(name) : undefined;
  
  const phoneResult = phoneSchema.safeParse(sanitizedPhone);
  if (!phoneResult.success) {
    throw new Error(phoneResult.error.errors[0].message);
  }
  
  if (sanitizedName) {
    const nameResult = nameSchema.safeParse(sanitizedName);
    if (!nameResult.success) {
      throw new Error(nameResult.error.errors[0].message);
    }
  }
  
  return {
    phone: sanitizedPhone,
    name: sanitizedName,
  };
}

export function validatePaymentAmount(amount: number) {
  const result = amountSchema.safeParse(amount);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return amount;
}

export function validateTicketDescription(description: string) {
  const sanitized = sanitizeString(description);
  const result = ticketDescriptionSchema.safeParse(sanitized);
  if (!result.success) {
    throw new Error(result.error.errors[0].message);
  }
  return sanitized;
}

// File validation
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/jpg', 
  'image/png',
  'image/webp',
  'application/pdf'
];

export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export function validateFile(file: File) {
  if (!ALLOWED_FILE_TYPES.includes(file.type)) {
    throw new Error('Tipe file tidak diizinkan. Gunakan JPG, PNG, WEBP, atau PDF');
  }
  
  if (file.size > MAX_FILE_SIZE) {
    throw new Error('Ukuran file maksimal 5MB');
  }
  
  // Check file name
  const fileName = sanitizeString(file.name);
  if (fileName.length === 0) {
    throw new Error('Nama file tidak valid');
  }
  
  return true;
}