# 🔧 Turso Database Schema Fix

## ❌ Current Issue
The production Turso database is missing the `phone` column in the `User` table, causing login errors:
```
SQL_INPUT_ERROR: SQLite input error: no such column: main.User.phone
```

## 🎯 Solution Options

### Option 1: Manual SQL Execution (Recommended)

1. **Go to Turso Dashboard**
   - Visit: https://turso.tech/app
   - Select database: `haisa-sulthonaj`
   - Go to "SQL Console"

2. **Execute the following SQL commands in order:**

```sql
-- STEP 1: Drop existing tables (if they exist)
DROP TABLE IF EXISTS "AuditLog";
DROP TABLE IF EXISTS "Attachment";
DROP TABLE IF EXISTS "Payment";
DROP TABLE IF EXISTS "GmailSale";
DROP TABLE IF EXISTS "Ticket";
DROP TABLE IF EXISTS "VerificationToken";
DROP TABLE IF EXISTS "Session";
DROP TABLE IF EXISTS "Account";
DROP TABLE IF EXISTS "User";

-- STEP 2: Create User table with phone field
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "email" TEXT NOT NULL,
    "emailVerified" DATETIME,
    "name" TEXT,
    "image" TEXT,
    "phone" TEXT,
    "role" TEXT NOT NULL DEFAULT 'CUSTOMER',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- STEP 3: Create other tables
CREATE TABLE "Account" (
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
    CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "Session" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionToken" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expires" DATETIME NOT NULL,
    CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE "VerificationToken" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" DATETIME NOT NULL
);

CREATE TABLE "Ticket" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketNo" TEXT NOT NULL,
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
    "updatedAt" DATETIME NOT NULL,
    "closedAt" DATETIME,
    CONSTRAINT "Ticket_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Ticket_assignedAgentId_fkey" FOREIGN KEY ("assignedAgentId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Attachment" (
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
    CONSTRAINT "Attachment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Attachment_uploaderId_fkey" FOREIGN KEY ("uploaderId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Payment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "ticketId" TEXT NOT NULL,
    "provider" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'IDR',
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "rawPayload" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Payment_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "actorId" TEXT NOT NULL,
    "ticketId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_ticketId_fkey" FOREIGN KEY ("ticketId") REFERENCES "Ticket" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "GmailSale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "saleNo" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "gmailAddress" TEXT NOT NULL,
    "gmailPassword" TEXT NOT NULL,
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
    "googleDriveFolderId" TEXT,
    "googleDriveFolderUrl" TEXT,
    "googleSheetRowIndex" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GmailSale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- STEP 4: Create indexes
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
CREATE UNIQUE INDEX "Account_provider_providerAccountId_key" ON "Account"("provider", "providerAccountId");
CREATE UNIQUE INDEX "Session_sessionToken_key" ON "Session"("sessionToken");
CREATE UNIQUE INDEX "VerificationToken_token_key" ON "VerificationToken"("token");
CREATE UNIQUE INDEX "VerificationToken_identifier_token_key" ON "VerificationToken"("identifier", "token");
CREATE UNIQUE INDEX "Ticket_ticketNo_key" ON "Ticket"("ticketNo");
CREATE UNIQUE INDEX "Payment_orderId_key" ON "Payment"("orderId");
CREATE UNIQUE INDEX "GmailSale_saleNo_key" ON "GmailSale"("saleNo");

-- STEP 5: Add Gmail verification fields
ALTER TABLE "GmailSale" ADD COLUMN "gmailPasswordEncrypted" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "rejectionReason" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "suggestedPrice" INTEGER;
ALTER TABLE "GmailSale" ADD COLUMN "verificationData" TEXT;
ALTER TABLE "GmailSale" ADD COLUMN "verifiedAt" DATETIME;
ALTER TABLE "GmailSale" ADD COLUMN "verifiedBy" TEXT;
```

### Option 2: Turso CLI (Alternative)

If you have Turso CLI installed:
```bash
turso db shell haisa-sulthonaj
```
Then paste the SQL commands above.

### Option 3: Regenerate Auth Token

If the auth token is expired:
1. Go to https://turso.tech/app
2. Go to your database settings
3. Generate a new auth token
4. Update the `TURSO_AUTH_TOKEN` in Vercel environment variables

## ✅ Verification

After applying the SQL commands, verify the schema:
```sql
PRAGMA table_info(User);
```

You should see the `phone` column in the output.

## 🚀 Next Steps

1. Apply the SQL commands to Turso database
2. Verify the `phone` column exists
3. Test login functionality
4. The application should work without the "no such column" error

## 📝 Important Notes

- This will recreate all tables (existing data will be lost)
- Make sure to backup any important data first
- The schema includes all necessary tables and relationships
- All indexes and constraints are properly created

---

**Status**: ⏳ WAITING FOR MANUAL DATABASE SCHEMA APPLICATION
**Priority**: 🔴 CRITICAL - Required for login functionality