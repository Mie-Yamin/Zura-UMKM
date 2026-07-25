import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Legend,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { SalesChartProps } from '../types';
import { DEEP_TEAL, NEON_GREEN } from '../utils/tokens';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading chart" role="status">
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="h-64 w-full rounded bg-gray-200" />
      <div className="h-3 w-1/4 rounded bg-gray-200" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <p className="flex items-center justify-center h-40 text-sm text-gray-500" role="status">
      No sales data available yet
    </p>
  );
}

// ─── SalesChartPanel ──────────────────────────────────────────────────────────

export default function SalesChartPanel({
  historicalData,
  predictionData,
  isLoading,
  ariaLabel,
}: SalesChartProps) {
  if (isLoading) {
    return (
      <div aria-label={ariaLabel}>
        <LoadingSkeleton />
      </div>
    );
  }

  const isEmpty = historicalData.length === 0 && predictionData.length === 0;

  if (isEmpty) {
    return (
      <div aria-label={ariaLabel}>
        <EmptyState />
      </div>
    );
  }

  /**
   * Merge both datasets into a single array keyed by date so Recharts
   * can render a shared X-axis with correct tick labels.
   *
   * Points that belong to only one series will have `undefined` for the
   * other series' value — Recharts handles this gracefully (gap or skip).
   */
  const dateMap = new Map<string, { date: string; historicalRevenue?: number; predictionRevenue?: number }>();

  for (const point of historicalData) {
    dateMap.set(point.date, { date: point.date, historicalRevenue: point.revenue });
  }

  for (const point of predictionData) {
    const existing = dateMap.get(point.date);
    if (existing) {
      existing.predictionRevenue = point.revenue;
    } else {
      dateMap.set(point.date, { date: point.date, predictionRevenue: point.revenue });
    }
  }

  // Sort by date string (ISO dates sort lexicographically)
  const combined = Array.from(dateMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date),
  );

  return (
    <div aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={combined} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
          <YAxis tick={{ fontSize: 11 }} />
          <Tooltip />
          <Legend />
          <Line
            type="monotone"
            dataKey="historicalRevenue"
            name="Historical Sales"
            stroke={DEEP_TEAL}
            dot={false}
            connectNulls
          />
          <Line
            type="monotone"
            dataKey="predictionRevenue"
            name="AI Revenue Prediction"
            stroke={NEON_GREEN}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
