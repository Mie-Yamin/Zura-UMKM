import type {
  KpiSummaryResponse,
  SalesChartResponse,
  InventoryResponse,
  RestockPlanResponse,
} from '../types/index';

import kpiSummaryFixture from '../mocks/kpi-summary.json';
import salesChartFixture from '../mocks/sales-chart.json';
import inventoryFixture from '../mocks/inventory.json';
import restockPlanFixture from '../mocks/restock-plan.json';

/** Simulates a realistic network round-trip (200–400 ms). */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const networkDelay = (): Promise<void> => delay(200 + Math.random() * 200);

// ─────────────────────────────────────────────
// Public API functions
// ─────────────────────────────────────────────

/** Fetches the KPI summary card data. */
export async function fetchKpiSummary(): Promise<KpiSummaryResponse> {
  await networkDelay();
  return kpiSummaryFixture as KpiSummaryResponse;
}

/** Fetches historical and AI-predicted sales chart data. */
export async function fetchSalesChart(): Promise<SalesChartResponse> {
  await networkDelay();
  return salesChartFixture as SalesChartResponse;
}

/** Fetches the full product inventory list. */
export async function fetchInventory(): Promise<InventoryResponse> {
  await networkDelay();
  return inventoryFixture as InventoryResponse;
}

/** Fetches the weekly AI-generated restock plan. */
export async function fetchRestockPlan(): Promise<RestockPlanResponse> {
  await networkDelay();
  return restockPlanFixture as RestockPlanResponse;
}
