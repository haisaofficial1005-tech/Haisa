/**
 * Google Apps Script for Haisa WA
 * Requirements: 5.1, 5.2, 6.1, 6.3, 6.5
 * 
 * This script handles:
 * - Creating Drive folders for tickets
 * - Appending rows to Google Sheets
 * - Updating existing rows in Sheets
 * - Gmail Sale management
 */

// Configuration - Set these in Script Properties
const SCRIPT_PROPERTIES = PropertiesService.getScriptProperties();
const SYNC_SECRET = SCRIPT_PROPERTIES.getProperty('SYNC_SECRET');
const ROOT_FOLDER_ID = SCRIPT_PROPERTIES.getProperty('ROOT_FOLDER_ID');
const SPREADSHEET_ID = SCRIPT_PROPERTIES.getProperty('SPREADSHEET_ID');
const SHEET_NAME = SCRIPT_PROPERTIES.getProperty('SHEET_NAME') || 'Tickets';
const GMAIL_SALE_SHEET_NAME = SCRIPT_PROPERTIES.getProperty('GMAIL_SALE_SHEET_NAME') || 'GmailSales';

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
      case 'gmail-sale-created':
        return handleGmailSaleCreated(payload.data);
      case 'gmail-sale-updated':
        return handleGmailSaleUpdated(payload.data);
      case 'update-gmail-sale':
        return handleUpdateGmailSale(payload.data);
      case 'upload-file':
        return handleFileUpload(payload.data);
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
 * O: AttachmentUrls (links to uploaded images in Drive)
 * P: NotesInternal
 * Q: LastUpdatedAt
 */
function appendTicketRow(data, folderUrl) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
  
  // Format attachment URLs as newline-separated list
  const attachmentUrlsStr = data.attachmentUrls && data.attachmentUrls.length > 0 
    ? data.attachmentUrls.join('\n') 
    : '';
  
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
    attachmentUrlsStr,
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
  
  if (data.paymentStatus !== undefined) {
    sheet.getRange(rowIndex, 12).setValue(data.paymentStatus); // Column L
  }
  
  if (data.assignedAgent !== undefined) {
    sheet.getRange(rowIndex, 13).setValue(data.assignedAgent || ''); // Column M
  }
  
  // Update attachment URLs if provided
  if (data.attachmentUrls !== undefined) {
    const attachmentUrlsStr = data.attachmentUrls && data.attachmentUrls.length > 0 
      ? data.attachmentUrls.join('\n') 
      : '';
    sheet.getRange(rowIndex, 15).setValue(attachmentUrlsStr); // Column O
  }
  
  if (data.notesInternal !== undefined) {
    sheet.getRange(rowIndex, 16).setValue(data.notesInternal || ''); // Column P
  }
  
  // Always update LastUpdatedAt
  sheet.getRange(rowIndex, 17).setValue(formatDateTime(data.lastUpdatedAt || new Date().toISOString())); // Column Q
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
    'AttachmentUrls',
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
  sheet.setColumnWidth(15, 350); // AttachmentUrls
  sheet.setColumnWidth(16, 300); // NotesInternal
  sheet.setColumnWidth(17, 150); // LastUpdatedAt
  
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

/**
 * Handle gmail-sale-created action
 * Creates a new row in Gmail Sales sheet
 */
function handleGmailSaleCreated(data) {
  try {
    // Get or create monthly folder for Gmail Sales
    const createdAt = new Date(data.createdAt);
    const monthlyFolderName = 'GmailSales-' + Utilities.formatDate(createdAt, 'Asia/Jakarta', 'yyyy-MM');
    const monthlyFolder = getOrCreateFolder(ROOT_FOLDER_ID, monthlyFolderName);

    // Create sale folder
    const saleFolder = monthlyFolder.createFolder(data.saleNo);
    const folderId = saleFolder.getId();
    const folderUrl = saleFolder.getUrl();

    // Append row to Gmail Sales sheet
    const rowIndex = appendGmailSaleRow(data, folderUrl);

    return createJsonResponse({
      success: true,
      folderId: folderId,
      folderUrl: folderUrl,
      rowIndex: rowIndex,
    });
  } catch (error) {
    console.error('Error in handleGmailSaleCreated:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Handle gmail-sale-updated action
 * Updates existing row in Gmail Sales sheet
 */
function handleGmailSaleUpdated(data) {
  try {
    const rowIndex = data.rowIndex;
    if (!rowIndex || rowIndex < 2) {
      return createJsonResponse({ error: 'Invalid rowIndex' }, 400);
    }

    updateGmailSaleRow(rowIndex, data);

    return createJsonResponse({
      success: true,
      rowIndex: rowIndex,
    });
  } catch (error) {
    console.error('Error in handleGmailSaleUpdated:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Append a new Gmail Sale row to the Sheets
 * 
 * Columns:
 * A: SaleNo
 * B: CreatedAt
 * C: CustomerName
 * D: CustomerEmail
 * E: GmailAddress
 * F: GmailPassword
 * G: PaymentMethod
 * H: PaymentProvider
 * I: PaymentAccountNumber
 * J: PaymentAccountName
 * K: Status
 * L: AdminNotes
 * M: ProofImageUrl
 * N: DriveFolderUrl
 * O: LastUpdatedAt
 */
function appendGmailSaleRow(data, folderUrl) {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(GMAIL_SALE_SHEET_NAME);
  
  // Create sheet if not exists
  if (!sheet) {
    sheet = spreadsheet.insertSheet(GMAIL_SALE_SHEET_NAME);
    initializeGmailSaleSheet();
  }
  
  const row = [
    data.saleNo,
    formatDateTime(data.createdAt),
    data.customerName,
    data.customerEmail,
    data.gmailAddress,
    data.gmailPassword,
    data.paymentMethod,
    data.paymentProvider,
    data.paymentAccountNumber,
    data.paymentAccountName,
    data.status,
    data.adminNotes || '',
    data.proofImageUrl || '',
    folderUrl,
    formatDateTime(data.lastUpdatedAt || new Date().toISOString()),
  ];

  sheet.appendRow(row);
  
  return sheet.getLastRow();
}

/**
 * Update an existing Gmail Sale row
 */
function updateGmailSaleRow(rowIndex, data) {
  const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GMAIL_SALE_SHEET_NAME);
  
  if (!sheet) {
    throw new Error('Gmail Sales sheet not found');
  }
  
  // Update specific columns
  if (data.status !== undefined) {
    sheet.getRange(rowIndex, 11).setValue(data.status); // Column K
  }
  
  if (data.adminNotes !== undefined) {
    sheet.getRange(rowIndex, 12).setValue(data.adminNotes || ''); // Column L
  }
  
  if (data.proofImageUrl !== undefined) {
    sheet.getRange(rowIndex, 13).setValue(data.proofImageUrl || ''); // Column M
  }
  
  // Always update LastUpdatedAt
  sheet.getRange(rowIndex, 15).setValue(formatDateTime(data.lastUpdatedAt || new Date().toISOString())); // Column O
}

/**
 * Initialize the Gmail Sales sheet with headers
 * Run this once to set up the sheet
 */
function initializeGmailSaleSheet() {
  const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = spreadsheet.getSheetByName(GMAIL_SALE_SHEET_NAME);
  
  if (!sheet) {
    sheet = spreadsheet.insertSheet(GMAIL_SALE_SHEET_NAME);
  }
  
  const headers = [
    'SaleNo',
    'CreatedAt',
    'CustomerName',
    'CustomerEmail',
    'GmailAddress',
    'GmailPassword',
    'PaymentMethod',
    'PaymentProvider',
    'PaymentAccountNumber',
    'PaymentAccountName',
    'Status',
    'AdminNotes',
    'ProofImageUrl',
    'DriveFolderUrl',
    'LastUpdatedAt',
  ];

  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.setFrozenRows(1);
  
  // Set column widths
  sheet.setColumnWidth(1, 180);  // SaleNo
  sheet.setColumnWidth(2, 150);  // CreatedAt
  sheet.setColumnWidth(3, 150);  // CustomerName
  sheet.setColumnWidth(4, 200);  // CustomerEmail
  sheet.setColumnWidth(5, 200);  // GmailAddress
  sheet.setColumnWidth(6, 150);  // GmailPassword
  sheet.setColumnWidth(7, 120);  // PaymentMethod
  sheet.setColumnWidth(8, 120);  // PaymentProvider
  sheet.setColumnWidth(9, 180);  // PaymentAccountNumber
  sheet.setColumnWidth(10, 180); // PaymentAccountName
  sheet.setColumnWidth(11, 120); // Status
  sheet.setColumnWidth(12, 300); // AdminNotes
  sheet.setColumnWidth(13, 300); // ProofImageUrl
  sheet.setColumnWidth(14, 300); // DriveFolderUrl
  sheet.setColumnWidth(15, 150); // LastUpdatedAt
  
  console.log('Gmail Sales sheet initialized successfully');
}
/**
 * Handle file upload action
 * Uploads base64 file data to Google Drive
 */
function handleFileUpload(data) {
  try {
    const { fileName, mimeType, fileData, folderId } = data;
    
    if (!fileName || !mimeType || !fileData) {
      return createJsonResponse({ error: 'Missing required fields' }, 400);
    }
    
    // Decode base64 data
    const blob = Utilities.newBlob(
      Utilities.base64Decode(fileData),
      mimeType,
      fileName
    );
    
    // Upload to Drive
    let file;
    if (folderId) {
      const folder = DriveApp.getFolderById(folderId);
      file = folder.createFile(blob);
    } else {
      file = DriveApp.createFile(blob);
    }
    
    // Make file publicly viewable
    file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    
    return createJsonResponse({
      success: true,
      fileId: file.getId(),
      fileUrl: file.getUrl(),
      fileName: file.getName(),
    });
    
  } catch (error) {
    console.error('Error in handleFileUpload:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}

/**
 * Handle update-gmail-sale action (for QRIS proof updates)
 * Updates existing row in Gmail Sales sheet with QRIS data
 */
function handleUpdateGmailSale(data) {
  try {
    const rowIndex = data.rowIndex;
    if (!rowIndex || rowIndex < 2) {
      return createJsonResponse({ error: 'Invalid rowIndex' }, 400);
    }

    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(GMAIL_SALE_SHEET_NAME);
    
    if (!sheet) {
      throw new Error('Gmail Sales sheet not found');
    }
    
    // Update specific columns
    if (data.status !== undefined) {
      sheet.getRange(rowIndex, 11).setValue(data.status); // Column K
    }
    
    if (data.qrisPaymentProofUrl !== undefined) {
      sheet.getRange(rowIndex, 13).setValue(data.qrisPaymentProofUrl || ''); // Column M (reuse ProofImageUrl for QRIS proof)
    }
    
    // Always update LastUpdatedAt
    sheet.getRange(rowIndex, 15).setValue(formatDateTime(data.lastUpdatedAt || new Date().toISOString())); // Column O

    return createJsonResponse({
      success: true,
      rowIndex: rowIndex,
    });
  } catch (error) {
    console.error('Error in handleUpdateGmailSale:', error);
    return createJsonResponse({ error: error.message }, 500);
  }
}