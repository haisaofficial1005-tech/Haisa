#!/usr/bin/env node

/**
 * Setup Production Database
 * Creates tables in Turso database for production
 */

import { createClient } from '@libsql/client';
import fs from 'fs';
import path from 'path';

const TURSO_DATABASE_URL = process.env.TURSO_DATABASE_URL;
const TURSO_AUTH_TOKEN = process.env.TURSO_AUTH_TOKEN;

if (!TURSO_DATABASE_URL || !TURSO_AUTH_TOKEN) {
  console.error('❌ Missing TURSO_DATABASE_URL or TURSO_AUTH_TOKEN');
  process.exit(1);
}

const client = createClient({
  url: TURSO_DATABASE_URL,
  authToken: TURSO_AUTH_TOKEN,
});

const createTablesSQL = `
-- Users table
CREATE TABLE IF NOT EXISTS "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL UNIQUE,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "phone" TEXT UNIQUE,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Accounts table
CREATE TABLE IF NOT EXISTS "Account" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "providerAccountId" TEXT NOT NULL,
    "refresh_token" TEXT,
    "access_token" TEXT,
    "expires_at" INTEGER,
    "token_type" TEXT,
    "scope" TEXT,
    "id_token" TEXT,
    "session_state" TEXT,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Sessions table
CREATE TABLE IF NOT EXISTS "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL UNIQUE,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- VerificationToken table
CREATE TABLE IF NOT EXISTS "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL UNIQUE,
    "expires" DATETIME NOT NULL
);

-- Tickets table
CREATE TABLE IF NOT EXISTS "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNo" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "assignedAgentId" TEXT,
    "whatsAppNumber" TEXT NOT NULL,
    "countryRegion" TEXT NOT NULL,
    "issueType" TEXT NOT NULL,
    "incidentAt" DATETIME NOT NULL,
    "device" TEXT NOT NULL,
    "waVersion" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "notesInternal" TEXT,
    "googleDriveFolderId" TEXT,
    "googleDriveFolderUrl" TEXT,
    "googleSheetRowIndex" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "closedAt" DATETIME,
    FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- Attachments table
CREATE TABLE IF NOT EXISTS "Attachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "uploaderId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "fileData" TEXT,
    "driveFileId" TEXT,
    "driveFileUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Payments table
CREATE TABLE IF NOT EXISTS "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "orderId" TEXT NOT NULL UNIQUE,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- AuditLog table
CREATE TABLE IF NOT EXISTS "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- GmailSale table
CREATE TABLE IF NOT EXISTS "GmailSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNo" TEXT NOT NULL UNIQUE,
    "customerId" TEXT NOT NULL,
    "gmailAddress" TEXT NOT NULL,
    "gmailPassword" TEXT NOT NULL,
    "gmailPasswordEncrypted" TEXT,
    "paymentMethod" TEXT NOT NULL,
    "paymentProvider" TEXT NOT NULL,
    "paymentAccountNumber" TEXT NOT NULL,
    "paymentAccountName" TEXT NOT NULL,
    "qrisAmount" INTEGER,
    "qrisUniqueCode" TEXT,
    "qrisPaymentProofUrl" TEXT,
    "qrisPaymentProofDriveId" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "adminNotes" TEXT,
    "proofImageUrl" TEXT,
    "verificationData" TEXT,
    "verifiedBy" TEXT,
    "verifiedAt" DATETIME,
    "rejectionReason" TEXT,
    "suggestedPrice" INTEGER,
    "googleDriveFolderId" TEXT,
    "googleDriveFolderUrl" TEXT,
    "googleSheetRowIndex" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE INDEX IF NOT EXISTS "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE INDEX IF NOT EXISTS "Ticket_customerId_idx" ON "Ticket"("customerId");
CREATE INDEX IF NOT EXISTS "Ticket_assignedAgentId_idx" ON "Ticket"("assignedAgentId");
CREATE INDEX IF NOT EXISTS "GmailSale_customerId_idx" ON "GmailSale"("customerId");
`;

async function setupDatabase() {
  try {
    console.log('🔄 Setting up production database...');
    console.log('📍 Database URL:', TURSO_DATABASE_URL);
    
    // Execute the SQL to create tables
    const statements = createTablesSQL.split(';').filter(stmt => stmt.trim());
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          await client.execute(statement.trim());
          console.log('✅ Executed:', statement.trim().split('\n')[0]);
        } catch (error) {
          if (error.message.includes('already exists')) {
            console.log('⚠️  Table already exists:', statement.trim().split('\n')[0]);
          } else {
            console.error('❌ Error executing statement:', error.message);
            console.error('Statement:', statement.trim().substring(0, 100) + '...');
          }
        }
      }
    }
    
    // Test the connection by querying tables
    console.log('\n🔍 Verifying tables...');
    const tables = await client.execute("SELECT name FROM sqlite_master WHERE type='table'");
    console.log('📋 Tables found:', tables.rows.map(row => row.name).join(', '));
    
    console.log('\n✅ Database setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    process.exit(1);
  } finally {
    client.close();
  }
}

setupDatabase();