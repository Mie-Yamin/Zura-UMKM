import React from 'react';

// ─────────────────────────────────────────────
// Navigation
// ─────────────────────────────────────────────

export interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface NavBarProps {
  items: NavItem[];
  activePath: string;
}

// ─────────────────────────────────────────────
// Summary / KPI cards
// ─────────────────────────────────────────────

export interface SummaryCardProps {
  title: string;
  value?: string | number;
  /** Optional sparkline data points for the revenue card */
  trendData?: number[];
  /** Direction of trend */
  trend?: 'up' | 'down' | 'neutral';
  /** Count of alerts; when > 0 renders Soft_Red badge */
  alertCount?: number;
  /** aria-label override for the trend graphic */
  trendAriaLabel?: string;
}

// ─────────────────────────────────────────────
// Sales chart
// ─────────────────────────────────────────────

export interface SalesDataPoint {
  /** ISO date string, e.g. "2025-06-01" */
  date: string;
  revenue: number;
}

export interface SalesChartProps {
  historicalData: SalesDataPoint[];
  predictionData: SalesDataPoint[];
  isLoading: boolean;
  /** aria-label for the chart container */
  ariaLabel: string;
}

// ─────────────────────────────────────────────
// Inventory / product list
// ─────────────────────────────────────────────

export interface Product {
  id: string;
  name: string;
  sku: string;
  status: 'healthy' | 'low_stock';
  stockCount: number;
  /** Estimated days until stockout (AI forecast) */
  aiForecasterDays: number;
}

export interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}

// ─────────────────────────────────────────────
// Restock chart
// ─────────────────────────────────────────────

export interface RestockDataPoint {
  /** Weekday abbreviation, e.g. "Mon", "Tue" */
  day: string;
  quantity: number;
}

export interface RestockChartProps {
  data: RestockDataPoint[];
  isLoading: boolean;
  /** aria-label for the chart container */
  ariaLabel: string;
}

// ─────────────────────────────────────────────
// API response types
// ─────────────────────────────────────────────

export interface KpiSummaryResponse {
  todayRevenue: {
    value: number;
    /** Currency code, e.g. "IDR" */
    currency: string;
    trend: 'up' | 'down' | 'neutral';
    /** e.g. 12.5 means +12.5% */
    trendPercent: number;
    /** Last N data points for the mini sparkline chart */
    sparkline: number[];
  };
  todayTransactions: number;
  bestSellerProduct: {
    name: string;
    unitsSold: number;
  };
  stockAlerts: {
    count: number;
    productIds: string[];
  };
}

export interface SalesChartResponse {
  /** Past months / weeks */
  historical: SalesDataPoint[];
  /** Next month AI projection */
  prediction: SalesDataPoint[];
  currency: string;
}

export interface InventoryResponse {
  products: Product[];
  /** ISO datetime string */
  lastUpdated: string;
}

export interface RestockPlanResponse {
  /** ISO date of the Monday that starts the week */
  weekOf: string;
  /** 7 items covering Mon – Sun */
  plan: RestockDataPoint[];
}

// ─────────────────────────────────────────────
// Utility types
// ─────────────────────────────────────────────

export type ModuleId = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'finance';

export interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
