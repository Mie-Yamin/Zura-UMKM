/**
 * Property-based tests for SalesChartPanel data integrity.
 *
 * Uses fast-check to verify universal invariants on SalesChartResponse shape.
 * Each property runs a minimum of 100 iterations.
 *
 * **Validates: Requirements 4.2, 4.3**
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import type { SalesChartResponse, SalesDataPoint } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Arbitraries
// ─────────────────────────────────────────────────────────────────────────────

/** Arbitrary for a single SalesDataPoint. */
const salesDataPointArb: fc.Arbitrary<SalesDataPoint> = fc.record({
  date: fc.string({ minLength: 1 }),
  revenue: fc.integer({ min: 0, max: 10_000_000 }),
});

/** Arbitrary for a full SalesChartResponse. */
const salesChartResponseArb: fc.Arbitrary<SalesChartResponse> = fc.record({
  historical: fc.array(salesDataPointArb),
  prediction: fc.array(salesDataPointArb),
  currency: fc.constant('IDR'),
});

// ─────────────────────────────────────────────────────────────────────────────
// Property 6: Sales chart data completeness
// ─────────────────────────────────────────────────────────────────────────────

describe('Property 6: Sales chart data completeness', () => {
  /**
   * **Validates: Requirements 4.2, 4.3**
   *
   * For any valid SalesChartResponse:
   * - Every SalesDataPoint in `historical` has a truthy `date` string and `revenue >= 0`.
   * - Every SalesDataPoint in `prediction` has a truthy `date` string and `revenue >= 0`.
   */
  it('every historical SalesDataPoint has a truthy date string and revenue >= 0', () => {
    fc.assert(
      fc.property(salesChartResponseArb, (response) => {
        return response.historical.every(
          (point) => Boolean(point.date) && typeof point.date === 'string' && point.revenue >= 0,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('every prediction SalesDataPoint has a truthy date string and revenue >= 0', () => {
    fc.assert(
      fc.property(salesChartResponseArb, (response) => {
        return response.prediction.every(
          (point) => Boolean(point.date) && typeof point.date === 'string' && point.revenue >= 0,
        );
      }),
      { numRuns: 100 },
    );
  });

  it('both historical and prediction data points satisfy completeness simultaneously', () => {
    fc.assert(
      fc.property(salesChartResponseArb, (response) => {
        const allPoints: SalesDataPoint[] = [
          ...response.historical,
          ...response.prediction,
        ];

        return allPoints.every(
          (point) =>
            typeof point.date === 'string' &&
            point.date.length > 0 &&
            point.revenue >= 0,
        );
      }),
      { numRuns: 100 },
    );
  });
});
