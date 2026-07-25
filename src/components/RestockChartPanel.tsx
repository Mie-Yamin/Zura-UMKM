import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import type { RestockChartProps } from '../types';
import { DEEP_TEAL } from '../utils/tokens';

// ─── Loading Skeleton ─────────────────────────────────────────────────────────

function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-3" aria-label="Loading chart" role="status">
      <div className="h-4 w-1/3 rounded bg-gray-200" />
      <div className="h-48 w-full rounded bg-gray-200" />
      <div className="h-3 w-1/4 rounded bg-gray-200" />
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <p className="flex items-center justify-center h-40 text-sm text-gray-500">
      No restock plan scheduled
    </p>
  );
}

// ─── RestockChartPanel ────────────────────────────────────────────────────────

export default function RestockChartPanel({
  data,
  isLoading,
  ariaLabel,
  isError,
  refetch,
}: RestockChartProps) {
  if (isLoading) {
    return (
      <div role="region" aria-label={ariaLabel}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (isError) {
    return (
      <div role="region" aria-label={ariaLabel}>
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          <span>Failed to load restock plan.</span>
          <button
            type="button"
            onClick={() => refetch?.()}
            className="ml-auto rounded bg-red-100 px-3 py-1 font-medium hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-red-400"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div role="region" aria-label={ariaLabel}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div role="region" aria-label={ariaLabel}>
      <ResponsiveContainer width="100%" height={250}>
        <BarChart data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="quantity" name="Restock Quantity" fill={DEEP_TEAL} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
