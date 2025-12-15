/**
 * Audit Logging Service
 * Requirements: 11.1, 11.2, 11.3, 11.4
 */

import { prisma } from '../db';
import type { AuditLog } from '@prisma/client';

export type AuditAction =
  | 'TICKET_CREATED'
  | 'STATUS_CHANGED'
  | 'AGENT_ASSIGNED'
  | 'ATTACHMENT_ADDED'
  | 'NOTE_ADDED'
  | 'PAYMENT_STATUS_CHANGED';

export interface AuditEntry {
  actorId: string;
  ticketId: string;
  action: AuditAction;
  before: Record<string, unknown> | null;
  after: Record<string, unknown>;
}

export interface CreateAuditLogResult {
  auditLog: AuditLog;
}

/**
 * Audit Service
 * Handles audit logging for ticket changes
 * 
 * Property 19: Audit Log Completeness
 * Property 20: Audit Log Immutability
 */
export class AuditService {
  /**
   * Creates an audit log entry
   * Requirements: 11.1, 11.2, 11.3
   */
  async log(entry: AuditEntry): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        actorId: entry.actorId,
        ticketId: entry.ticketId,
        action: entry.action,
        before: entry.before as object | null,
        after: entry.after as object,
      },
    });
  }

  /**
   * Gets all audit logs for a ticket
   */
  async getByTicket(ticketId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { ticketId },
      orderBy: { createdAt: 'asc' },
      include: {
        actor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  }

  /**
   * Gets audit logs by actor
   */
  async getByActor(actorId: string): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { actorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Gets audit logs by action type
   */
  async getByAction(action: AuditAction): Promise<AuditLog[]> {
    return prisma.auditLog.findMany({
      where: { action },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Logs a status change
   * Requirements: 11.2
   */
  async logStatusChange(
    actorId: string,
    ticketId: string,
    previousStatus: string,
    newStatus: string
  ): Promise<AuditLog> {
    return this.log({
      actorId,
      ticketId,
      action: 'STATUS_CHANGED',
      before: { status: previousStatus },
      after: { status: newStatus },
    });
  }

  /**
   * Logs an agent assignment change
   * Requirements: 11.3
   */
  async logAssignmentChange(
    actorId: string,
    ticketId: string,
    previousAgentId: string | null,
    newAgentId: string | null
  ): Promise<AuditLog> {
    return this.log({
      actorId,
      ticketId,
      action: 'AGENT_ASSIGNED',
      before: { assignedAgentId: previousAgentId },
      after: { assignedAgentId: newAgentId },
    });
  }

  /**
   * Logs ticket creation
   */
  async logTicketCreated(
    actorId: string,
    ticketId: string,
    ticketData: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.log({
      actorId,
      ticketId,
      action: 'TICKET_CREATED',
      before: null,
      after: ticketData,
    });
  }

  /**
   * Logs attachment addition
   */
  async logAttachmentAdded(
    actorId: string,
    ticketId: string,
    attachmentData: Record<string, unknown>
  ): Promise<AuditLog> {
    return this.log({
      actorId,
      ticketId,
      action: 'ATTACHMENT_ADDED',
      before: null,
      after: attachmentData,
    });
  }

  /**
   * Logs note addition
   */
  async logNoteAdded(
    actorId: string,
    ticketId: string,
    previousNotes: string | null,
    newNotes: string
  ): Promise<AuditLog> {
    return this.log({
      actorId,
      ticketId,
      action: 'NOTE_ADDED',
      before: { notesInternal: previousNotes },
      after: { notesInternal: newNotes },
    });
  }
}

/**
 * Validates that an audit entry has all required fields
 * Property 19: Audit Log Completeness
 */
export function validateAuditEntry(entry: AuditEntry): boolean {
  if (!entry.actorId || typeof entry.actorId !== 'string') {
    return false;
  }

  if (!entry.ticketId || typeof entry.ticketId !== 'string') {
    return false;
  }

  if (!entry.action || typeof entry.action !== 'string') {
    return false;
  }

  if (entry.after === undefined || entry.after === null) {
    return false;
  }

  if (typeof entry.after !== 'object') {
    return false;
  }

  return true;
}

/**
 * Creates an AuditService instance
 */
export function createAuditService(): AuditService {
  return new AuditService();
}

/**
 * Default audit service instance
 */
export const auditService = new AuditService();
