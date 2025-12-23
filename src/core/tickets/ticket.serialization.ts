/**
 * Ticket Serialization/Deserialization
 * Requirements: 13.5, 13.6
 */

import type { TicketWithRelations, SerializedTicket } from './ticket.types';

// Status types (SQLite uses strings instead of enums)
type IssueType = 'ACCOUNT_BANNED' | 'ACCOUNT_SUSPENDED' | 'VERIFICATION_ISSUE' | 'HACKED_ACCOUNT' | 'OTHER';
type TicketStatus = 'DRAFT' | 'RECEIVED' | 'IN_REVIEW' | 'NEED_MORE_INFO' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'EXPIRED' | 'REFUNDED';

// Keep const objects for validation
const IssueTypeValues = {
  ACCOUNT_BANNED: 'ACCOUNT_BANNED',
  ACCOUNT_SUSPENDED: 'ACCOUNT_SUSPENDED',
  VERIFICATION_ISSUE: 'VERIFICATION_ISSUE',
  HACKED_ACCOUNT: 'HACKED_ACCOUNT',
  OTHER: 'OTHER',
} as const;

const TicketStatusValues = {
  DRAFT: 'DRAFT',
  RECEIVED: 'RECEIVED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFO: 'NEED_MORE_INFO',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const;

const PaymentStatusValues = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
} as const;

/**
 * Serializes a ticket to JSON-safe format
 * Converts Date objects to ISO strings
 * Requirements: 13.5
 */
export function serializeTicket(ticket: TicketWithRelations): SerializedTicket {
  return {
    id: ticket.id,
    ticketNo: ticket.ticketNo,
    customerId: ticket.customerId,
    status: ticket.status,
    paymentStatus: ticket.paymentStatus,
    assignedAgentId: ticket.assignedAgentId,
    whatsAppNumber: ticket.whatsAppNumber,
    countryRegion: ticket.countryRegion,
    issueType: ticket.issueType,
    incidentAt: ticket.incidentAt.toISOString(),
    device: ticket.device,
    waVersion: ticket.waVersion,
    description: ticket.description,
    notesInternal: ticket.notesInternal,
    googleDriveFolderId: ticket.googleDriveFolderId,
    googleDriveFolderUrl: ticket.googleDriveFolderUrl,
    googleSheetRowIndex: ticket.googleSheetRowIndex,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
    closedAt: ticket.closedAt?.toISOString() ?? null,
    customer: ticket.customer,
    assignedAgent: ticket.assignedAgent,
    attachments: ticket.attachments?.map(att => ({
      ...att,
      createdAt: att.createdAt.toISOString(),
    })),
  };
}

/**
 * Deserializes a ticket from JSON format
 * Converts ISO strings back to Date objects
 * Requirements: 13.6
 */
export function deserializeTicket(data: SerializedTicket): TicketWithRelations {
  return {
    id: data.id,
    ticketNo: data.ticketNo,
    customerId: data.customerId,
    status: data.status as TicketStatus,
    paymentStatus: data.paymentStatus as PaymentStatus,
    assignedAgentId: data.assignedAgentId,
    whatsAppNumber: data.whatsAppNumber,
    countryRegion: data.countryRegion,
    issueType: data.issueType as IssueType,
    incidentAt: new Date(data.incidentAt),
    device: data.device,
    waVersion: data.waVersion,
    description: data.description,
    notesInternal: data.notesInternal,
    googleDriveFolderId: data.googleDriveFolderId,
    googleDriveFolderUrl: data.googleDriveFolderUrl,
    googleSheetRowIndex: data.googleSheetRowIndex,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    closedAt: data.closedAt ? new Date(data.closedAt) : null,
    customer: data.customer,
    assignedAgent: data.assignedAgent,
    attachments: data.attachments?.map(att => ({
      ...att,
      createdAt: new Date(att.createdAt),
    })),
  };
}

/**
 * Converts ticket to JSON string
 */
export function ticketToJson(ticket: TicketWithRelations): string {
  return JSON.stringify(serializeTicket(ticket));
}

/**
 * Parses ticket from JSON string
 */
export function ticketFromJson(json: string): TicketWithRelations {
  const data = JSON.parse(json) as SerializedTicket;
  return deserializeTicket(data);
}

/**
 * Checks if two tickets are equivalent (for round-trip testing)
 * Compares all fields except updatedAt which may change
 */
export function ticketsAreEquivalent(a: TicketWithRelations, b: TicketWithRelations): boolean {
  // Compare primitive fields
  if (a.id !== b.id) return false;
  if (a.ticketNo !== b.ticketNo) return false;
  if (a.customerId !== b.customerId) return false;
  if (a.status !== b.status) return false;
  if (a.paymentStatus !== b.paymentStatus) return false;
  if (a.assignedAgentId !== b.assignedAgentId) return false;
  if (a.whatsAppNumber !== b.whatsAppNumber) return false;
  if (a.countryRegion !== b.countryRegion) return false;
  if (a.issueType !== b.issueType) return false;
  if (a.device !== b.device) return false;
  if (a.waVersion !== b.waVersion) return false;
  if (a.description !== b.description) return false;
  if (a.notesInternal !== b.notesInternal) return false;
  if (a.googleDriveFolderId !== b.googleDriveFolderId) return false;
  if (a.googleDriveFolderUrl !== b.googleDriveFolderUrl) return false;
  if (a.googleSheetRowIndex !== b.googleSheetRowIndex) return false;

  // Compare dates (using getTime for precision)
  if (a.incidentAt.getTime() !== b.incidentAt.getTime()) return false;
  if (a.createdAt.getTime() !== b.createdAt.getTime()) return false;
  if (a.updatedAt.getTime() !== b.updatedAt.getTime()) return false;
  
  // Compare nullable closedAt
  if ((a.closedAt === null) !== (b.closedAt === null)) return false;
  if (a.closedAt && b.closedAt && a.closedAt.getTime() !== b.closedAt.getTime()) return false;

  // Compare customer
  if (a.customer && b.customer) {
    if (a.customer.id !== b.customer.id) return false;
    if (a.customer.email !== b.customer.email) return false;
    if (a.customer.name !== b.customer.name) return false;
  } else if (a.customer !== b.customer) {
    return false;
  }

  // Compare assignedAgent
  if (a.assignedAgent && b.assignedAgent) {
    if (a.assignedAgent.id !== b.assignedAgent.id) return false;
    if (a.assignedAgent.email !== b.assignedAgent.email) return false;
    if (a.assignedAgent.name !== b.assignedAgent.name) return false;
  } else if ((a.assignedAgent === null) !== (b.assignedAgent === null)) {
    return false;
  }

  return true;
}
