import { createClient } from '@libsql/client';
import 'dotenv/config';

const client = createClient({
  url: process.env.TURSO_DATABASE_URL,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

const schema = `
-- User table (for NextAuth)
CREATE TABLE IF NOT EXISTS User (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  emailVerified TEXT,
  name TEXT,
  image TEXT,
  role TEXT DEFAULT 'CUSTOMER',
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP
);

-- Account table (for NextAuth)
CREATE TABLE IF NOT EXISTS Account (
  id TEXT PRIMARY KEY,
  userId TEXT NOT NULL,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  providerAccountId TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE,
  UNIQUE(provider, providerAccountId)
);

-- Session table (for NextAuth)
CREATE TABLE IF NOT EXISTS Session (
  id TEXT PRIMARY KEY,
  sessionToken TEXT UNIQUE NOT NULL,
  userId TEXT NOT NULL,
  expires TEXT NOT NULL,
  FOREIGN KEY (userId) REFERENCES User(id) ON DELETE CASCADE
);

-- VerificationToken table (for NextAuth)
CREATE TABLE IF NOT EXISTS VerificationToken (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TEXT NOT NULL,
  UNIQUE(identifier, token)
);

-- Ticket table
CREATE TABLE IF NOT EXISTS Ticket (
  id TEXT PRIMARY KEY,
  ticketNo TEXT UNIQUE NOT NULL,
  customerId TEXT NOT NULL,
  status TEXT DEFAULT 'DRAFT',
  paymentStatus TEXT DEFAULT 'PENDING',
  assignedAgentId TEXT,
  whatsAppNumber TEXT NOT NULL,
  countryRegion TEXT NOT NULL,
  issueType TEXT NOT NULL,
  incidentAt TEXT NOT NULL,
  device TEXT NOT NULL,
  waVersion TEXT NOT NULL,
  description TEXT NOT NULL,
  notesInternal TEXT,
  googleDriveFolderId TEXT,
  googleDriveFolderUrl TEXT,
  googleSheetRowIndex INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  closedAt TEXT,
  FOREIGN KEY (customerId) REFERENCES User(id),
  FOREIGN KEY (assignedAgentId) REFERENCES User(id)
);

-- Attachment table
CREATE TABLE IF NOT EXISTS Attachment (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  uploaderId TEXT NOT NULL,
  fileName TEXT NOT NULL,
  mimeType TEXT NOT NULL,
  size INTEGER NOT NULL,
  driveFileId TEXT,
  driveFileUrl TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticketId) REFERENCES Ticket(id),
  FOREIGN KEY (uploaderId) REFERENCES User(id)
);

-- Payment table
CREATE TABLE IF NOT EXISTS Payment (
  id TEXT PRIMARY KEY,
  ticketId TEXT NOT NULL,
  provider TEXT NOT NULL,
  orderId TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL,
  currency TEXT DEFAULT 'IDR',
  status TEXT DEFAULT 'PENDING',
  rawPayload TEXT,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (ticketId) REFERENCES Ticket(id)
);

-- AuditLog table
CREATE TABLE IF NOT EXISTS AuditLog (
  id TEXT PRIMARY KEY,
  actorId TEXT NOT NULL,
  ticketId TEXT NOT NULL,
  action TEXT NOT NULL,
  before TEXT,
  after TEXT NOT NULL,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (actorId) REFERENCES User(id),
  FOREIGN KEY (ticketId) REFERENCES Ticket(id)
);

-- GmailSale table
CREATE TABLE IF NOT EXISTS GmailSale (
  id TEXT PRIMARY KEY,
  saleNo TEXT UNIQUE NOT NULL,
  customerId TEXT NOT NULL,
  gmailAddress TEXT NOT NULL,
  gmailPassword TEXT NOT NULL,
  paymentMethod TEXT NOT NULL,
  paymentProvider TEXT NOT NULL,
  paymentAccountNumber TEXT NOT NULL,
  paymentAccountName TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  adminNotes TEXT,
  proofImageUrl TEXT,
  googleDriveFolderId TEXT,
  googleDriveFolderUrl TEXT,
  googleSheetRowIndex INTEGER,
  createdAt TEXT DEFAULT CURRENT_TIMESTAMP,
  updatedAt TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (customerId) REFERENCES User(id)
);
`;

async function pushSchema() {
  console.log('Connecting to Turso...');
  console.log('URL:', process.env.TURSO_DATABASE_URL);
  
  try {
    // Split schema into individual statements
    const statements = schema
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    for (const statement of statements) {
      console.log('Executing:', statement.substring(0, 50) + '...');
      await client.execute(statement);
    }
    
    console.log('Schema pushed successfully!');
  } catch (error) {
    console.error('Error pushing schema:', error);
  }
}

pushSchema();
