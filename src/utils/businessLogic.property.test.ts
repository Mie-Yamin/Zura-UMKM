/**
 * Property-based tests for business logic utilities.
 *
 * Uses fast-check to verify universal behavioral invariants across
 * all valid inputs. Each property runs a minimum of 100 iterations.
 *
 * Validates: Requirements 1.3, 1.5, 3.3, 3.6, 3.7, 5.4, 5.6
 */

import { describe, it } from 'vitest';
import * as fc from 'fast-check';
import React from 'react';
import {
  computeStockAlertCount,
  applyRowEmphasis,
  getStatusBadgeColor,
  deriveTrendDirection,
  markActiveNavItem,
} from './businessLogic';
import { NEON_GREEN, SOFT_RED } from './tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Shared arbitraries
// ─────────────────────────────────────────────────────────────────────────────

/** Arbitrary for a single Product record. */
const productArb = fc.record({
  id: fc.string(),
  name: fc.string(),
  sku: fc.string(),
  status: fc.constantFrom('healthy' as const, 'low_stock' as const),
  stockCount: fc.integer({ min: 0, max: 1000 }),
  aiForecasterDays: fc.integer({ min: 0, max: 60 }),
});

/** Arbitrary for a NavItem record. */
const navItemArb = fc.record({
  id: fc.string(),
  label: fc.string(),
  path: fc.string(),
  icon: fc.constant((() => null) as React.ComponentType<{ className?: string }>),
});

// ─────────────────────────────────────────────────────────────────────────────
// Test suite
// ─────────────────────────────────────────────────────────────────────────────

describe('Business Logic Properties', () => {
  // ───────────────────────────────────────────────────────────────────────────
  // Property 1: Stock-alert badge reflects actual low-stock count
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 1: Stock-alert badge reflects actual low-stock count', () => {
    /**
     * **Validates: Requirements 3.6, 3.7**
     *
     * For any product list and threshold, `computeStockAlertCount` must equal
     * the number of products whose `stockCount` is strictly below the threshold.
     */
    it('computeStockAlertCount result equals products.filter(p => p.stockCount < threshold).length', () => {
      fc.assert(
        fc.property(
          fc.array(productArb),
          fc.integer({ min: 0, max: 500 }),
          (products, threshold) => {
            const result = computeStockAlertCount(products, threshold);
            const expected = products.filter((p) => p.stockCount < threshold).length;
            return result === expected;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 2: AI Forecast row emphasis is consistent with threshold
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 2: AI Forecast row emphasis is consistent with threshold', () => {
    /**
     * **Validates: Requirements 5.6**
     *
     * After `applyRowEmphasis`, every product with `aiForecasterDays <= 7`
     * must have `emphasized === true` and all others `emphasized === false`.
     * The output length must equal the input length.
     */
    it('products with aiForecasterDays <= 7 are emphasized, all others are not', () => {
      fc.assert(
        fc.property(fc.array(productArb), (products) => {
          const result = applyRowEmphasis(products);

          // Length is preserved
          if (result.length !== products.length) return false;

          // Each product's emphasis flag matches the threshold rule
          return result.every((p) => {
            if (p.aiForecasterDays <= 7) return p.emphasized === true;
            return p.emphasized === false;
          });
        }),
        { numRuns: 100 },
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 3: Product status badge maps correctly to stock level
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 3: Product status badge maps correctly to stock level', () => {
    /**
     * **Validates: Requirements 5.4**
     *
     * `getStatusBadgeColor('healthy')` must return NEON_GREEN and
     * `getStatusBadgeColor('low_stock')` must return SOFT_RED.
     */
    it('healthy status returns NEON_GREEN and low_stock returns SOFT_RED', () => {
      fc.assert(
        fc.property(
          fc.constantFrom('healthy' as const, 'low_stock' as const),
          (status) => {
            const color = getStatusBadgeColor(status);
            if (status === 'healthy') return color === NEON_GREEN;
            return color === SOFT_RED;
          },
        ),
        { numRuns: 100 },
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 4: Revenue trend direction agrees with data
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 4: Revenue trend direction agrees with data', () => {
    /**
     * **Validates: Requirements 3.3**
     *
     * `deriveTrendDirection` must return 'up' for positive values,
     * 'down' for negative values, and 'neutral' for zero.
     */
    it('positive trendPercent yields "up"', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(0.001), max: Math.fround(1000), noNaN: true }),
          (trendPercent) => deriveTrendDirection(trendPercent) === 'up',
        ),
        { numRuns: 100 },
      );
    });

    it('negative trendPercent yields "down"', () => {
      fc.assert(
        fc.property(
          fc.float({ min: Math.fround(-1000), max: Math.fround(-0.001), noNaN: true }),
          (trendPercent) => deriveTrendDirection(trendPercent) === 'down',
        ),
        { numRuns: 100 },
      );
    });

    it('zero trendPercent yields "neutral"', () => {
      const result = deriveTrendDirection(0);
      if (result !== 'neutral') throw new Error(`Expected 'neutral', got '${result}'`);
    });

    it('integer trendPercent respects sign-to-direction mapping', () => {
      fc.assert(
        fc.property(fc.integer(), (trendPercent) => {
          const direction = deriveTrendDirection(trendPercent);
          if (trendPercent > 0) return direction === 'up';
          if (trendPercent < 0) return direction === 'down';
          return direction === 'neutral';
        }),
        { numRuns: 100 },
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────────────
  // Property 5: Active nav item is always the current route
  // ───────────────────────────────────────────────────────────────────────────
  describe('Property 5: Active nav item is always the current route', () => {
    /**
     * **Validates: Requirements 1.3, 1.5**
     *
     * After `markActiveNavItem`, exactly one item must have `active === true`
     * and its `path` must match the input path, provided the path exists
     * in the items list.
     */
    it('exactly one item is active and its path matches the input path', () => {
      fc.assert(
        fc.property(
          fc.array(navItemArb, { minLength: 1 }),
          (items) =>
            fc.sample(fc.integer({ min: 0, max: items.length - 1 }), 1).map((index) => {
              const activePath = items[index].path;
              const result = markActiveNavItem(items, activePath);

              const activeItems = result.filter((item) => item.active);

              // When the path matches at least one item, check active count
              // (if path is duplicated across items, all matching items will be active)
              const matchingPaths = items.filter((item) => item.path === activePath);

              // Every item with the active path should be active
              const allMatchingAreActive = result
                .filter((item) => item.path === activePath)
                .every((item) => item.active);

              // Every item without the active path should NOT be active
              const allNonMatchingAreInactive = result
                .filter((item) => item.path !== activePath)
                .every((item) => !item.active);

              // Active count equals matching paths count
              const activeCountCorrect = activeItems.length === matchingPaths.length;

              return allMatchingAreActive && allNonMatchingAreInactive && activeCountCorrect;
            })[0],
        ),
        { numRuns: 100 },
      );
    });
  });
});
