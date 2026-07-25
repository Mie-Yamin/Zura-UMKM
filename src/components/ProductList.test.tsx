import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import ProductList from './ProductList';
import type { Product } from '../types';
import { NEON_GREEN, SOFT_RED } from '../utils/tokens';

// ─── Color Helpers ────────────────────────────────────────────────────────────
// jsdom converts inline hex colors to rgb() when reading back from .style,
// so we normalize both sides before comparing.

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

// ─── Sample Data ──────────────────────────────────────────────────────────────

const sampleProducts: Product[] = [
  {
    id: '1',
    name: 'Indomie Goreng',
    sku: 'IG-001',
    status: 'healthy',
    stockCount: 100,
    aiForecasterDays: 14,
  },
  {
    id: '2',
    name: 'Aqua Galon',
    sku: 'AG-002',
    status: 'low_stock',
    stockCount: 5,
    aiForecasterDays: 3,
  },
  {
    id: '3',
    name: 'Teh Botol',
    sku: 'TB-003',
    status: 'healthy',
    stockCount: 50,
    aiForecasterDays: 10,
  },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ProductList', () => {
  // ── 1. Renders 4 column headers ───────────────────────────────────────────
  it('renders 4 column headers: Product, SKU, Status, AI Forecast', () => {
    render(<ProductList products={sampleProducts} isLoading={false} />);

    expect(screen.getByText('Product')).toBeInTheDocument();
    expect(screen.getByText('SKU')).toBeInTheDocument();
    expect(screen.getByText('Status')).toBeInTheDocument();
    expect(screen.getByText('AI Forecast')).toBeInTheDocument();
  });

  // ── 2. Shows 5 skeleton rows when isLoading=true ──────────────────────────
  it('renders 5 skeleton rows when isLoading is true', () => {
    render(<ProductList products={[]} isLoading={true} />);

    const skeletonRows = screen.getAllByTestId('skeleton-row');
    expect(skeletonRows).toHaveLength(5);
  });

  it('does not render product data when isLoading is true', () => {
    render(<ProductList products={sampleProducts} isLoading={true} />);

    expect(screen.queryByText('Indomie Goreng')).not.toBeInTheDocument();
  });

  // ── 3. Soft_Red row emphasis applied when aiForecasterDays <= 7 ───────────
  it('applies Soft_Red border to row when aiForecasterDays <= 7', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    // "Aqua Galon" has aiForecasterDays=3 — should be emphasized
    const rows = container.querySelectorAll('tbody tr');
    const aquaRow = Array.from(rows).find((row) =>
      row.textContent?.includes('Aqua Galon'),
    ) as HTMLElement | undefined;

    expect(aquaRow).toBeDefined();
    // jsdom converts hex colors to rgb() in computed styles; accept both forms
    const borderLeft = aquaRow!.style.borderLeft;
    const softRedRgb = hexToRgb(SOFT_RED);
    expect(
      borderLeft.includes(SOFT_RED) || borderLeft.includes(softRedRgb),
    ).toBe(true);
  });

  // ── 4. No Soft_Red row emphasis when aiForecasterDays > 7 ────────────────
  it('does not apply Soft_Red border to rows when aiForecasterDays > 7', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    // "Indomie Goreng" has aiForecasterDays=14 — should NOT be emphasized
    const rows = container.querySelectorAll('tbody tr');
    const indomieRow = Array.from(rows).find((row) =>
      row.textContent?.includes('Indomie Goreng'),
    ) as HTMLElement | undefined;

    expect(indomieRow).toBeDefined();
    expect(indomieRow!.style.borderLeft).toBe('');
  });

  // ── 5. Neon_Green badge rendered for "healthy" status ─────────────────────
  it('renders a Neon_Green badge for "healthy" status', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    const neonGreenRgb = hexToRgb(NEON_GREEN);
    // Find a "Healthy" badge span and check its background color (hex or rgb)
    const badges = container.querySelectorAll('span');
    const healthyBadge = Array.from(badges).find(
      (badge) =>
        badge.textContent === 'Healthy' &&
        (badge.style.backgroundColor === NEON_GREEN ||
          badge.style.backgroundColor === neonGreenRgb),
    );

    expect(healthyBadge).toBeDefined();
  });

  // ── 6. Soft_Red badge rendered for "low_stock" status ────────────────────
  it('renders a Soft_Red badge for "low_stock" status', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    const softRedRgb = hexToRgb(SOFT_RED);
    // Find the "Low Stock" badge span and check its background color (hex or rgb)
    const badges = container.querySelectorAll('span');
    const lowStockBadge = Array.from(badges).find(
      (badge) =>
        badge.textContent === 'Low Stock' &&
        (badge.style.backgroundColor === SOFT_RED ||
          badge.style.backgroundColor === softRedRgb),
    );

    expect(lowStockBadge).toBeDefined();
  });

  // ── 7. <th> elements present with scope="col" for screen readers ──────────
  it('renders <th> elements with scope="col" for screen reader support', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    const headers = container.querySelectorAll('th[scope="col"]');
    expect(headers).toHaveLength(4);
  });

  // ── 8. aria-label present on the table element ────────────────────────────
  it('has aria-label="Product inventory table" on the <table> element', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    const table = container.querySelector('table');
    expect(table).toHaveAttribute('aria-label', 'Product inventory table');
  });

  // ── 9. "–" displayed for missing/zero aiForecasterDays ───────────────────
  it('renders "–" when aiForecasterDays is 0', () => {
    const productWithZeroDays: Product[] = [
      {
        id: '4',
        name: 'Mie Sedap',
        sku: 'MS-004',
        status: 'healthy',
        stockCount: 30,
        aiForecasterDays: 0,
      },
    ];

    render(<ProductList products={productWithZeroDays} isLoading={false} />);

    // The dash character should be rendered in the AI Forecast cell
    expect(screen.getByText('–')).toBeInTheDocument();
  });

  it('renders "–" when aiForecasterDays is undefined/null', () => {
    const productWithNullDays = [
      {
        id: '5',
        name: 'Kopi Kapal Api',
        sku: 'KKA-005',
        status: 'healthy' as const,
        stockCount: 20,
        aiForecasterDays: null as unknown as number,
      },
    ];

    render(<ProductList products={productWithNullDays} isLoading={false} />);

    expect(screen.getByText('–')).toBeInTheDocument();
  });

  // ── Additional: product data renders correctly when not loading ───────────
  it('renders product names when isLoading is false', () => {
    render(<ProductList products={sampleProducts} isLoading={false} />);

    expect(screen.getByText('Indomie Goreng')).toBeInTheDocument();
    expect(screen.getByText('Aqua Galon')).toBeInTheDocument();
    expect(screen.getByText('Teh Botol')).toBeInTheDocument();
  });

  it('renders SKUs in monospace font style', () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );

    const skuCell = screen.getByText('IG-001');
    expect(skuCell.className).toContain('font-mono');
  });

  it('renders AI Forecast with brain emoji and days for valid aiForecasterDays', () => {
    render(<ProductList products={sampleProducts} isLoading={false} />);

    // "Indomie Goreng" has 14 days
    expect(screen.getByText('🧠 14 days')).toBeInTheDocument();
  });
});
