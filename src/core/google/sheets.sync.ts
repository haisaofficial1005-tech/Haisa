/**
 * Google Sync Orchestration
 * Requirements: 5.1, 5.2, 5.3, 6.2
 */

import { prisma } from '../db';
import type { Ticket, User } from '@prisma/client';
import { getAppsScriptClient, type TicketCreatedPayload, type TicketUpdatedPayload } from './appsScript.client';
import { getMonthlyFolderName } from '../config/google.config';

export interface SyncTicketResult {
  folderId: string;
  folderUrl: string;
  rowIndex: number;
}

export interface TicketWithCustomer extends Ticket {
  customer: User;
  assignedAgent?: User | null;
}

/**
 * Google Sync Service
 * Orchestrates folder creation, row append, and file upload
 */
export class GoogleSyncService {
  /**
   * Syncs a new ticket to Google (Drive folder + Sheets row)
   * Requirements: 5.1, 5.2, 5.3, 6.2
   * 
   * Property 12: Drive Folder Path Structure
   * Property 13: Drive Folder Record Persistence
   * Property 14: Sheets Row Index Persistence
   */
  async syncNewTicket(ticket: TicketWithCustomer): Promise<SyncTicketResult> {
    const client = getAppsScriptClient();

    // Build payload for Apps Script
    const payload = this.buildTicketCreatedPayload(ticket);

    // Call Apps Script to create folder and append row
    const result = await client.ticketCreated(payload);

    // Update ticket with Google sync data
    await prisma.ticket.update({
      where: { id: ticket.id },
      data: {
        googleDriveFolderId: result.folderId,
        googleDriveFolderUrl: result.folderUrl,
        googleSheetRowIndex: result.rowIndex,
      },
    });

    return result;
  }

  /**
   * Syncs ticket updates to Google Sheets
   * Requirements: 6.3
   */
  async syncTicketUpdate(ticket: TicketWithCustomer): Promise<void> {
    if (!ticket.googleSheetRowIndex) {
      throw new Error('Ticket has not been synced to Google Sheets yet');
    }

    const client = getAppsScriptClient();

    const payload: TicketUpdatedPayload = {
      ticketNo: ticket.ticketNo,
      rowIndex: ticket.googleSheetRowIndex,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      assignedAgent: ticket.assignedAgent?.name || null,
      notesInternal: ticket.notesInternal,
      lastUpdatedAt: ticket.updatedAt.toISOString(),
    };

    await client.ticketUpdated(payload);
  }

  /**
   * Builds the payload for ticket creation sync
   * Property 15: Sheets Sync Payload Completeness
   */
  buildTicketCreatedPayload(ticket: TicketWithCustomer): TicketCreatedPayload {
    return {
      ticketNo: ticket.ticketNo,
      createdAt: ticket.createdAt.toISOString(),
      customerName: ticket.customer.name,
      customerEmail: ticket.customer.email,
      whatsAppNumber: ticket.whatsAppNumber,
      countryRegion: ticket.countryRegion,
      issueType: ticket.issueType,
      incidentAt: ticket.incidentAt.toISOString(),
      device: ticket.device,
      waVersion: ticket.waVersion,
      status: ticket.status,
      paymentStatus: ticket.paymentStatus,
      assignedAgent: ticket.assignedAgent?.name || null,
      driveFolderUrl: ticket.googleDriveFolderUrl,
      notesInternal: ticket.notesInternal,
      lastUpdatedAt: ticket.updatedAt.toISOString(),
    };
  }

  /**
   * Gets the expected folder path for a ticket
   * Property 12: Drive Folder Path Structure
   */
  getExpectedFolderPath(ticketNo: string, createdAt: Date): string {
    const monthlyFolder = getMonthlyFolderName(createdAt);
    return `${monthlyFolder}/${ticketNo}`;
  }
}

/**
 * Validates that a sync payload has all required fields
 * Property 15: Sheets Sync Payload Completeness
 */
export function validateSyncPayload(payload: TicketCreatedPayload): boolean {
  const requiredFields: (keyof TicketCreatedPayload)[] = [
    'ticketNo',
    'createdAt',
    'customerName',
    'customerEmail',
    'whatsAppNumber',
    'countryRegion',
    'issueType',
    'incidentAt',
    'device',
    'waVersion',
    'status',
    'paymentStatus',
    'lastUpdatedAt',
  ];

  for (const field of requiredFields) {
    if (payload[field] === undefined || payload[field] === null) {
      return false;
    }
  }

  return true;
}

/**
 * Validates folder path structure
 * Property 12: Drive Folder Path Structure
 */
export function validateFolderPath(
  folderPath: string,
  ticketNo: string,
  createdAt: Date
): boolean {
  const expectedMonthly = getMonthlyFolderName(createdAt);
  const expectedPath = `${expectedMonthly}/${ticketNo}`;
  
  return folderPath === expectedPath || folderPath.endsWith(`/${ticketNo}`);
}

/**
 * Creates a GoogleSyncService instance
 */
export function createGoogleSyncService(): GoogleSyncService {
  return new GoogleSyncService();
}

/**
 * Default Google sync service instance
 */
export const googleSyncService = new GoogleSyncService();
