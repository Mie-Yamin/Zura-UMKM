import { useSalesChart } from '../hooks/useSalesChart';
import SalesChartPanel from './SalesChartPanel';
import SummaryCardRow from './SummaryCardRow';

// ─── BusinessOverview ────────────────────────────────────────────────────────

export default function BusinessOverview() {
  const { data, isLoading, isError, refetch } = useSalesChart();

  const ariaLabel =
    'Sales chart showing historical revenue and AI revenue prediction';

  const historicalData = data?.historical ?? [];
  const predictionData = data?.prediction ?? [];

  return (
    <section
      aria-label="Business Overview"
      className="flex-[2] flex flex-col gap-6 p-6 overflow-y-auto border-r border-border"
    >
      {/* KPI Summary Cards */}
      <SummaryCardRow />

      {/* Sales Chart — error banner when fetch fails */}
      {isError && (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>Failed to load sales chart data.</span>
          <button
            type="button"
            onClick={() => void refetch()}
            className="ml-auto rounded bg-red-100 px-3 py-1 font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Retry
          </button>
        </div>
      )}

      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={isLoading}
        ariaLabel={ariaLabel}
      />
    </section>
  );
}
