/**
 * Draft Ticket Auto-Cancellation Service
 * Requirements: 4.6
 * 
 * Handles automatic cancellation of draft tickets that exceed 24 hours without payment
 */

import { prisma } from '../db';
import type { Ticket } from '@prisma/client';

export interface CleanupResult {
  processedCount: number;
  cancelledTickets: Ticket[];
  errors: Array<{ ticketId: string; error: string }>;
}

/**
 * Draft Cleanup Service
 * Automatically cancels draft tickets older than 24 hours
 */
export class DraftCleanupService {
  private readonly maxAgeHours: number;

  constructor(maxAgeHours: number = 24) {
    this.maxAgeHours = maxAgeHours;
  }

  /**
   * Finds all draft tickets older than the configured max age
   */
  async findExpiredDrafts(): Promise<Ticket[]> {
    const cutoffDate = new Date(Date.now() - this.maxAgeHours * 60 * 60 * 1000);

    return prisma.ticket.findMany({
      where: {
        status: 'DRAFT',
        paymentStatus: 'PENDING',
        createdAt: {
          lt: cutoffDate,
        },
      },
    });
  }

  /**
   * Cancels a single draft ticket by setting paymentStatus to EXPIRED
   * Property 11: Draft Ticket Auto-Cancellation
   */
  async cancelDraftTicket(ticketId: string): Promise<Ticket> {
    return prisma.ticket.update({
      where: { id: ticketId },
      data: {
        paymentStatus: 'EXPIRED',
      },
    });
  }

  /**
   * Runs the cleanup process for all expired draft tickets
   * Requirements: 4.6
   */
  async runCleanup(): Promise<CleanupResult> {
    const expiredDrafts = await this.findExpiredDrafts();
    const cancelledTickets: Ticket[] = [];
    const errors: Array<{ ticketId: string; error: string }> = [];

    for (const ticket of expiredDrafts) {
      try {
        const cancelled = await this.cancelDraftTicket(ticket.id);
        cancelledTickets.push(cancelled);
      } catch (error) {
        errors.push({
          ticketId: ticket.id,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return {
      processedCount: expiredDrafts.length,
      cancelledTickets,
      errors,
    };
  }

  /**
   * Checks if a ticket should be auto-cancelled based on age
   * Pure function for testing
   */
  static shouldCancelDraft(
    ticket: { status: string; paymentStatus: string; createdAt: Date },
    maxAgeHours: number = 24,
    currentTime: Date = new Date()
  ): boolean {
    if (ticket.status !== 'DRAFT') {
      return false;
    }

    if (ticket.paymentStatus !== 'PENDING') {
      return false;
    }

    const ageMs = currentTime.getTime() - ticket.createdAt.getTime();
    const ageHours = ageMs / (60 * 60 * 1000);

    return ageHours > maxAgeHours;
  }
}

/**
 * Creates a DraftCleanupService instance
 */
export function createDraftCleanupService(maxAgeHours?: number): DraftCleanupService {
  return new DraftCleanupService(maxAgeHours);
}

/**
 * Default draft cleanup service instance
 */
export const draftCleanupService = new DraftCleanupService();
