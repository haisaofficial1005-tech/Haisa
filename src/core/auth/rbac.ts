/**
 * Role-Based Access Control (RBAC)
 * Requirements: 7.1, 8.1, 9.1, 9.4
 */

// Type alias (SQLite uses strings instead of enums)
type UserRole = string;

export interface User {
  id: string;
  role: UserRole;
}

export interface Ticket {
  id: string;
  customerId: string;
  assignedAgentId: string | null;
}

export type Permission = 
  | 'ticket:read'
  | 'ticket:read:own'
  | 'ticket:read:assigned'
  | 'ticket:read:all'
  | 'ticket:create'
  | 'ticket:update'
  | 'ticket:update:status'
  | 'ticket:assign'
  | 'user:manage';

/**
 * Role permissions mapping
 */
const rolePermissions: Record<UserRole, Permission[]> = {
  CUSTOMER: [
    'ticket:read:own',
    'ticket:create',
  ],
  AGENT: [
    'ticket:read:own',
    'ticket:read:assigned',
    'ticket:update:status',
  ],
  ADMIN: [
    'ticket:read:all',
    'ticket:create',
    'ticket:update',
    'ticket:update:status',
    'ticket:assign',
    'user:manage',
  ],
};

/**
 * Checks if a user has a specific permission
 */
export function hasPermission(user: User, permission: Permission): boolean {
  const permissions = rolePermissions[user.role] || [];
  return permissions.includes(permission);
}

/**
 * Checks if a user can access a specific ticket
 * Property 17: RBAC Access Control
 * 
 * - CUSTOMER: can only access tickets where ticket.customerId equals user.id
 * - AGENT: can access tickets where ticket.assignedAgentId equals user.id OR ticket is unassigned
 * - ADMIN: can access all tickets
 */
export function canAccessTicket(user: User, ticket: Ticket): boolean {
  switch (user.role) {
    case 'CUSTOMER':
      return ticket.customerId === user.id;
    
    case 'AGENT':
      return ticket.assignedAgentId === user.id || ticket.assignedAgentId === null;
    
    case 'ADMIN':
      return true;
    
    default:
      return false;
  }
}

/**
 * Filters tickets based on user role
 * Property 17: RBAC Access Control
 */
export function filterTicketsForUser<T extends Ticket>(user: User, tickets: T[]): T[] {
  return tickets.filter(ticket => canAccessTicket(user, ticket));
}

/**
 * Builds a Prisma where clause for ticket queries based on user role
 */
export function buildTicketWhereClause(user: User): Record<string, unknown> {
  switch (user.role) {
    case 'CUSTOMER':
      return { customerId: user.id };
    
    case 'AGENT':
      return {
        OR: [
          { assignedAgentId: user.id },
          { assignedAgentId: null },
        ],
      };
    
    case 'ADMIN':
      return {}; // No filter - admin sees all
    
    default:
      return { id: 'impossible' }; // Return nothing for unknown roles
  }
}

/**
 * Checks if a user can update a ticket's status
 */
export function canUpdateTicketStatus(user: User, ticket: Ticket): boolean {
  if (user.role === 'ADMIN') {
    return true;
  }
  
  if (user.role === 'AGENT') {
    return ticket.assignedAgentId === user.id;
  }
  
  return false;
}

/**
 * Checks if a user can assign agents to tickets
 */
export function canAssignAgent(user: User): boolean {
  return user.role === 'ADMIN';
}

/**
 * Checks if a user can add attachments to a ticket
 */
export function canAddAttachment(user: User, ticket: Ticket): boolean {
  if (user.role === 'CUSTOMER') {
    return ticket.customerId === user.id;
  }
  
  if (user.role === 'AGENT' || user.role === 'ADMIN') {
    return canAccessTicket(user, ticket);
  }
  
  return false;
}

/**
 * Gets the list of permissions for a role
 */
export function getPermissionsForRole(role: UserRole): Permission[] {
  return rolePermissions[role] || [];
}
