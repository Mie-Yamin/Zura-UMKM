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

      {/* Sales Chart — error banner rendered inline by the component */}
      <SalesChartPanel
        historicalData={historicalData}
        predictionData={predictionData}
        isLoading={isLoading}
        ariaLabel={ariaLabel}
        isError={isError}
        refetch={() => void refetch()}
      />
    </section>
  );
}
