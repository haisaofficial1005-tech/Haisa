/**
 * User service for authentication operations
 * Requirements: 1.2 - Create or retrieve customer profile on successful auth
 */

import { randomUUID } from 'crypto';

export interface GoogleUserData {
  email: string;
  name: string;
  image?: string | null;
}

export type UserRole = 'CUSTOMER' | 'AGENT' | 'ADMIN';

export interface AuthenticatedUser {
  id: string;
  email: string;
  emailVerified: Date | null;
  name: string;
  image: string | null;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Repository interface for user persistence
 * This allows for dependency injection and testing
 */
export interface UserRepository {
  findByEmail(email: string): Promise<AuthenticatedUser | null>;
  findById(id: string): Promise<AuthenticatedUser | null>;
  create(data: {
    email: string;
    name: string;
    image: string | null;
    role: UserRole;
  }): Promise<AuthenticatedUser>;
  deleteMany(filter?: { email?: string; id?: string }): Promise<void>;
}

/**
 * Finds or creates a user based on Google OAuth data.
 * This implements the idempotent authentication behavior:
 * - First authentication: creates a new user with CUSTOMER role
 * - Subsequent authentications: retrieves the existing user
 * 
 * Property 1: User Authentication Idempotence
 * For any valid Google user data, authenticating multiple times SHALL either
 * create a new user (first time) or retrieve the existing user, and the result
 * SHALL be the same user record.
 * 
 * @param googleData - User data from Google OAuth
 * @param repository - User repository for persistence
 * @returns The authenticated user (created or retrieved)
 */
export async function findOrCreateUser(
  googleData: GoogleUserData,
  repository: UserRepository
): Promise<AuthenticatedUser> {
  const { email, name, image } = googleData;

  // Try to find existing user by email (unique identifier)
  const existingUser = await repository.findByEmail(email);

  if (existingUser) {
    return existingUser;
  }

  // Create new user with default CUSTOMER role
  const newUser = await repository.create({
    email,
    name,
    image: image ?? null,
    role: 'CUSTOMER',
  });

  return newUser;
}

/**
 * Creates an in-memory user repository for testing
 * This allows property tests to run without a database
 */
export function createInMemoryUserRepository(): UserRepository {
  const users = new Map<string, AuthenticatedUser>();

  return {
    async findByEmail(email: string): Promise<AuthenticatedUser | null> {
      const allUsers = Array.from(users.values());
      for (const user of allUsers) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    },

    async findById(id: string): Promise<AuthenticatedUser | null> {
      return users.get(id) ?? null;
    },

    async create(data: {
      email: string;
      name: string;
      image: string | null;
      role: UserRole;
    }): Promise<AuthenticatedUser> {
      const now = new Date();
      const user: AuthenticatedUser = {
        id: randomUUID(),
        email: data.email,
        emailVerified: null,
        name: data.name,
        image: data.image,
        role: data.role,
        createdAt: now,
        updatedAt: now,
      };
      users.set(user.id, user);
      return user;
    },

    async deleteMany(filter?: { email?: string; id?: string }): Promise<void> {
      if (!filter) {
        users.clear();
        return;
      }
      const entries = Array.from(users.entries());
      for (const [id, user] of entries) {
        if (filter.email && user.email === filter.email) {
          users.delete(id);
        }
        if (filter.id && user.id === filter.id) {
          users.delete(id);
        }
      }
    },
  };
}
