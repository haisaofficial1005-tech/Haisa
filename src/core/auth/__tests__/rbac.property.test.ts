/**
 * RBAC Property Tests
 * **Feature: haisa-wa, Property 17: RBAC Access Control**
 * **Validates: Requirements 7.1, 8.1, 9.1, 9.4**
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { canAccessTicket, filterTicketsForUser, buildTicketWhereClause } from '../rbac';

// Types
type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';

interface User {
  id: string;
  role: UserRole;
}

interface Ticket {
  id: string;
  customerId: string;
  assignedAgentId: string | null;
}

// Arbitraries
const userIdArb = fc.uuid();
const roleArb = fc.constantFrom<UserRole>('CUSTOMER', 'AGENT', 'ADMIN');

const userArb = fc.record({
  id: userIdArb,
  role: roleArb,
});

const ticketArb = fc.record({
  id: fc.uuid(),
  customerId: userIdArb,
  assignedAgentId: fc.oneof(userIdArb, fc.constant(null)),
});

describe('RBAC Access Control', () => {
  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17a: Customers can only access their own tickets
   * *For any* user with role CUSTOMER, user SHALL only access tickets 
   * where ticket.customerId equals user.id
   */
  it('Property 17a: customers can only access their own tickets', () => {
    fc.assert(
      fc.property(
        userIdArb,
        ticketArb,
        (userId, ticket) => {
          const customer: User = { id: userId, role: 'CUSTOMER' };
          const canAccess = canAccessTicket(customer, ticket);
          
          if (ticket.customerId === userId) {
            expect(canAccess).toBe(true);
          } else {
            expect(canAccess).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17b: Agents can access assigned or unassigned tickets
   * *For any* user with role AGENT, user SHALL only access tickets 
   * where ticket.assignedAgentId equals user.id OR ticket is unassigned
   */
  it('Property 17b: agents can access assigned or unassigned tickets', () => {
    fc.assert(
      fc.property(
        userIdArb,
        ticketArb,
        (userId, ticket) => {
          const agent: User = { id: userId, role: 'AGENT' };
          const canAccess = canAccessTicket(agent, ticket);
          
          const isAssignedToAgent = ticket.assignedAgentId === userId;
          const isUnassigned = ticket.assignedAgentId === null;
          
          if (isAssignedToAgent || isUnassigned) {
            expect(canAccess).toBe(true);
          } else {
            expect(canAccess).toBe(false);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17c: Admins can access all tickets
   * *For any* user with role ADMIN, user SHALL access all tickets
   */
  it('Property 17c: admins can access all tickets', () => {
    fc.assert(
      fc.property(
        userIdArb,
        ticketArb,
        (userId, ticket) => {
          const admin: User = { id: userId, role: 'ADMIN' };
          const canAccess = canAccessTicket(admin, ticket);
          
          expect(canAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17d: Filter preserves only accessible tickets
   * *For any* user and list of tickets, filtering SHALL return only 
   * tickets the user can access
   */
  it('Property 17d: filter preserves only accessible tickets', () => {
    fc.assert(
      fc.property(
        userArb,
        fc.array(ticketArb, { minLength: 0, maxLength: 20 }),
        (user, tickets) => {
          const filtered = filterTicketsForUser(user, tickets);
          
          // All filtered tickets should be accessible
          for (const ticket of filtered) {
            expect(canAccessTicket(user, ticket)).toBe(true);
          }
          
          // All accessible tickets should be in filtered
          for (const ticket of tickets) {
            if (canAccessTicket(user, ticket)) {
              expect(filtered).toContainEqual(ticket);
            }
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17e: Customer filter never returns other customers' tickets
   * *For any* customer and list of tickets, filtering SHALL never return
   * tickets belonging to other customers
   */
  it('Property 17e: customer filter never returns other customers tickets', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(ticketArb, { minLength: 0, maxLength: 20 }),
        (userId, tickets) => {
          const customer: User = { id: userId, role: 'CUSTOMER' };
          const filtered = filterTicketsForUser(customer, tickets);
          
          for (const ticket of filtered) {
            expect(ticket.customerId).toBe(userId);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17f: Agent filter never returns tickets assigned to other agents
   * *For any* agent and list of tickets, filtering SHALL never return
   * tickets assigned to other agents
   */
  it('Property 17f: agent filter never returns tickets assigned to other agents', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(ticketArb, { minLength: 0, maxLength: 20 }),
        (userId, tickets) => {
          const agent: User = { id: userId, role: 'AGENT' };
          const filtered = filterTicketsForUser(agent, tickets);
          
          for (const ticket of filtered) {
            const isAssignedToAgent = ticket.assignedAgentId === userId;
            const isUnassigned = ticket.assignedAgentId === null;
            expect(isAssignedToAgent || isUnassigned).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17g: Admin filter returns all tickets
   * *For any* admin and list of tickets, filtering SHALL return all tickets
   */
  it('Property 17g: admin filter returns all tickets', () => {
    fc.assert(
      fc.property(
        userIdArb,
        fc.array(ticketArb, { minLength: 0, maxLength: 20 }),
        (userId, tickets) => {
          const admin: User = { id: userId, role: 'ADMIN' };
          const filtered = filterTicketsForUser(admin, tickets);
          
          expect(filtered.length).toBe(tickets.length);
          for (const ticket of tickets) {
            expect(filtered).toContainEqual(ticket);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17h: Where clause for customer filters by customerId
   */
  it('Property 17h: where clause for customer filters by customerId', () => {
    fc.assert(
      fc.property(userIdArb, (userId) => {
        const customer: User = { id: userId, role: 'CUSTOMER' };
        const whereClause = buildTicketWhereClause(customer);
        
        expect(whereClause).toHaveProperty('customerId', userId);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 17: RBAC Access Control**
   * 
   * Property 17i: Where clause for admin is empty (no filter)
   */
  it('Property 17i: where clause for admin is empty', () => {
    fc.assert(
      fc.property(userIdArb, (userId) => {
        const admin: User = { id: userId, role: 'ADMIN' };
        const whereClause = buildTicketWhereClause(admin);
        
        expect(Object.keys(whereClause).length).toBe(0);
      }),
      { numRuns: 100 }
    );
  });
});
