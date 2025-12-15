/**
 * Test setup verification
 */

import { describe, it, expect } from 'vitest';
import * as fc from 'fast-check';
import { DEFAULT_NUM_RUNS } from './helpers';

describe('Test Infrastructure', () => {
  it('should run basic tests', () => {
    expect(1 + 1).toBe(2);
  });

  it('should run property-based tests with fast-check', () => {
    fc.assert(
      fc.property(fc.integer(), fc.integer(), (a, b) => {
        return a + b === b + a;
      }),
      { numRuns: DEFAULT_NUM_RUNS }
    );
  });
});
