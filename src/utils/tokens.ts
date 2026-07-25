/**
 * Design token constants.
 *
 * These typed constants mirror the CSS custom properties in
 * `src/styles/tokens.css` so that component logic can reference
 * design tokens without magic strings.
 */

export const DEEP_TEAL = '#0D7377';
export const NEON_GREEN = '#39FF14';
export const SOFT_RED = '#FF6B6B';
export const SURFACE = '#FFFFFF';
export const BORDER = '#E5E7EB';
export const TEXT_PRIMARY = '#111827';
export const TEXT_SECONDARY = '#6B7280';

/** Grouped color palette for convenient destructuring or spread. */
export const COLORS = {
  deepTeal: DEEP_TEAL,
  neonGreen: NEON_GREEN,
  softRed: SOFT_RED,
  surface: SURFACE,
  border: BORDER,
  textPrimary: TEXT_PRIMARY,
  textSecondary: TEXT_SECONDARY,
} as const;
