/**
 * Session utilities for authentication
 * Requirements: 1.2, 1.4
 */

import { getServerSession } from 'next-auth';
import { authOptions } from './auth.options';

/**
 * Get the current session on the server side
 * Returns null if not authenticated
 */
export async function getSession() {
  return getServerSession(authOptions);
}

/**
 * Get the current user from session
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession();
  return session?.user ?? null;
}

/**
 * Check if the current user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

/**
 * Check if the current user has a specific role
 */
export async function hasRole(role: 'CUSTOMER' | 'AGENT' | 'ADMIN'): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === role;
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('ADMIN');
}

/**
 * Check if the current user is an agent or admin
 */
export async function isAgentOrAdmin(): Promise<boolean> {
  const user = await getCurrentUser();
  return user?.role === 'AGENT' || user?.role === 'ADMIN';
}
