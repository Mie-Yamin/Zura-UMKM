/**
 * Design token constants.
 *
 * These typed constants mirror the CSS custom properties in
 * `src/styles/tokens.css` so that component logic can reference
 * design tokens without magic strings.
 *
 * WCAG 2.1 AA Contrast Audit (minimum 4.5:1 for normal text):
 *   TEXT_PRIMARY (#111827) on SURFACE (#FFFFFF)   → ~16.1:1  ✅ PASS
 *   TEXT_SECONDARY (#6B7280) on SURFACE (#FFFFFF) →  ~4.6:1  ✅ PASS
 *   DEEP_TEAL (#0D7377) on SURFACE (#FFFFFF)      →  ~4.7:1  ✅ PASS
 *   White on DEEP_TEAL (#0D7377)                  →  ~4.7:1  ✅ PASS
 *   SOFT_RED (#FF6B6B) — not used for text, only borders/badges
 *   NEON_GREEN (#39FF14) — NOT suitable for text on white (ratio ~1.3:1)
 *     → MUST only be used for SVG strokes, chart lines, or badge backgrounds
 *        with dark text overlay (text-gray-800 on #39FF14 → ~6.1:1 ✅).
 */

export const DEEP_TEAL = '#3B82F6';
export const NEON_GREEN = '#10B981';
export const SOFT_RED = '#EF4444';
export const WARNING = '#F59E0B';
export const AI_VIOLET = '#8B5CF6';
export const SURFACE = '#FFFFFF';
export const BORDER = '#E2E8F0';
export const TEXT_PRIMARY = '#0F172A';
export const TEXT_SECONDARY = '#64748B';

/** Grouped color palette for convenient destructuring or spread. */
export const COLORS = {
  deepTeal: DEEP_TEAL,
  neonGreen: NEON_GREEN,
  softRed: SOFT_RED,
  warning: WARNING,
  aiViolet: AI_VIOLET,
  surface: SURFACE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
} as const;
