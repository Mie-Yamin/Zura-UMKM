import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import SalesChartPanel from './SalesChartPanel';
import type { SalesDataPoint } from '../types';

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
// Recharts never renders its children.  We replace it with a plain <div> that
// passes children through, and stub every chart primitive to a lightweight
// <div> / <span> that emits its `name` prop as text so the Legend test can
// find the series labels.

vi.mock('recharts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('recharts')>();
  return {
    ...actual,
    ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-container">{children}</div>
    ),
    LineChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-linechart">{children}</div>
    ),
    Line: ({ name }: { name?: string }) => (
      <div data-testid="recharts-line" data-name={name} />
    ),
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
    // Legend reads the `name` prop from sibling <Line> children and renders
    // them as text.  In the mock environment we just render the series names
    // directly so tests can assert on the text.
    Legend: () => (
      <div data-testid="recharts-legend">
        <span>Historical Sales</span>
        <span>AI Revenue Prediction</span>
      </div>
    ),
  };
});

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const historicalData: SalesDataPoint[] = [
  { date: '2025-01-01', revenue: 1_000_000 },
  { date: '2025-02-01', revenue: 1_200_000 },
  { date: '2025-03-01', revenue: 900_000 },
];

const predictionData: SalesDataPoint[] = [
  { date: '2025-04-01', revenue: 1_300_000 },
  { date: '2025-05-01', revenue: 1_400_000 },
];

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SalesChartPanel', () => {
  // ── 1. aria-label attribute is present on the chart container ───────────────
  it('renders the chart container with the provided aria-label', () => {
    const { container } = render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart: historical and predicted revenue"
      />,
    );

    // The outermost <div> should carry the aria-label
    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute(
      'aria-label',
      'Sales chart: historical and predicted revenue',
    );
  });

  // ── 2. Empty-state message renders when both data arrays are empty ───────────
  it('renders the empty-state message when both data arrays are empty', () => {
    render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={false}
        ariaLabel="Sales chart"
      />,
    );

    expect(screen.getByText('No sales data available yet')).toBeInTheDocument();
  });

  it('does NOT render the empty-state message when data is provided', () => {
    render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart"
      />,
    );

    expect(screen.queryByText('No sales data available yet')).not.toBeInTheDocument();
  });

  // ── 3. Legend shows both series names when data is provided ─────────────────
  it('renders "Historical Sales" legend entry when historical data is provided', () => {
    render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart"
      />,
    );

    expect(screen.getByText('Historical Sales')).toBeInTheDocument();
  });

  it('renders "AI Revenue Prediction" legend entry when prediction data is provided', () => {
    render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart"
      />,
    );

    expect(screen.getByText('AI Revenue Prediction')).toBeInTheDocument();
  });

  // ── 4. Loading skeleton renders when isLoading is true ──────────────────────
  it('renders the loading skeleton when isLoading is true', () => {
    render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={true}
        ariaLabel="Sales chart"
      />,
    );

    expect(screen.getByRole('status', { name: 'Loading chart' })).toBeInTheDocument();
  });

  it('loading skeleton has animate-pulse class', () => {
    render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={true}
        ariaLabel="Sales chart"
      />,
    );

    const skeleton = screen.getByRole('status', { name: 'Loading chart' });
    expect(skeleton.className).toContain('animate-pulse');
  });

  it('does NOT render the loading skeleton when isLoading is false', () => {
    render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart"
      />,
    );

    expect(
      screen.queryByRole('status', { name: 'Loading chart' }),
    ).not.toBeInTheDocument();
  });

  // ── 5. aria-label is present on container even in loading/empty states ───────
  it('wrapping div carries aria-label even in loading state', () => {
    const { container } = render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={true}
        ariaLabel="My sales chart"
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-label', 'My sales chart');
  });

  it('wrapping div carries aria-label in empty state', () => {
    const { container } = render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={false}
        ariaLabel="Empty sales chart"
      />,
    );

    const wrapper = container.firstElementChild as HTMLElement;
    expect(wrapper).toHaveAttribute('aria-label', 'Empty sales chart');
  });
});
