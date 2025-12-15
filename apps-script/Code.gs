/**
 * Google Apps Script for Haisa WA
 * Requirements: 5.1, 5.2, 6.1, 6.3, 6.5
 * 
 * This script handles:
 * - Creating Drive folders for tickets
 * - Appending rows to Google Sheets
 * - Updating existing rows in Sheets
 */

// Configuration - Set these in Script Properties
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const SYNC_SECRET = SCRIPT_PROPERTIES.getProperty('SYNC_SECRET');
const ROOT_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('ROOT_FOLDER_ID');
const SPREADSHEET_ID = SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID');
const SHEET_NAME = SCRIPT_PROPERTIES.getProperty('SHEET_NAME') || 'Tickets';

/**
 * Main entry point for POST requests
 * Requirements: 6.5 - X-SYNC-SECRET validation
 */
function doPost(e) {
  try {
    // Validate X-SYNC-SECRET header
    const secret = e.parameter.secret || '';
    if (secret !== SYNC_SECRET) {
      return createJsonResponse({ error: 'Unauthorized' }, 401);
    }

    const payload = JSON.parse(e.postData.contents);
    const action = payload.action;

    switch (action) {
      case 'ticket-created':
        return handleTicketCreated(payload.data);
      case 'ticket-updated':
        return handleTicketUpdated(payload.data);
      case 'health':
        return createJsonResponse({ status: 'ok' });
      default:
        return createJsonResponse({ error: 'Unknown action' }, 400);
    }
  } catch (error) {
    console.error('Error in doPost:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Handle ticket-created action
 * Requirements: 5.1, 5.2, 6.1
 * 
 * Creates:
 * 1. Monthly folder (YYYY-MM) if not exists
 * 2. Ticket folder inside monthly folder
 * 3. New row in Sheets
 */
function handleTicketCreated(data) {
  try {
    // Get or create monthly folder
    const createdAt = new Date(data.createdAt);
    const monthlyFolderName = Utilities.formatDate(createdAt, 'Asia/Jakarta', 'yyyy-MM');
    const monthlyFolder = getOrCreateFolder(ROOT_FOLDER_ID, monthlyFolderName);

    // Create ticket folder
    const ticketFolder = monthlyFolder.createFolder(data.ticketNo);
    const folderId = ticketFolder.getId();
    const folderUrl = ticketFolder.getUrl();

    // Append row to Sheets
    const rowIndex = appendTicketRow(data, folderUrl);

    return createJsonResponse({
      success: true,
      folderId: folderId,
      folderUrl: folderUrl,
      rowIndex: rowIndex,
    });
  } catch (error) {
    console.error('Error in handleTicketCreated:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Handle ticket-updated action
 * Requirements: 6.3
 * 
 * Updates existing row in Sheets
 */
function handleTicketUpdated(data) {
  try {
    const rowIndex = data.rowIndex;
    if (!rowIndex || rowIndex < 2) {
      return createJsonResponse({ error: 'Invalid rowIndex' }, 400);
    }

    updateTicketRow(rowIndex, data);

    return createJsonResponse({
      success: true,
      rowIndex: rowIndex,
    });
  } catch (error) {
    console.error('Error in handleTicketUpdated:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Get or create a folder inside a parent folder
 */
function getOrCreateFolder(parentId, folderName) {
  const parentFolder = DriveApp.getFolderById(parentId);
  const folders = parentFolder.getFoldersByName(folderName);
  
  if (folders.hasNext()) {
    return folders.next();
  }
  
  return parentFolder.createFolder(folderName);
}

/**
 * Append a new ticket row to the Sheets
 * Requirements: 6.4 - All required columns
 * 
 * Columns:
 * A: TicketNo
 * B: CreatedAt
 * C: CustomerName
 * D: CustomerEmail
 * E: WhatsAppNumber
 * F: CountryRegion
 * G: IssueType
 * H: IncidentAt
 * I: Device
 * J: WhatsAppVersion
 * K: Status
 * L: PaymentStatus
 * M: AssignedAgent
 * N: DriveFolderUrl
 * O: NotesInternal
 * P: LastUpdatedAt
 */
function appendTicketRow(data, folderUrl) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  const row = [
    data.ticketNo,
    formatDateTime(data.createdAt),
    data.customerName,
    data.customerEmail,
    data.whatsAppNumber,
    data.countryRegion,
    data.issueType,
    formatDateTime(data.incidentAt),
    data.device,
    data.waVersion,
    data.status,
    data.paymentStatus,
    data.assignedAgent || '',
    folderUrl,
    data.notesInternal || '',
    formatDateTime(data.lastUpdatedAt || new Date().toISOString()),
  ];

  sheet.appendRow(row);
  
  // Return the row index (1-based)
  return sheet.getLastRow();
}

/**
 * Update an existing ticket row
 */
function updateTicketRow(rowIndex, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  // Update specific columns
  if (data.status !== undefined) {
    sheet.getRange(rowIndex, 11).setValue(data.status); // Column K
  }
  
  if (data.assignedAgent !== undefined) {
    sheet.getRange(rowIndex, 13).setValue(data.assignedAgent || ''); // Column M
  }
  
  if (data.notesInternal !== undefined) {
    sheet.getRange(rowIndex, 15).setValue(data.notesInternal || ''); // Column O
  }
  
  // Always update LastUpdatedAt
  sheet.getRange(rowIndex, 16).setValue(formatDateTime(data.lastUpdatedAt || new Date().toISOString())); // Column P
}

/**
 * Format ISO date string to readable format
 */
function formatDateTime(isoString) {
  if (!isoString) return '';
  
  try {
    const date = new Date(isoString);
    return Utilities.formatDate(date, 'Asia/Jakarta', 'yyyy-MM-dd HH:mm:ss');
  } catch (e) {
    return isoString;
  }
}

/**
 * Create JSON response
 */
function createJsonResponse(data, statusCode = 200) {
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

/**
 * Initialize the spreadsheet with headers
 * Run this once to set up the sheet
 */
function initializeSheet() {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  const headers = [
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
    'NotesInternal',
    'LastUpdatedAt',
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 150);  // TicketNo
  sheet.setColumnWidth(2, 150);  // CreatedAt
  sheet.setColumnWidth(3, 150);  // CustomerName
  sheet.setColumnWidth(4, 200);  // CustomerEmail
  sheet.setColumnWidth(5, 150);  // WhatsAppNumber
  sheet.setColumnWidth(6, 120);  // CountryRegion
  sheet.setColumnWidth(7, 150);  // IssueType
  sheet.setColumnWidth(8, 150);  // IncidentAt
  sheet.setColumnWidth(9, 150);  // Device
  sheet.setColumnWidth(10, 120); // WhatsAppVersion
  sheet.setColumnWidth(11, 120); // Status
  sheet.setColumnWidth(12, 120); // PaymentStatus
  sheet.setColumnWidth(13, 150); // AssignedAgent
  sheet.setColumnWidth(14, 300); // DriveFolderUrl
  sheet.setColumnWidth(15, 300); // NotesInternal
  sheet.setColumnWidth(16, 150); // LastUpdatedAt
  
  console.log('Sheet initialized successfully');
}

/**
 * Test function - can be run from Apps Script editor
 */
function testHealthCheck() {
  const result = doPost({
    parameter: { secret: SYNC_SECRET },
    postData: { contents: JSON.stringify({ action: 'health' }) }
  });
  console.log(result.getContent());
}
