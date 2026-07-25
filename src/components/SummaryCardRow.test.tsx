import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import SummaryCardRow from './SummaryCardRow';

// ─── Mock the API client ──────────────────────────────────────────────────────

vi.mock('../api/client', () => ({
  fetchKpiSummary: vi.fn(),
}));

import { fetchKpiSummary } from '../api/client';

// ─── Test helpers ─────────────────────────────────────────────────────────────

const mockKpiData = {
  todayRevenue: {
    value: 4750000,
    currency: 'IDR',
    trend: 'up' as const,
    trendPercent: 12.5,
    sparkline: [3200000, 3500000, 3800000, 4100000, 3950000, 4400000, 4750000],
  },
  todayTransactions: 142,
  bestSellerProduct: {
    name: 'Indomie Goreng Spesial',
    unitsSold: 87,
  },
  stockAlerts: {
    count: 3,
    productIds: ['prod-004', 'prod-007', 'prod-012'],
  },
};

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        // Disable gc delay in tests so cache clears between tests
        gcTime: 0,
      },
    },
  });
}

function renderWithQuery(ui: React.ReactElement) {
  const queryClient = makeQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>,
  );
}

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('SummaryCardRow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── Loading state ────────────────────────────────────────────────────────────

  it('renders four cards in loading state (shimmer) while data is loading', async () => {
    // fetchKpiSummary never resolves so component stays in loading state
    vi.mocked(fetchKpiSummary).mockReturnValue(new Promise(() => {}));

    renderWithQuery(<SummaryCardRow />);

    // All four shimmer skeletons should be visible
    const shimmers = await screen.findAllByRole('status', { name: 'Loading' });
    expect(shimmers).toHaveLength(4);
  });

  it('renders card titles in loading state', async () => {
    vi.mocked(fetchKpiSummary).mockReturnValue(new Promise(() => {}));

    renderWithQuery(<SummaryCardRow />);

    // Titles are always rendered regardless of loading state
    expect(await screen.findByText("Today's Revenue")).toBeInTheDocument();
    expect(screen.getByText('Transactions')).toBeInTheDocument();
    expect(screen.getByText('Best Seller')).toBeInTheDocument();
    expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
  });

  // ── Successful data state ────────────────────────────────────────────────────

  it('renders all four card titles after data loads', async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByText("Today's Revenue")).toBeInTheDocument();
      expect(screen.getByText('Transactions')).toBeInTheDocument();
      expect(screen.getByText('Best Seller')).toBeInTheDocument();
      expect(screen.getByText('Stock Alerts')).toBeInTheDocument();
    });
  });

  it("formats and displays today's revenue in Indonesian locale", async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    // Revenue should be formatted as "Rp 4.750.000" (id-ID locale)
    await waitFor(() => {
      expect(screen.getByText('Rp 4.750.000')).toBeInTheDocument();
    });
  });

  it("displays today's transaction count", async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByText('142')).toBeInTheDocument();
    });
  });

  it('displays the best seller product name', async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByText('Indomie Goreng Spesial')).toBeInTheDocument();
    });
  });

  it('displays stock alert count', async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      // The stock alert badge shows "3"
      expect(screen.getByRole('status', { name: '3 stock alerts' })).toBeInTheDocument();
    });
  });

  it('renders trend graphic for upward revenue trend', async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      // The trend aria-label should reflect the 12.5% increase
      expect(
        screen.getByRole('img', { name: /revenue trending upward by 12\.5%/i }),
      ).toBeInTheDocument();
    });
  });

  it('does not render trend graphic for neutral/down revenue trend', async () => {
    const neutralData = {
      ...mockKpiData,
      todayRevenue: { ...mockKpiData.todayRevenue, trendPercent: 0, trend: 'neutral' as const },
    };
    vi.mocked(fetchKpiSummary).mockResolvedValue(neutralData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
  });

  // ── Error state ──────────────────────────────────────────────────────────────

  it('renders an error banner when the API call fails', async () => {
    vi.mocked(fetchKpiSummary).mockRejectedValue(new Error('Network error'));

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
      expect(screen.getByText(/failed to load kpi summary/i)).toBeInTheDocument();
    });
  });

  it('renders a "Retry" button in the error state', async () => {
    vi.mocked(fetchKpiSummary).mockRejectedValue(new Error('Network error'));

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });
  });

  it('calls refetch when the Retry button is clicked', async () => {
    const user = userEvent.setup();
    let callCount = 0;
    vi.mocked(fetchKpiSummary).mockImplementation(() => {
      callCount++;
      return Promise.reject(new Error('Network error'));
    });

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /retry/i }));

    // The retry triggers a new fetch call
    await waitFor(() => {
      expect(callCount).toBeGreaterThan(1);
    });
  });

  // ── Layout ───────────────────────────────────────────────────────────────────

  it('renders four list items in a row', async () => {
    vi.mocked(fetchKpiSummary).mockResolvedValue(mockKpiData);

    renderWithQuery(<SummaryCardRow />);

    await waitFor(() => {
      const items = screen.getAllByRole('listitem');
      expect(items).toHaveLength(4);
    });
  });
});
