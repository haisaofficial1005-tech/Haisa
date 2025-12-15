/**
 * Property-based tests for user authentication
 * 
 * **Feature: haisa-wa, Property 1: User Authentication Idempotence**
 * 
 * For any valid Google user data, authenticating multiple times SHALL either
 * create a new user (first time) or retrieve the existing user, and the result
 * SHALL be the same user record.
 * 
 * **Validates: Requirements 1.2**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  findOrCreateUser,
  createInMemoryUserRepository,
  type GoogleUserData,
  type UserRepository,
} from '../user.service';
import { DEFAULT_NUM_RUNS, validEmailArb, validNameArb } from '@/test/helpers';

/**
 * Arbitrary for generating valid Google user data
 */
const googleUserDataArb: fc.Arbitrary<GoogleUserData> = fc.record({
  email: validEmailArb,
  name: validNameArb,
  image: fc.option(fc.webUrl(), { nil: null }),
});

describe('User Authentication Property Tests', () => {
  let repository: UserRepository;

  beforeEach(() => {
    // Create fresh in-memory repository for each test
    repository = createInMemoryUserRepository();
  });

  /**
   * **Feature: haisa-wa, Property 1: User Authentication Idempotence**
   * 
   * For any valid Google user data, authenticating multiple times SHALL either
   * create a new user (first time) or retrieve the existing user, and the result
   * SHALL be the same user record.
   * 
   * **Validates: Requirements 1.2**
   */
  it('Property 1: User Authentication Idempotence - multiple authentications return same user', async () => {
    await fc.assert(
      fc.asyncProperty(googleUserDataArb, async (googleData) => {
        // Create fresh repository for each property iteration to ensure isolation
        const repo = createInMemoryUserRepository();

        // First authentication - should create user
        const firstAuth = await findOrCreateUser(googleData, repo);
        
        // Verify user was created with correct data
        expect(firstAuth.email).toBe(googleData.email);
        expect(firstAuth.name).toBe(googleData.name);
        expect(firstAuth.role).toBe('CUSTOMER');
        expect(firstAuth.id).toBeDefined();

        // Second authentication - should return same user
        const secondAuth = await findOrCreateUser(googleData, repo);
        
        // Verify idempotence: same user record returned
        expect(secondAuth.id).toBe(firstAuth.id);
        expect(secondAuth.email).toBe(firstAuth.email);
        expect(secondAuth.name).toBe(firstAuth.name);
        expect(secondAuth.role).toBe(firstAuth.role);
        expect(secondAuth.createdAt.getTime()).toBe(firstAuth.createdAt.getTime());

        // Third authentication - should still return same user
        const thirdAuth = await findOrCreateUser(googleData, repo);
        
        // Verify idempotence holds for multiple calls
        expect(thirdAuth.id).toBe(firstAuth.id);
        expect(thirdAuth.email).toBe(firstAuth.email);

        return true;
      }),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });

  /**
   * Additional property: Different users get different IDs
   * This ensures the system correctly distinguishes between different users
   */
  it('Property 1 (corollary): Different users get different IDs', async () => {
    await fc.assert(
      fc.asyncProperty(
        googleUserDataArb,
        googleUserDataArb,
        async (userData1, userData2) => {
          // Skip if emails are the same (would be same user)
          fc.pre(userData1.email !== userData2.email);

          // Create fresh repository for each property iteration
          const repo = createInMemoryUserRepository();

          // Authenticate both users
          const user1 = await findOrCreateUser(userData1, repo);
          const user2 = await findOrCreateUser(userData2, repo);

          // Different users should have different IDs
          expect(user1.id).not.toBe(user2.id);
          expect(user1.email).not.toBe(user2.email);

          return true;
        }
      ),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });
});
