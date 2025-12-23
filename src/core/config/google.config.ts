/**
 * Google Configuration Settings
 * Requirements: 5.5
 */

import { getGoogleEnv, type GoogleEnvConfig } from './google.env';

export interface GoogleDriveConfig {
  rootFolderId: string;
  folderNameFormat: string; // e.g., 'YYYY-MM' for monthly folders
}

export interface GoogleSheetsConfig {
  spreadsheetId: string;
  sheetName: string;
  columns: string[];
}

export interface GoogleAppsScriptConfig {
  baseUrl: string;
  syncSecret: string;
  endpoints: {
    ticketCreated: string;
    ticketUpdated: string;
    attachUploaded: string;
  };
}

export interface GoogleServiceAccountConfig {
  email: string;
  privateKey: string;
}

export interface GoogleConfig {
  oauth: {
    clientId: string;
    clientSecret: string;
  };
  serviceAccount: GoogleServiceAccountConfig;
  drive: GoogleDriveConfig;
  sheets: GoogleSheetsConfig;
  appsScript: GoogleAppsScriptConfig;
}

/**
 * Default sheet columns for ticket data
 * Requirements: 6.4
 */
export const DEFAULT_SHEET_COLUMNS = [
  'TicketNo',
  'CreatedAt',
  'CustomerName',
  'CustomerEmail',
  'WhatsAppNumber',
  'CountryRegion',
  'IssueType',
  'IncidentAt',
  'Device',
  'WhatsAppVersion',
  'Status',
  'PaymentStatus',
  'AssignedAgent',
  'DriveFolderUrl',
  'AttachmentUrls',
  'NotesInternal',
  'LastUpdatedAt',
];

/**
 * Creates Google configuration from environment
 */
export function createGoogleConfig(env?: GoogleEnvConfig): GoogleConfig {
  const googleEnv = env || getGoogleEnv();

  return {
    oauth: {
      clientId: googleEnv.clientId,
      clientSecret: googleEnv.clientSecret,
    },
    serviceAccount: {
      email: googleEnv.serviceAccountEmail,
      privateKey: googleEnv.serviceAccountPrivateKey,
    },
    drive: {
      rootFolderId: googleEnv.driveRootFolderId,
      folderNameFormat: 'YYYY-MM',
    },
    sheets: {
      spreadsheetId: process.env.GOOGLE_SPREADSHEET_ID || '',
      sheetName: process.env.GOOGLE_SHEET_NAME || 'Tickets',
      columns: DEFAULT_SHEET_COLUMNS,
    },
    appsScript: {
      baseUrl: googleEnv.appsScriptUrl,
      syncSecret: googleEnv.syncSecret,
      endpoints: {
        ticketCreated: '/ticket-created',
        ticketUpdated: '/ticket-updated',
        attachUploaded: '/attach-uploaded',
      },
    },
  };
}

let cachedGoogleConfig: GoogleConfig | null = null;

/**
 * Gets the Google configuration (cached)
 */
export function getGoogleConfig(): GoogleConfig {
  if (!cachedGoogleConfig) {
    cachedGoogleConfig = createGoogleConfig();
  }
  return cachedGoogleConfig;
}

/**
 * Generates monthly folder name from date
 * Format: YYYY-MM
 */
export function getMonthlyFolderName(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

/**
 * Generates full folder path for a ticket
 * Format: ROOT_FOLDER/YYYY-MM/TicketNo/
 */
export function getTicketFolderPath(ticketNo: string, date: Date = new Date()): string {
  const monthlyFolder = getMonthlyFolderName(date);
  return `${monthlyFolder}/${ticketNo}`;
}
