/**
 * Google Apps Script Client
 * Requirements: 6.1, 6.3, 6.5
 */

import { getGoogleConfig } from '../config/google.config';

export interface TicketCreatedPayload {
  ticketNo: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: string;
  incidentAt: string;
  device: string;
  waVersion: string;
  status: string;
  paymentStatus: string;
  assignedAgent: string | null;
  driveFolderUrl: string | null;
  notesInternal: string | null;
  lastUpdatedAt: string;
}

export interface TicketUpdatedPayload {
  ticketNo: string;
  rowIndex: number;
  status: string;
  paymentStatus: string;
  assignedAgent: string | null;
  notesInternal: string | null;
  lastUpdatedAt: string;
}

export interface AttachUploadedPayload {
  ticketNo: string;
  fileName: string;
  driveFileUrl: string;
}

export interface GoogleSyncResult {
  folderId: string;
  folderUrl: string;
  rowIndex: number;
}

export interface AppsScriptResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Apps Script Client
 * Communicates with Google Apps Script for Sheets/Drive operations
 */
export class AppsScriptClient {
  private baseUrl: string;
  private syncSecret: string;

  constructor(baseUrl?: string, syncSecret?: string) {
    const config = getGoogleConfig();
    this.baseUrl = baseUrl || config.appsScript.baseUrl;
    this.syncSecret = syncSecret || config.appsScript.syncSecret;
  }

  /**
   * Makes a request to Apps Script endpoint
   * Requirements: 6.5 - X-SYNC-SECRET header validation
   */
  private async request<T>(
    endpoint: string,
    payload: unknown
  ): Promise<AppsScriptResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-SYNC-SECRET': this.syncSecret,
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        return {
          success: false,
          error: `HTTP ${response.status}: ${response.statusText}`,
        };
      }

      const data = await response.json();
      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  /**
   * Notifies Apps Script of a new ticket
   * Requirements: 6.1
   * 
   * Creates:
   * - Monthly folder if not exists
   * - Ticket folder
   * - Appends row to Sheets
   * 
   * Returns folderId, folderUrl, rowIndex
   */
  async ticketCreated(payload: TicketCreatedPayload): Promise<GoogleSyncResult> {
    const response = await this.request<GoogleSyncResult>(
      '/ticket-created',
      payload
    );

    if (!response.success || !response.data) {
      throw new Error(response.error || 'Failed to sync ticket creation');
    }

    return response.data;
  }

  /**
   * Notifies Apps Script of a ticket update
   * Requirements: 6.3
   * 
   * Updates the corresponding row in Sheets
   */
  async ticketUpdated(payload: TicketUpdatedPayload): Promise<void> {
    const response = await this.request('/ticket-updated', payload);

    if (!response.success) {
      throw new Error(response.error || 'Failed to sync ticket update');
    }
  }

  /**
   * Notifies Apps Script of an attachment upload
   */
  async attachUploaded(payload: AttachUploadedPayload): Promise<void> {
    const response = await this.request('/attach-uploaded', payload);

    if (!response.success) {
      throw new Error(response.error || 'Failed to sync attachment upload');
    }
  }
}

/**
 * Validates X-SYNC-SECRET header
 * Property 16: Apps Script Secret Validation
 */
export function validateSyncSecret(
  providedSecret: string | null | undefined,
  expectedSecret: string
): boolean {
  if (!providedSecret || !expectedSecret) {
    return false;
  }
  
  // Constant-time comparison to prevent timing attacks
  if (providedSecret.length !== expectedSecret.length) {
    return false;
  }
  
  let result = 0;
  for (let i = 0; i < providedSecret.length; i++) {
    result |= providedSecret.charCodeAt(i) ^ expectedSecret.charCodeAt(i);
  }
  
  return result === 0;
}

/**
 * Creates an AppsScriptClient instance
 */
export function createAppsScriptClient(
  baseUrl?: string,
  syncSecret?: string
): AppsScriptClient {
  return new AppsScriptClient(baseUrl, syncSecret);
}

/**
 * Default Apps Script client instance
 */
let defaultClient: AppsScriptClient | null = null;

export function getAppsScriptClient(): AppsScriptClient {
  if (!defaultClient) {
    defaultClient = new AppsScriptClient();
  }
  return defaultClient;
}

// Alias for backward compatibility
export const appsScriptClient = getAppsScriptClient();
