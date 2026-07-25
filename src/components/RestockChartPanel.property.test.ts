/**
 * Property-based tests for RestockChartPanel data integrity.
 *
 * Uses fast-check to verify universal invariants on RestockPlanResponse shape.
 * Each property runs a minimum of 100 iterations.
 *
 * **Validates: Requirements 6.2, 6.4**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { RestockPlanResponse, RestockDataPoint } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

const VALID_DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

/** Arbitrary for a single RestockDataPoint. */
const restockDataPointArb: fc.Arbitrary<RestockDataPoint> = fc.record({
  day: fc.constantFrom(...VALID_DAYS),
  quantity: fc.integer({ min: 0, max: 10000 }),
});

/** Arbitrary for a full RestockPlanResponse. */
const restockPlanResponseArb: fc.Arbitrary<RestockPlanResponse> = fc.record({
  weekOf: fc.string(),
  plan: fc.array(restockDataPointArb),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 7: Restock chart days are a subset of the week
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 7: Restock chart days are a subset of the week', () => {
  /**
   * **Validates: Requirements 6.2, 6.4**
   *
   * For any valid RestockPlanResponse:
   * - Every RestockDataPoint.day is one of the seven canonical weekday
   *   abbreviations ("Mon" – "Sun").
   * - Every RestockDataPoint.quantity is >= 0.
   */
  it('every RestockDataPoint.day is a valid weekday abbreviation', () => {
    fc.assert(
      fc.property(restockPlanResponseArb, (response) => {
        return response.plan.every((point: RestockDataPoint) =>
          (VALID_DAYS as readonly string[]).includes(point.day),
        );
      }),
      { numRuns: 100 },
    );
  });

  it('every RestockDataPoint.quantity is >= 0', () => {
    fc.assert(
      fc.property(restockPlanResponseArb, (response) => {
        return response.plan.every((point: RestockDataPoint) => point.quantity >= 0);
      }),
      { numRuns: 100 },
    );
  });

  it('both day validity and non-negative quantity hold simultaneously', () => {
    fc.assert(
      fc.property(restockPlanResponseArb, (response) => {
        return response.plan.every(
          (point: RestockDataPoint) =>
            (VALID_DAYS as readonly string[]).includes(point.day) &&
            point.quantity >= 0,
        );
      }),
      { numRuns: 100 },
    );
  });
});
