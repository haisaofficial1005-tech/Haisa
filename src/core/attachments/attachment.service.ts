/**
 * Attachment Service
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */

import { prisma } from '../db';
import type { Attachment, Ticket } from '@prisma/client';
import { createDriveClient, type DriveFile } from '../google/drive.client';
import { validateMimeType, validateFileSize, MAX_FILE_SIZE, ALLOWED_MIME_TYPES } from '../validation/validators';

export interface AddAttachmentParams {
  ticketId: string;
  uploaderId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface AttachmentResult {
  attachment: Attachment;
  driveFile?: DriveFile;
}

export const MAX_ATTACHMENTS_PER_TICKET = 5;

/**
 * Attachment Service
 * Handles file uploads and Drive integration
 */
export class AttachmentService {
  /**
   * Adds an attachment to a ticket
   * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
   */
  async addAttachment(params: AddAttachmentParams): Promise<AttachmentResult> {
    const { ticketId, uploaderId, file, fileName, mimeType } = params;

    // Validate file type (Property 8: File Type Validation)
    if (!validateMimeType(mimeType)) {
      throw new Error(`INVALID_FILE_TYPE: Allowed types are ${ALLOWED_MIME_TYPES.join(', ')}`);
    }

    // Validate file size
    if (!validateFileSize(file.length)) {
      throw new Error(`FILE_TOO_LARGE: Maximum size is ${MAX_FILE_SIZE / (1024 * 1024)}MB`);
    }

    // Get ticket and validate
    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { attachments: true },
    });

    if (!ticket) {
      throw new Error('TICKET_NOT_FOUND');
    }

    // Validate attachment count
    if (ticket.attachments.length >= MAX_ATTACHMENTS_PER_TICKET) {
      throw new Error(`MAX_ATTACHMENTS: Maximum ${MAX_ATTACHMENTS_PER_TICKET} attachments per ticket`);
    }

    // Create attachment record first
    let attachment = await prisma.attachment.create({
      data: {
        ticketId,
        uploaderId,
        fileName,
        mimeType,
        size: file.length,
      },
    });

    // If ticket is PAID and has Drive folder, upload to Drive
    // Property 9: Drive Upload Persistence
    let driveFile: DriveFile | undefined;
    
    if (ticket.paymentStatus === 'PAID' && ticket.googleDriveFolderId) {
      try {
        const driveClient = createDriveClient();
        driveFile = await driveClient.uploadFile({
          folderId: ticket.googleDriveFolderId,
          file,
          fileName,
          mimeType,
        });

        // Update attachment with Drive info
        attachment = await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            driveFileId: driveFile.id,
            driveFileUrl: driveFile.url,
          },
        });
      } catch (error) {
        // Log error but don't fail - attachment is still created locally
        console.error('Failed to upload to Drive:', error);
      }
    }

    return { attachment, driveFile };
  }

  /**
   * Gets attachments for a ticket
   */
  async getByTicket(ticketId: string): Promise<Attachment[]> {
    return prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
    });
  }

  /**
   * Gets a single attachment by ID
   */
  async getById(attachmentId: string): Promise<Attachment | null> {
    return prisma.attachment.findUnique({
      where: { id: attachmentId },
    });
  }

  /**
   * Deletes an attachment
   */
  async delete(attachmentId: string): Promise<void> {
    const attachment = await prisma.attachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new Error('ATTACHMENT_NOT_FOUND');
    }

    // Delete from Drive if uploaded
    if (attachment.driveFileId) {
      try {
        const driveClient = createDriveClient();
        await driveClient.deleteFile(attachment.driveFileId);
      } catch (error) {
        console.error('Failed to delete from Drive:', error);
      }
    }

    // Delete from database
    await prisma.attachment.delete({
      where: { id: attachmentId },
    });
  }

  /**
   * Uploads pending attachments to Drive after payment
   * Called when ticket payment is confirmed
   * Returns array of uploaded attachment URLs
   */
  async uploadPendingToDrive(ticket: Ticket & { attachments: Attachment[] }): Promise<string[]> {
    if (!ticket.googleDriveFolderId) {
      throw new Error('Ticket has no Drive folder');
    }

    const driveClient = createDriveClient();
    const uploadedUrls: string[] = [];

    for (const attachment of ticket.attachments) {
      // Skip if already uploaded
      if (attachment.driveFileId) {
        if (attachment.driveFileUrl) {
          uploadedUrls.push(attachment.driveFileUrl);
        }
        continue;
      }

      // Skip if no file data stored
      if (!attachment.fileData) {
        console.warn(`Attachment ${attachment.id} has no file data to upload`);
        continue;
      }

      try {
        // Convert base64 back to buffer
        const fileBuffer = Buffer.from(attachment.fileData, 'base64');

        // Upload to Drive
        const driveFile = await driveClient.uploadFile({
          folderId: ticket.googleDriveFolderId,
          file: fileBuffer,
          fileName: attachment.fileName,
          mimeType: attachment.mimeType,
        });

        // Update attachment with Drive info and clear fileData
        await prisma.attachment.update({
          where: { id: attachment.id },
          data: {
            driveFileId: driveFile.id,
            driveFileUrl: driveFile.url,
            fileData: null, // Clear temporary file data after successful upload
          },
        });

        uploadedUrls.push(driveFile.url);
        console.log(`Uploaded attachment ${attachment.id} to Drive: ${driveFile.url}`);
      } catch (error) {
        console.error(`Failed to upload attachment ${attachment.id} to Drive:`, error);
        // Continue with other attachments even if one fails
      }
    }

    return uploadedUrls;
  }

  /**
   * Validates if an attachment can be added to a ticket
   */
  canAddAttachment(ticket: { attachments: { length: number } }): boolean {
    return ticket.attachments.length < MAX_ATTACHMENTS_PER_TICKET;
  }
}

/**
 * Creates an AttachmentService instance
 */
export function createAttachmentService(): AttachmentService {
  return new AttachmentService();
}

/**
 * Default attachment service instance
 */
export const attachmentService = new AttachmentService();
