import { useKpiSummary } from '../hooks/useKpiSummary';
import SummaryCard from './SummaryCard';
import { deriveTrendDirection } from '../utils/businessLogic';

// ─── Revenue Formatter ────────────────────────────────────────────────────────

function formatRevenue(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

// ─── SummaryCardRow ──────────────────────────────────────────────────────────

export default function SummaryCardRow() {
  const { data, isLoading, isError, refetch } = useKpiSummary();

  // ── Error state ──────────────────────────────────────────────────────────────
  if (isError) {
    return (
      <div
        role="alert"
        className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
      >
        <span>Failed to load KPI summary.</span>
        <button
          type="button"
          onClick={() => void refetch()}
          className="ml-auto rounded bg-red-100 px-3 py-1 font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
        >
          Retry
        </button>
      </div>
    );
  }

  // ── Derived values (undefined while loading) ─────────────────────────────────
  const revenueValue = data
    ? formatRevenue(data.todayRevenue.value)
    : undefined;

  const trend = data
    ? deriveTrendDirection(data.todayRevenue.trendPercent)
    : undefined;

  const trendAriaLabel = data
    ? `Revenue trending ${
        data.todayRevenue.trendPercent > 0
          ? 'upward'
          : data.todayRevenue.trendPercent < 0
          ? 'downward'
          : 'neutral'
      } by ${Math.abs(data.todayRevenue.trendPercent)}%`
    : undefined;

  const transactionsValue = isLoading ? undefined : data?.todayTransactions;
  const bestSellerValue = isLoading ? undefined : data?.bestSellerProduct.name;
  const stockAlertsCount = isLoading ? undefined : data?.stockAlerts.count;

  return (
    <div className="flex gap-4" role="list" aria-label="KPI Summary Cards">
      {/* 1 — Today's Revenue */}
      <div role="listitem" className="flex-1 min-w-0">
        <SummaryCard
          title="Today's Revenue"
          value={revenueValue}
          trend={trend}
          trendAriaLabel={trendAriaLabel}
        />
      </div>

      {/* 2 — Transactions */}
      <div role="listitem" className="flex-1 min-w-0">
        <SummaryCard
          title="Transactions"
          value={isLoading ? undefined : transactionsValue}
        />
      </div>

      {/* 3 — Best Seller Product */}
      <div role="listitem" className="flex-1 min-w-0">
        <SummaryCard
          title="Best Seller"
          value={isLoading ? undefined : bestSellerValue}
        />
      </div>

      {/* 4 — Stock Alerts */}
      <div role="listitem" className="flex-1 min-w-0">
        <SummaryCard
          title="Stock Alerts"
          value={isLoading ? undefined : stockAlertsCount}
          alertCount={stockAlertsCount}
        />
      </div>
    </div>
  );
}
