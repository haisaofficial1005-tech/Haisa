/**
 * Ticket Service - CRUD operations for tickets
 * Requirements: 2.1, 7.2, 7.3
 */

import { prisma } from '../db';
import { formatTicketNo } from './ticketNo';

// Status constants (SQLite uses strings instead of enums)
const TicketStatus = {
  DRAFT: 'DRAFT',
  RECEIVED: 'RECEIVED',
  IN_REVIEW: 'IN_REVIEW',
  NEED_MORE_INFO: 'NEED_MORE_INFO',
  IN_PROGRESS: 'IN_PROGRESS',
  RESOLVED: 'RESOLVED',
  CLOSED: 'CLOSED',
  REJECTED: 'REJECTED',
} as const;

type TicketStatusType = typeof TicketStatus[keyof typeof TicketStatus];

const PaymentStatus = {
  PENDING: 'PENDING',
  PAID: 'PAID',
  FAILED: 'FAILED',
  EXPIRED: 'EXPIRED',
  REFUNDED: 'REFUNDED',
} as const;

type PaymentStatusType = typeof PaymentStatus[keyof typeof PaymentStatus];
import { validateTicketInput } from '../validation/validators';
import type { CreateTicketInput, UpdateTicketInput, TicketWithRelations } from './ticket.types';

export class TicketServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 400
  ) {
    super(message);
    this.name = 'TicketServiceError';
  }
}

/**
 * Creates a new ticket draft
 * Requirements: 2.1 - Creates ticket with status DRAFT and paymentStatus PENDING
 */
export async function createDraft(input: CreateTicketInput): Promise<TicketWithRelations> {
  // Validate input
  const validation = validateTicketInput(input);
  if (!validation.valid) {
    const errorMessages = validation.errors.map(e => e.message).join('; ');
    throw new TicketServiceError(errorMessages, validation.errors[0].code);
  }

  // Generate ticket number
  const year = new Date().getFullYear();
  const yearPrefix = `WAC-${year}-`;
  
  const count = await prisma.ticket.count({
    where: {
      ticketNo: {
        startsWith: yearPrefix,
      },
    },
  });
  
  const ticketNo = formatTicketNo(year, count + 1);

  // Create ticket with DRAFT status and PENDING payment
  const ticket = await prisma.ticket.create({
    data: {
      ticketNo,
      customerId: input.customerId,
      status: TicketStatus.DRAFT,
      paymentStatus: PaymentStatus.PENDING,
      whatsAppNumber: input.whatsAppNumber,
      countryRegion: input.countryRegion,
      issueType: input.issueType,
      incidentAt: input.incidentAt,
      device: input.device,
      waVersion: input.waVersion,
      description: input.description,
    },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      attachments: true,
      payments: true,
    },
  });

  return ticket as TicketWithRelations;
}


/**
 * Gets a ticket by ID with access control
 * Requirements: 7.3
 */
export async function getById(
  id: string,
  userId: string,
  userRole: 'CUSTOMER' | 'AGENT' | 'ADMIN'
): Promise<TicketWithRelations | null> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true,
          driveFileId: true,
          driveFileUrl: true,
          createdAt: true,
        },
      },
      payments: {
        select: {
          id: true,
          orderId: true,
          amount: true,
          currency: true,
          status: true,
          createdAt: true,
        },
      },
    },
  });

  if (!ticket) {
    return null;
  }

  // RBAC check
  if (userRole === 'CUSTOMER' && ticket.customerId !== userId) {
    throw new TicketServiceError('Access denied', 'FORBIDDEN', 403);
  }

  if (userRole === 'AGENT' && ticket.assignedAgentId !== userId && ticket.assignedAgentId !== null) {
    throw new TicketServiceError('Access denied', 'FORBIDDEN', 403);
  }

  return ticket as TicketWithRelations;
}

/**
 * Gets all tickets for a customer
 * Requirements: 7.1, 7.2
 */
export async function getByCustomer(customerId: string): Promise<TicketWithRelations[]> {
  const tickets = await prisma.ticket.findMany({
    where: { customerId },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      attachments: {
        select: {
          id: true,
          fileName: true,
          mimeType: true,
          size: true,
          driveFileId: true,
          driveFileUrl: true,
          createdAt: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tickets as TicketWithRelations[];
}

/**
 * Gets tickets for an agent (assigned or unassigned)
 */
export async function getForAgent(agentId: string): Promise<TicketWithRelations[]> {
  const tickets = await prisma.ticket.findMany({
    where: {
      OR: [
        { assignedAgentId: agentId },
        { assignedAgentId: null, status: { not: TicketStatus.DRAFT } },
      ],
    },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tickets as TicketWithRelations[];
}

/**
 * Gets all tickets (admin only)
 */
export async function getAll(): Promise<TicketWithRelations[]> {
  const tickets = await prisma.ticket.findMany({
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  return tickets as TicketWithRelations[];
}


/**
 * Valid status transitions
 */
const VALID_STATUS_TRANSITIONS: Record<TicketStatusType, TicketStatusType[]> = {
  [TicketStatus.DRAFT]: [TicketStatus.RECEIVED],
  [TicketStatus.RECEIVED]: [TicketStatus.IN_REVIEW, TicketStatus.REJECTED],
  [TicketStatus.IN_REVIEW]: [TicketStatus.NEED_MORE_INFO, TicketStatus.IN_PROGRESS, TicketStatus.REJECTED],
  [TicketStatus.NEED_MORE_INFO]: [TicketStatus.IN_REVIEW, TicketStatus.CLOSED],
  [TicketStatus.IN_PROGRESS]: [TicketStatus.RESOLVED, TicketStatus.NEED_MORE_INFO],
  [TicketStatus.RESOLVED]: [TicketStatus.CLOSED, TicketStatus.IN_PROGRESS],
  [TicketStatus.CLOSED]: [],
  [TicketStatus.REJECTED]: [],
};

/**
 * Validates a status transition
 */
export function isValidStatusTransition(from: TicketStatusType, to: TicketStatusType): boolean {
  return VALID_STATUS_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Updates ticket status with validation
 */
export async function updateStatus(
  id: string,
  status: TicketStatusType,
  actorId: string
): Promise<TicketWithRelations> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new TicketServiceError('Ticket not found', 'TICKET_NOT_FOUND', 404);
  }

  // Validate status transition
  if (!isValidStatusTransition(ticket.status as TicketStatusType, status)) {
    throw new TicketServiceError(
      `Invalid status transition from ${ticket.status} to ${status}`,
      'INVALID_STATUS_TRANSITION'
    );
  }

  const updateData: UpdateTicketInput = { status };
  
  // Set closedAt if transitioning to CLOSED or REJECTED
  if (status === TicketStatus.CLOSED || status === TicketStatus.REJECTED) {
    updateData.closedAt = new Date();
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: updateData,
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return updated as TicketWithRelations;
}

/**
 * Assigns an agent to a ticket
 */
export async function assignAgent(
  id: string,
  agentId: string | null,
  actorId: string
): Promise<TicketWithRelations> {
  const ticket = await prisma.ticket.findUnique({
    where: { id },
  });

  if (!ticket) {
    throw new TicketServiceError('Ticket not found', 'TICKET_NOT_FOUND', 404);
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data: { assignedAgentId: agentId },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return updated as TicketWithRelations;
}

/**
 * Updates ticket with Google sync data
 */
export async function updateGoogleSync(
  id: string,
  data: {
    googleDriveFolderId: string;
    googleDriveFolderUrl: string;
    googleSheetRowIndex: number;
  }
): Promise<TicketWithRelations> {
  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return updated as TicketWithRelations;
}

/**
 * Updates ticket payment status
 */
export async function updatePaymentStatus(
  id: string,
  paymentStatus: PaymentStatusType,
  newTicketStatus?: TicketStatusType
): Promise<TicketWithRelations> {
  const data: UpdateTicketInput = { paymentStatus };
  
  if (newTicketStatus) {
    data.status = newTicketStatus;
  }

  const updated = await prisma.ticket.update({
    where: { id },
    data,
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return updated as TicketWithRelations;
}

/**
 * Adds internal notes to a ticket
 */
export async function addInternalNotes(
  id: string,
  notes: string,
  actorId: string
): Promise<TicketWithRelations> {
  const updated = await prisma.ticket.update({
    where: { id },
    data: { notesInternal: notes },
    include: {
      customer: {
        select: { id: true, email: true, name: true },
      },
      assignedAgent: {
        select: { id: true, email: true, name: true },
      },
    },
  });

  return updated as TicketWithRelations;
}
