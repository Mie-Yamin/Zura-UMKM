/**
 * Automated Accessibility Tests — UMKM Pulse Dashboard
 *
 * Uses vitest-axe (axe-core) to assert zero ARIA / structural violations.
 *
 * Note: color-contrast rule is disabled because JSDOM does not compute
 * real CSS styles — axe-core cannot evaluate contrast in a headless env.
 * Contrast was audited manually; see src/styles/tokens.css for details.
 *
 * Validates: Requirements 8.1–8.6
 */

import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { axe } from 'vitest-axe';

import NavBar from './NavBar';
import ProductList from './ProductList';
import SalesChartPanel from './SalesChartPanel';
import RestockChartPanel from './RestockChartPanel';

// ─── Browser API Stubs ─────────────────────────────────────────────────────────

global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

Object.defineProperty(SVGElement.prototype, 'getBBox', {
  writable: true,
  value: () => ({ x: 0, y: 0, width: 0, height: 0 }),
});

// ─── Recharts Mock ─────────────────────────────────────────────────────────────

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
    BarChart: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="recharts-barchart">{children}</div>
    ),
    Bar: ({ name }: { name?: string }) => (
      <div data-testid="recharts-bar" data-name={name} />
    ),
    XAxis: () => <div data-testid="recharts-xaxis" />,
    YAxis: () => <div data-testid="recharts-yaxis" />,
    Tooltip: () => <div data-testid="recharts-tooltip" />,
    Legend: () => (
      <div data-testid="recharts-legend">
        <span>Historical Sales</span>
        <span>AI Revenue Prediction</span>
      </div>
    ),
  };
});

// ─── axe Options — disable color-contrast (JSDOM cannot compute CSS styles) ──

const axeOptions = {
  rules: {
    'color-contrast': { enabled: false },
  },
};

// ─── Helpers ───────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: 0,
        // Prevent test noise from background refetches
        staleTime: Infinity,
      },
    },
  });
}

// ─── Fixtures ──────────────────────────────────────────────────────────────────

import type { Product, SalesDataPoint, RestockDataPoint } from '../types';

const sampleProducts: Product[] = [
  { id: '1', name: 'Indomie Goreng', sku: 'IG-001', status: 'healthy', stockCount: 100, aiForecasterDays: 14 },
  { id: '2', name: 'Aqua Galon',    sku: 'AG-002', status: 'low_stock', stockCount: 5, aiForecasterDays: 3 },
];

const historicalData: SalesDataPoint[] = [
  { date: '2025-01-01', revenue: 1_000_000 },
  { date: '2025-02-01', revenue: 1_200_000 },
];

const predictionData: SalesDataPoint[] = [
  { date: '2025-03-01', revenue: 1_300_000 },
];

const restockData: RestockDataPoint[] = [
  { day: 'Mon', quantity: 50 },
  { day: 'Tue', quantity: 30 },
  { day: 'Wed', quantity: 80 },
];

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Accessibility — axe-core violations', () => {
  // ── NavBar ────────────────────────────────────────────────────────────────────
  it('NavBar: zero axe violations', async () => {
    const queryClient = makeQueryClient();
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <NavBar />
        </QueryClientProvider>
      </MemoryRouter>,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  // ── ProductList ───────────────────────────────────────────────────────────────
  it('ProductList: zero axe violations (loaded state)', async () => {
    const { container } = render(
      <ProductList products={sampleProducts} isLoading={false} />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('ProductList: zero axe violations (loading state)', async () => {
    const { container } = render(
      <ProductList products={[]} isLoading={true} />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  // ── SalesChartPanel ───────────────────────────────────────────────────────────
  it('SalesChartPanel: zero axe violations (loaded state)', async () => {
    const { container } = render(
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={false}
        ariaLabel="Sales chart: historical and predicted revenue"
      />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('SalesChartPanel: zero axe violations (loading state)', async () => {
    const { container } = render(
      <SalesChartPanel
        historicalData={[]}
        predictionData={[]}
        isLoading={true}
        ariaLabel="Sales chart"
      />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  // ── RestockChartPanel ─────────────────────────────────────────────────────────
  it('RestockChartPanel: zero axe violations (loaded state)', async () => {
    const { container } = render(
      <RestockChartPanel
        data={restockData}
        isLoading={false}
        ariaLabel="Weekly restock plan bar chart"
      />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  it('RestockChartPanel: zero axe violations (loading state)', async () => {
    const { container } = render(
      <RestockChartPanel data={[]} isLoading={true} ariaLabel="Restock chart" />,
    );
    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });

  // ── DashboardPage — needs QueryClientProvider + mocked API ───────────────────
  it('DashboardPage: zero axe violations', async () => {
    // Mock API hooks to return static data immediately (no network calls)
    vi.mock('../hooks/useKpiSummary', () => ({
      useKpiSummary: () => ({
        data: {
          todayRevenue: {
            value: 4750000,
            currency: 'IDR',
            trend: 'up',
            trendPercent: 12.5,
            sparkline: [3200000, 3500000, 4750000],
          },
          todayTransactions: 142,
          bestSellerProduct: { name: 'Indomie Goreng Spesial', unitsSold: 87 },
          stockAlerts: { count: 3, productIds: ['prod-004'] },
        },
        isLoading: false,
        isError: false,
        refetch: () => {},
      }),
    }));

    vi.mock('../hooks/useSalesChart', () => ({
      useSalesChart: () => ({
        data: { historical: historicalData, prediction: predictionData },
        isLoading: false,
        isError: false,
        refetch: () => {},
      }),
    }));

    vi.mock('../hooks/useInventory', () => ({
      useInventory: () => ({
        data: { products: sampleProducts },
        isLoading: false,
        isError: false,
        refetch: () => {},
      }),
    }));

    vi.mock('../hooks/useRestockPlan', () => ({
      useRestockPlan: () => ({
        data: { plan: restockData },
        isLoading: false,
        isError: false,
        refetch: () => {},
      }),
    }));

    // Dynamically import DashboardPage after mocks are in place
    const { default: DashboardPage } = await import('../pages/DashboardPage');

    const queryClient = makeQueryClient();
    const { container } = render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <DashboardPage />
        </QueryClientProvider>
      </MemoryRouter>,
    );

    const results = await axe(container, axeOptions);
    expect(results).toHaveNoViolations();
  });
});
