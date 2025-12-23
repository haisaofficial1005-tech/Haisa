/**
 * Google Drive Upload Utilities
 * Enhanced security with file validation
 */

import { validateFile } from '@/core/security/validation';
import { logSuspiciousActivity } from '@/core/security/logger';

/**
 * Upload file to Google Drive via Apps Script with security checks
 */
export async function uploadToGoogleDrive(
  file: File,
  fileName: string,
  folderId?: string,
  userId?: string
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    // Validate file before upload
    try {
      validateFile(file);
    } catch (error) {
      logSuspiciousActivity(`File upload blocked: ${error.message}`, userId);
      return { success: false, error: error.message };
    }

    const syncUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const syncSecret = process.env.GOOGLE_SYNC_SECRET;
    
    if (!syncUrl || !syncSecret) {
      return { success: false, error: 'Google Drive not configured' };
    }

    // Convert file to base64 with size check
    const arrayBuffer = await file.arrayBuffer();
    if (arrayBuffer.byteLength > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: 'File size exceeds 5MB limit' };
    }

    const base64 = Buffer.from(arrayBuffer).toString('base64');

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const response = await fetch(`${syncUrl}?secret=${syncSecret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload-file',
        data: {
          fileName: sanitizedFileName,
          mimeType: file.type,
          fileData: base64,
          folderId: folderId || undefined,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Drive upload failed:', errorText);
      return { success: false, error: 'Upload failed' };
    }

    const result = await response.json();
    return {
      success: true,
      fileId: result.fileId,
      fileUrl: result.fileUrl,
    };
  } catch (error) {
    console.error('Drive upload error:', error);
    logSuspiciousActivity(`File upload error: ${error instanceof Error ? error.message : 'Unknown'}`, userId);
    return { success: false, error: 'Upload error' };
  }
}

/**
 * Upload base64 image to Google Drive via Apps Script with security checks
 */
export async function uploadBase64ToGoogleDrive(
  base64Data: string,
  fileName: string,
  mimeType: string,
  folderId?: string,
  userId?: string
): Promise<{ success: boolean; fileId?: string; fileUrl?: string; error?: string }> {
  try {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'application/pdf'];
    if (!allowedTypes.includes(mimeType)) {
      logSuspiciousActivity(`Invalid file type upload attempt: ${mimeType}`, userId);
      return { success: false, error: 'File type not allowed' };
    }

    // Check base64 size (approximate file size)
    const sizeInBytes = (base64Data.length * 3) / 4;
    if (sizeInBytes > 5 * 1024 * 1024) { // 5MB limit
      return { success: false, error: 'File size exceeds 5MB limit' };
    }

    const syncUrl = process.env.GOOGLE_APPS_SCRIPT_URL;
    const syncSecret = process.env.GOOGLE_SYNC_SECRET;
    
    if (!syncUrl || !syncSecret) {
      return { success: false, error: 'Google Drive not configured' };
    }

    // Sanitize filename
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');

    const response = await fetch(`${syncUrl}?secret=${syncSecret}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'upload-file',
        data: {
          fileName: sanitizedFileName,
          mimeType,
          fileData: base64Data,
          folderId: folderId || undefined,
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Drive upload failed:', errorText);
      return { success: false, error: 'Upload failed' };
    }

    const result = await response.json();
    return {
      success: true,
      fileId: result.fileId,
      fileUrl: result.fileUrl,
    };
  } catch (error) {
    console.error('Drive upload error:', error);
    logSuspiciousActivity(`Base64 upload error: ${error instanceof Error ? error.message : 'Unknown'}`, userId);
    return { success: false, error: 'Upload error' };
  }
}