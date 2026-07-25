import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import RestockChartPanel from './RestockChartPanel';
import type { RestockDataPoint } from '../types';

// ─── Browser API Stubs ────────────────────────────────────────────────────────

// Recharts uses ResizeObserver internally; provide a no-op stub for jsdom.
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Recharts may call getBBox on SVG elements during rendering.
Object.defineProperty(SVGElement.prototype, 'getBBox', {
  writable: true,
  value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
});

// ─── Recharts Mock ────────────────────────────────────────────────────────────
// ResponsiveContainer does not size itself in jsdom (no layout engine), so
// we replace it with a plain <div> that passes children through, and stub
// chart primitives to lightweight elements.

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container">{children}</div>
    ),
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-barchart">{children}</div>
    ),
    Bar: ({ name }: { name?: string }) => (
      <div data-testid="recharts-bar" data-name={name} />
    ),
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sampleData: RestockDataPoint[] = [
  { day: 'Mon', quantity: 50 },
  { day: 'Tue', quantity: 30 },
  { day: 'Wed', quantity: 80 },
  { day: 'Thu', quantity: 20 },
  { day: 'Fri', quantity: 60 },
  { day: 'Sat', quantity: 10 },
  { day: 'Sun', quantity: 0 },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('RestockChartPanel', () => {
  // ── 1. Empty-state message renders when data is empty ───────────────────────
  it('renders the empty-state message when data array is empty', () => {
    render(
      <RestockChartPanel data={[]} isLoading={false} ariaLabel="Restock chart" />,
    );

    expect(screen.getByText('No restock plan scheduled')).toBeInTheDocument();
  });

  // ── 2. Empty-state does NOT render when data is provided ────────────────────
  it('does NOT render the empty-state message when data is provided', () => {
    render(
      <RestockChartPanel data={sampleData} isLoading={false} ariaLabel="Restock chart" />,
    );

    expect(screen.queryByText('No restock plan scheduled')).not.toBeInTheDocument();
  });

  // ── 3. aria-label attribute is present on the chart container wrapper div ───
  it('renders the chart container with the provided aria-label', () => {
    const { container } = render(
      <RestockChartPanel
        data={sampleData}
        isLoading={false}
        ariaLabel="Weekly restock plan bar chart"
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-label', 'Weekly restock plan bar chart');
  });

  // ── 4. Loading skeleton renders when isLoading=true ─────────────────────────
  it('renders the loading skeleton when isLoading is true', () => {
    render(
      <RestockChartPanel data={[]} isLoading={true} ariaLabel="Restock chart" />,
    );

    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
  });

  // ── 5. Loading skeleton has role="status" and aria-label="Loading chart" ────
  it('loading skeleton has role="status" and aria-label="Loading chart"', () => {
    render(
      <RestockChartPanel data={[]} isLoading={true} ariaLabel="Restock chart" />,
    );

    const skeleton = screen.getByRole('status', { name: 'Loading chart' });
    expect(skeleton).toHaveAttribute('aria-label', 'Loading chart');
    expect(skeleton).toHaveAttribute('role', 'status');
  });

  // ── 6. aria-label is still on wrapper div in loading state ──────────────────
  it('wrapping div carries aria-label in loading state', () => {
    const { container } = render(
      <RestockChartPanel
        data={[]}
        isLoading={true}
        ariaLabel="My restock chart"
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-label', 'My restock chart');
  });
});
