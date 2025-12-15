/**
 * Ticket types and interfaces
 */

// Type aliases (SQLite uses strings instead of enums)
type IssueType = string;
type TicketStatus = string;
type PaymentStatus = string;

export interface CreateTicketInput {
  customerId: string;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: Date;
  device: string;
  waVersion: string;
  description: string;
}

export interface UpdateTicketInput {
  status?: TicketStatus;
  paymentStatus?: PaymentStatus;
  assignedAgentId?: string | null;
  notesInternal?: string;
  googleDriveFolderId?: string;
  googleDriveFolderUrl?: string;
  googleSheetRowIndex?: number;
  closedAt?: Date | null;
}

export interface TicketWithRelations {
  id: string;
  ticketNo: string;
  customerId: string;
  status: TicketStatus;
  paymentStatus: PaymentStatus;
  assignedAgentId: string | null;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: IssueType;
  incidentAt: Date;
  device: string;
  waVersion: string;
  description: string;
  notesInternal: string | null;
  googleDriveFolderId: string | null;
  googleDriveFolderUrl: string | null;
  googleSheetRowIndex: number | null;
  createdAt: Date;
  updatedAt: Date;
  closedAt: Date | null;
  customer?: {
    id: string;
    email: string;
    name: string;
  };
  assignedAgent?: {
    id: string;
    email: string;
    name: string;
  } | null;
  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    driveFileId: string | null;
    driveFileUrl: string | null;
    createdAt: Date;
  }[];
  payments?: {
    id: string;
    orderId: string;
    amount: number;
    currency: string;
    status: PaymentStatus;
    createdAt: Date;
  }[];
}

export interface SerializedTicket {
  id: string;
  ticketNo: string;
  customerId: string;
  status: string;
  paymentStatus: string;
  assignedAgentId: string | null;
  whatsAppNumber: string;
  countryRegion: string;
  issueType: string;
  incidentAt: string;
  device: string;
  waVersion: string;
  description: string;
  notesInternal: string | null;
  googleDriveFolderId: string | null;
  googleDriveFolderUrl: string | null;
  googleSheetRowIndex: number | null;
  createdAt: string;
  updatedAt: string;
  closedAt: string | null;
  customer?: {
    id: string;
    email: string;
    name: string;
  };
  assignedAgent?: {
    id: string;
    email: string;
    name: string;
  } | null;
  attachments?: {
    id: string;
    fileName: string;
    mimeType: string;
    size: number;
    driveFileId: string | null;
    driveFileUrl: string | null;
    createdAt: string;
  }[];
}
