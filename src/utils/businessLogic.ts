/**
 * Pure business-logic utility functions.
 *
 * All functions are side-effect free and fully typed.
 * They are designed to be unit- and property-tested in isolation.
 */

import type { Product, NavItem } from '../types';
import { NEON_GREEN, SOFT_RED } from './tokens';

// ─────────────────────────────────────────────────────────────────────────────
// Stock alerts
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the count of products whose `stockCount` is strictly below the
 * given `threshold`.
 *
 * **Property 1:** `result === products.filter(p => p.stockCount < threshold).length`
 *
 * @param products  Full product catalogue to check.
 * @param threshold Minimum acceptable stock level (exclusive lower bound).
 * @returns         Number of products below the threshold.
 */
export function computeStockAlertCount(
  products: Product[],
  threshold: number,
): number {
  return products.filter((p) => p.stockCount < threshold).length;
}

// ─────────────────────────────────────────────────────────────────────────────
// Row emphasis
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a new array where each product is augmented with an `emphasized`
 * boolean flag.
 *
 * `emphasized` is `true` when `aiForecasterDays <= 7`, otherwise `false`.
 *
 * **Property 2:** Every product with `aiForecasterDays <= 7` has
 * `emphasized === true`; every other product has `emphasized === false`.
 *
 * @param products  List of products to annotate.
 * @returns         New array — original objects are not mutated.
 */
export function applyRowEmphasis(
  products: Product[],
): (Product & { emphasized: boolean })[] {
  return products.map((p) => ({
    ...p,
    emphasized: p.aiForecasterDays <= 7,
  }));
}

// ─────────────────────────────────────────────────────────────────────────────
// Status badge color
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the CSS color string for a product's status badge.
 *
 * - `'healthy'`   → `NEON_GREEN` (`#39FF14`)
 * - `'low_stock'` → `SOFT_RED`   (`#FF6B6B`)
 *
 * **Property 3:** Badge color maps correctly to stock level.
 *
 * @param status  Product status value.
 * @returns       Hex color string from design tokens.
 */
export function getStatusBadgeColor(status: Product['status']): string {
  switch (status) {
    case 'healthy':
      return NEON_GREEN;
    case 'low_stock':
      return SOFT_RED;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Trend direction
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Derives the trend direction from a percentage change value.
 *
 * - `trendPercent > 0`  → `'up'`
 * - `trendPercent < 0`  → `'down'`
 * - `trendPercent === 0` → `'neutral'`
 *
 * **Property 4:** Trend direction agrees with the sign of `trendPercent`.
 *
 * @param trendPercent  Signed percentage (e.g. `12.5` for +12.5%).
 * @returns             `'up'`, `'down'`, or `'neutral'`.
 */
export function deriveTrendDirection(
  trendPercent: number,
): 'up' | 'down' | 'neutral' {
  if (trendPercent > 0) return 'up';
  if (trendPercent < 0) return 'down';
  return 'neutral';
}

// ─────────────────────────────────────────────────────────────────────────────
// Active nav item
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns a new array of `NavItem`s where exactly one item — the one whose
 * `path` matches the supplied `path` argument — has `active === true`.
 *
 * If no item matches, all items are returned with `active === false`.
 *
 * **Property 5:** Active nav item is always the current route — exactly one
 * item has `active === true` and its `path` equals the input path.
 *
 * @param items  Navigation items to annotate.
 * @param path   Current URL pathname.
 * @returns      New array — original objects are not mutated.
 */
export function markActiveNavItem(
  items: NavItem[],
  path: string,
): (NavItem & { active: boolean })[] {
  return items.map((item) => ({
    ...item,
    active: item.path === path,
  }));
}
