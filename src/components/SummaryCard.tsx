import type { SummaryCardProps } from '../types';

// ─── Loading Shimmer ──────────────────────────────────────────────────────────

function LoadingShimmer() {
  return (
    <div className="animate-pulse space-y-2" aria-label="Loading" role="status">
      <div className="h-7 w-3/4 rounded bg-gray-200" />
      <div className="h-4 w-1/2 rounded bg-gray-200" />
    </div>
  );
}

// ─── Trend Graphic (Neon Green upward arrow/sparkline) ────────────────────────

interface TrendGraphicProps {
  ariaLabel: string;
}

function TrendUpGraphic({ ariaLabel }: TrendGraphicProps) {
  return (
    <svg
      width="32"
      height="20"
      viewBox="0 0 32 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-label={ariaLabel}
      role="img"
      style={{ color: 'var(--color-neon-green)' }}
    >
      {/* Sparkline path going upward */}
      <polyline
        points="2,16 8,12 14,10 20,6 26,4"
        stroke="var(--color-neon-green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Arrow head at the end */}
      <polyline
        points="22,2 26,4 24,8"
        stroke="var(--color-neon-green)"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// ─── Alert Badge (Soft Red) ───────────────────────────────────────────────────

interface AlertBadgeProps {
  count: number;
}

function AlertBadge({ count }: AlertBadgeProps) {
  return (
    <span
      className="inline-flex items-center justify-center min-w-[1.5rem] h-6 px-1.5 rounded-full text-xs font-semibold text-white"
      style={{ backgroundColor: 'var(--color-soft-red)' }}
      aria-label={`${count} stock alerts`}
      role="status"
    >
      {count}
    </span>
  );
}

// ─── SummaryCard ─────────────────────────────────────────────────────────────

export default function SummaryCard({
  title,
  value,
  trend,
  alertCount,
  trendAriaLabel,
}: SummaryCardProps) {
  const isLoading = value === undefined;
  const showTrendUp = trend === 'up';
  const showAlertBadge = alertCount !== undefined && alertCount > 0;
  const resolvedTrendAriaLabel = trendAriaLabel ?? 'Revenue trending upward';

  return (
    <article className="bg-white border border-border rounded-lg p-4 flex flex-col gap-2 min-w-0">
      {/* Title (caption) */}
      <p className="text-xs font-medium text-text-secondary uppercase tracking-wide truncate">
        {title}
      </p>

      {/* Value or loading shimmer */}
      {isLoading ? (
        <LoadingShimmer />
      ) : (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-2xl font-bold text-text-primary leading-tight">
            {value}
          </span>

          {/* Neon Green trend graphic — only when trend is "up" */}
          {showTrendUp && (
            <TrendUpGraphic ariaLabel={resolvedTrendAriaLabel} />
          )}

          {/* Soft Red alert badge — only when alertCount > 0 */}
          {showAlertBadge && (
            <AlertBadge count={alertCount!} />
          )}
        </div>
      )}
    </article>
  );
}
