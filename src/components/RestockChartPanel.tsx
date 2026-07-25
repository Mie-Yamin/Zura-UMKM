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
}: RestockChartProps) {
  if (isLoading) {
    return (
      <div aria-label={ariaLabel}>
        <LoadingSkeleton />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div aria-label={ariaLabel}>
        <EmptyState />
      </div>
    );
  }

  return (
    <div aria-label={ariaLabel}>
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
