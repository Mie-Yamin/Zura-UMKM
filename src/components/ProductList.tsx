import type { ProductListProps } from '../types';
import { applyRowEmphasis, getStatusBadgeColor } from '../utils/businessLogic';
import { SOFT_RED } from '../utils/tokens';

// ─── Loading Skeleton Row ────────────────────────────────────────────────────

function SkeletonRow() {
  return (
    <tr data-testid="skeleton-row" className="animate-pulse">
      <td className="px-3 py-3">
        <div className="h-4 w-32 rounded bg-gray-200" />
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-20 rounded bg-gray-200" />
      </td>
      <td className="px-3 py-3">
        <div className="h-5 w-16 rounded-full bg-gray-200" />
      </td>
      <td className="px-3 py-3">
        <div className="h-4 w-20 rounded bg-gray-200" />
      </td>
    </tr>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

interface StatusBadgeProps {
  status: 'healthy' | 'low_stock';
}

function StatusBadge({ status }: StatusBadgeProps) {
  const backgroundColor = getStatusBadgeColor(status);
  const label = status === 'healthy' ? 'Healthy' : 'Low Stock';
  // Use dark text on neon green for contrast, white on soft red
  const textColor = status === 'healthy' ? 'text-gray-800' : 'text-white';

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${textColor}`}
      style={{ backgroundColor }}
    >
      {label}
    </span>
  );
}

// ─── ProductList ──────────────────────────────────────────────────────────────

export default function ProductList({ products, isLoading }: ProductListProps) {
  const emphasizedProducts = isLoading ? [] : applyRowEmphasis(products);

  return (
    <div role="table" className="overflow-x-auto">
      <table
        className="w-full text-sm border-collapse"
        aria-label="Product inventory table"
      >
        <thead>
          <tr className="border-b border-gray-200">
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Product
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              SKU
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              Status
            </th>
            <th
              scope="col"
              className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
            >
              AI Forecast
            </th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          ) : (
            emphasizedProducts.map((product) => (
              <tr
                key={product.id}
                className="even:bg-gray-50"
                style={
                  product.emphasized
                    ? {
                        borderLeft: `4px solid ${SOFT_RED}`,
                        backgroundColor: 'rgb(254 226 226)', // bg-red-50 equivalent
                      }
                    : undefined
                }
              >
                {/* Product name */}
                <td className="px-3 py-3 text-gray-900">{product.name}</td>

                {/* SKU — monospace font */}
                <td className="px-3 py-3 font-mono text-gray-600">{product.sku}</td>

                {/* Status badge */}
                <td className="px-3 py-3">
                  <StatusBadge status={product.status} />
                </td>

                {/* AI Forecast */}
                <td className="px-3 py-3 text-gray-700">
                  {product.aiForecasterDays != null && product.aiForecasterDays > 0 ? (
                    <span>🧠 {product.aiForecasterDays} days</span>
                  ) : (
                    <span>–</span>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
