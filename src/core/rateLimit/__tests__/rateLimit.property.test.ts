/**
 * Rate Limiting Property Tests
 * **Feature: haisa-wa, Property 21: Rate Limiting**
 * **Validates: Requirements 12.1**
 */

import { describe, it, expect, beforeEach } from 'vitest';
import * as fc from 'fast-check';
import {
  checkRateLimit,
  recordRequest,
  resetRateLimit,
  clearAllRateLimits,
  getRateLimitStatus,
  type RateLimitConfig,
} from '../rateLimit';

// Test configuration with shorter window for faster tests
const testConfig: RateLimitConfig = {
  maxRequests: 5,
  windowMs: 1000, // 1 second for testing
};

// Arbitraries
const identifierArb = fc.uuid();
const maxRequestsArb = fc.integer({ min: 1, max: 100 });
const windowMsArb = fc.integer({ min: 100, max: 10000 });

const configArb = fc.record({
  maxRequests: maxRequestsArb,
  windowMs: windowMsArb,
});

describe('Rate Limiting', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21a: First request is always allowed
   * *For any* customer identifier, the first request SHALL be allowed
   */
  it('Property 21a: first request is always allowed', () => {
    fc.assert(
      fc.property(identifierArb, configArb, (identifier, config) => {
        clearAllRateLimits();
        
        const result = checkRateLimit(identifier, config);
        
        expect(result.allowed).toBe(true);
        // remaining is maxRequests - 1 because checkRateLimit doesn't record, 
        // but we're checking before any request is recorded
        expect(result.remaining).toBe(config.maxRequests);
      }),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21b: Requests up to limit are allowed
   * *For any* customer, requests up to maxRequests SHALL be allowed
   */
  it('Property 21b: requests up to limit are allowed', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 10 }),
        (identifier, maxRequests) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          // Make maxRequests requests
          for (let i = 0; i < maxRequests; i++) {
            const result = checkRateLimit(identifier, config);
            expect(result.allowed).toBe(true);
            recordRequest(identifier, config);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21c: Request exceeding limit is rejected
   * *For any* customer who has submitted more than N tickets within time window T,
   * subsequent submissions SHALL be rejected
   */
  it('Property 21c: request exceeding limit is rejected', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 10 }),
        (identifier, maxRequests) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          // Make maxRequests requests (all should be allowed)
          for (let i = 0; i < maxRequests; i++) {
            checkRateLimit(identifier, config);
            recordRequest(identifier, config);
          }
          
          // Next request should be rejected
          const result = checkRateLimit(identifier, config);
          expect(result.allowed).toBe(false);
          expect(result.remaining).toBe(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21d: Different identifiers have independent limits
   * *For any* two different customers, their rate limits SHALL be independent
   */
  it('Property 21d: different identifiers have independent limits', () => {
    fc.assert(
      fc.property(
        identifierArb,
        identifierArb,
        fc.integer({ min: 1, max: 5 }),
        (id1, id2, maxRequests) => {
          // Skip if identifiers are the same
          fc.pre(id1 !== id2);
          
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          // Exhaust limit for id1
          for (let i = 0; i < maxRequests; i++) {
            checkRateLimit(id1, config);
            recordRequest(id1, config);
          }
          
          // id1 should be rate limited
          expect(checkRateLimit(id1, config).allowed).toBe(false);
          
          // id2 should still be allowed
          expect(checkRateLimit(id2, config).allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21e: Remaining count decreases with each request
   * *For any* sequence of requests, remaining count SHALL decrease by 1 each time
   */
  it('Property 21e: remaining count decreases with each request', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 2, max: 10 }),
        (identifier, maxRequests) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          for (let i = 0; i < maxRequests; i++) {
            const result = checkRateLimit(identifier, config);
            
            // Before recording, remaining should be maxRequests - i (requests already recorded)
            expect(result.remaining).toBe(maxRequests - i);
            
            recordRequest(identifier, config);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21f: Reset clears rate limit for identifier
   * *For any* rate-limited customer, resetting SHALL allow new requests
   */
  it('Property 21f: reset clears rate limit for identifier', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 5 }),
        (identifier, maxRequests) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          // Exhaust limit
          for (let i = 0; i < maxRequests; i++) {
            checkRateLimit(identifier, config);
            recordRequest(identifier, config);
          }
          
          // Should be rate limited
          expect(checkRateLimit(identifier, config).allowed).toBe(false);
          
          // Reset
          resetRateLimit(identifier);
          
          // Should be allowed again
          expect(checkRateLimit(identifier, config).allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21g: Status accurately reflects request count
   * *For any* number of requests, status SHALL accurately report count
   */
  it('Property 21g: status accurately reflects request count', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 10 }),
        fc.integer({ min: 1, max: 5 }),
        (identifier, maxRequests, requestCount) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          const actualRequests = Math.min(requestCount, maxRequests);
          
          // Make some requests
          for (let i = 0; i < actualRequests; i++) {
            checkRateLimit(identifier, config);
            recordRequest(identifier, config);
          }
          
          const status = getRateLimitStatus(identifier, config);
          
          expect(status.requestsInWindow).toBe(actualRequests);
          expect(status.remaining).toBe(Math.max(0, maxRequests - actualRequests));
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21h: Reset time is in the future when rate limited
   * *For any* rate-limited request, resetAt SHALL be in the future
   */
  it('Property 21h: reset time is in the future when rate limited', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 5 }),
        (identifier, maxRequests) => {
          clearAllRateLimits();
          const config: RateLimitConfig = { maxRequests, windowMs: 10000 };
          
          // Exhaust limit
          for (let i = 0; i < maxRequests; i++) {
            checkRateLimit(identifier, config);
            recordRequest(identifier, config);
          }
          
          const now = Date.now();
          const result = checkRateLimit(identifier, config);
          
          expect(result.allowed).toBe(false);
          expect(result.resetAt).toBeGreaterThan(now);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * **Feature: haisa-wa, Property 21: Rate Limiting**
   * 
   * Property 21i: Sliding window behavior - old requests expire
   */
  it('Property 21i: sliding window allows requests after window expires', async () => {
    const identifier = 'test-sliding-window';
    const config: RateLimitConfig = { maxRequests: 2, windowMs: 50 }; // 50ms window
    
    clearAllRateLimits();
    
    // Make 2 requests (exhaust limit)
    checkRateLimit(identifier, config);
    recordRequest(identifier, config);
    checkRateLimit(identifier, config);
    recordRequest(identifier, config);
    
    // Should be rate limited
    expect(checkRateLimit(identifier, config).allowed).toBe(false);
    
    // Wait for window to expire
    await new Promise(resolve => setTimeout(resolve, 60));
    
    // Should be allowed again
    expect(checkRateLimit(identifier, config).allowed).toBe(true);
  });
});

describe('Rate Limit Configuration', () => {
  beforeEach(() => {
    clearAllRateLimits();
  });

  /**
   * Property: Different configs produce different behaviors
   */
  it('different max requests produce different limits', () => {
    fc.assert(
      fc.property(
        identifierArb,
        fc.integer({ min: 1, max: 5 }),
        fc.integer({ min: 6, max: 10 }),
        (identifier, smallLimit, largeLimit) => {
          clearAllRateLimits();
          
          const smallConfig: RateLimitConfig = { maxRequests: smallLimit, windowMs: 10000 };
          const largeConfig: RateLimitConfig = { maxRequests: largeLimit, windowMs: 10000 };
          
          // Exhaust small limit
          for (let i = 0; i < smallLimit; i++) {
            checkRateLimit(identifier, smallConfig);
            recordRequest(identifier, smallConfig);
          }
          
          // Small config should be exhausted
          expect(checkRateLimit(identifier, smallConfig).allowed).toBe(false);
          
          // Large config should still have room
          expect(checkRateLimit(identifier, largeConfig).allowed).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
