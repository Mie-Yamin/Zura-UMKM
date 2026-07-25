# Implementation Plan: UMKM Pulse Dashboard

## Overview

Build the UMKM Pulse Dashboard as a React + TypeScript SPA using Vite, Tailwind CSS, Recharts, TanStack Query, and React Router v6. Implementation proceeds in layers: project scaffold → design tokens → application shell → data layer → Business Overview section → Smart Inventory Focus section → accessibility hardening → property-based and unit tests.

## Tasks

- [x] 1. Scaffold project and configure tooling
  - Initialize a Vite + React + TypeScript project (`npm create vite@latest`)
  - Install core dependencies: `react-router-dom@6`, `@tanstack/react-query@5`, `recharts`, `tailwindcss`, `postcss`, `autoprefixer`
  - Install dev/test dependencies: `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `fast-check`, `vitest-axe` (or `jest-axe`)
  - Configure `tailwind.config.ts` to scan `src/**/*.{ts,tsx}` and extend the theme with design token color and spacing values
  - Create `src/styles/tokens.css` defining all CSS custom properties (`--color-deep-teal`, `--color-neon-green`, `--color-soft-red`, `--color-surface`, `--color-border`, `--color-text-primary`, `--color-text-secondary`, `--spacing-base`)
  - Import `tokens.css` in `src/main.tsx` and set up the `QueryClientProvider` wrapper
  - Configure Vitest with `jsdom` environment and `@testing-library/jest-dom` setup file
  - _Requirements: 7.1–7.8_

- [x] 2. Define shared TypeScript types and mock API fixtures
  - [x] 2.1 Create `src/types/index.ts` with all shared interfaces
    - Export `NavItem`, `NavBarProps`, `SummaryCardProps`, `SalesDataPoint`, `SalesChartProps`, `Product`, `ProductListProps`, `RestockDataPoint`, `RestockChartProps`
    - Export API response types: `KpiSummaryResponse`, `SalesChartResponse`, `InventoryResponse`, `RestockPlanResponse`
    - Export utility types: `ModuleId`, `QueryResult<T>`
    - _Requirements: 3.1–3.7, 4.2–4.3, 5.1–5.6, 6.2_

  - [x] 2.2 Create mock API JSON fixtures
    - `src/mocks/kpi-summary.json` — includes `todayRevenue` (with sparkline and trend), `todayTransactions`, `bestSellerProduct`, `stockAlerts`
    - `src/mocks/sales-chart.json` — includes at least 6 months of `historical` data points and 1 month of `prediction` data points
    - `src/mocks/inventory.json` — includes at least 8 products with mixed `status` and `aiForecasterDays` values (some ≤ 7, some > 7)
    - `src/mocks/restock-plan.json` — includes 7 `RestockDataPoint` entries covering Mon–Sun
    - _Requirements: 3.2–3.6, 4.2–4.3, 5.2–5.6, 6.2_

  - [x] 2.3 Create `src/api/client.ts` mock API layer
    - Implement `fetchKpiSummary()`, `fetchSalesChart()`, `fetchInventory()`, `fetchRestockPlan()` functions that read from the JSON fixtures with a simulated delay
    - _Requirements: 3.2–3.6, 4.2–4.3, 5.2–5.6, 6.2_

- [x] 3. Implement application shell: routing and persistent NavBar
  - [x] 3.1 Create `src/components/NavBar.tsx`
    - Render a `<nav>` with `role="navigation"` on the left side (fixed width `w-64`, full-height)
    - Display the "UMKM Pulse" logo/name at the top
    - Render all five `NavItem` entries (Dashboard, Sales/POS, Smart Inventory, Customers, Finance) each with its icon and text label
    - Use `useLocation()` from React Router to derive the active path; apply Deep_Teal background and filled icon to the active item
    - Support keyboard Tab navigation between links (`<a>` or `<Link>` elements are natively focusable)
    - _Requirements: 1.1–1.6_

  - [x] 3.2 Write unit tests for NavBar
    - Test that all five module links render with correct labels and icons
    - Test that the active link receives the Deep_Teal accent class based on the current path
    - Test that Tab key moves focus sequentially through the nav links
    - _Requirements: 1.1–1.6, 8.2_

  - [x] 3.3 Create `src/components/AppShell.tsx` and wire up routing in `src/App.tsx`
    - `AppShell` renders a flex-row layout: `<NavBar />` + `<main>` content area
    - `App.tsx` wraps everything in `<BrowserRouter>` and `<QueryClientProvider>`; defines routes for `/`, `/pos`, `/inventory`, `/customers`, `/finance`
    - Add a catch-all `<Route>` that redirects to `/` for unknown paths
    - Create stub page components (`PosPage`, `InventoryPage`, `CustomersPage`, `FinancePage`) returning placeholder content
    - _Requirements: 1.1, 2.1–2.5_

- [x] 4. Implement design token utilities and shared UI primitives
  - Create `src/utils/tokens.ts` exporting typed token constants (`DEEP_TEAL`, `NEON_GREEN`, `SOFT_RED`) so component logic can reference them without magic strings
  - Create `src/utils/businessLogic.ts` with pure utility functions:
    - `computeStockAlertCount(products: Product[], threshold: number): number`
    - `applyRowEmphasis(products: Product[]): (Product & { emphasized: boolean })[]`
    - `getStatusBadgeColor(status: Product['status']): string`
    - `deriveTrendDirection(trendPercent: number): 'up' | 'down' | 'neutral'`
    - `markActiveNavItem(items: NavItem[], path: string): (NavItem & { active: boolean })[]`
  - _Requirements: 1.3, 1.5, 3.3, 3.6, 3.7, 5.4, 5.6_

- [x] 5. Implement property-based tests for business logic utilities
  - [x] 5.1 Write property test for `computeStockAlertCount`
    - **Property 1: Stock-alert badge reflects actual low-stock count**
    - **Validates: Requirements 3.6, 3.7**
    - Generate arbitrary product arrays with random `stockCount` values and a random threshold; assert result equals `products.filter(p => p.stockCount < threshold).length`

  - [x] 5.2 Write property test for `applyRowEmphasis`
    - **Property 2: AI Forecast row emphasis is consistent with threshold**
    - **Validates: Requirements 5.6**
    - Generate arbitrary product arrays with random `aiForecasterDays`; assert every product with `aiForecasterDays <= 7` has `emphasized === true` and all others `emphasized === false`

  - [x] 5.3 Write property test for `getStatusBadgeColor`
    - **Property 3: Product status badge maps correctly to stock level**
    - **Validates: Requirements 5.4**
    - Generate a product with status sampled from `["healthy", "low_stock"]`; assert `getStatusBadgeColor("healthy")` returns `NEON_GREEN` and `getStatusBadgeColor("low_stock")` returns `SOFT_RED`

  - [x] 5.4 Write property test for `deriveTrendDirection`
    - **Property 4: Revenue trend direction agrees with data**
    - **Validates: Requirements 3.3**
    - Generate arbitrary `trendPercent: number`; assert returns `"up"` when `> 0`, `"down"` when `< 0`, `"neutral"` when `=== 0`

  - [x] 5.5 Write property test for `markActiveNavItem`
    - **Property 5: Active nav item is always the current route**
    - **Validates: Requirements 1.3, 1.5**
    - Generate arbitrary `NavItem[]` and a path drawn from the list; assert exactly one item has `active === true` and its `path` matches the input path

- [x] 6. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Implement TanStack Query data hooks
  - Create `src/hooks/useKpiSummary.ts` — wraps `fetchKpiSummary()` with `useQuery`, key `['kpi-summary']`
  - Create `src/hooks/useSalesChart.ts` — wraps `fetchSalesChart()` with `useQuery`, key `['sales-chart']`
  - Create `src/hooks/useInventory.ts` — wraps `fetchInventory()` with `useQuery`, key `['inventory']`
  - Create `src/hooks/useRestockPlan.ts` — wraps `fetchRestockPlan()` with `useQuery`, key `['restock-plan']`
  - Each hook returns `{ data, isLoading, isError, error }` per the `QueryResult<T>` interface
  - Configure React Query client with 3 retries and exponential back-off
  - _Requirements: 3.2–3.6, 4.2–4.3, 5.2–5.6, 6.2_

- [x] 8. Implement SummaryCard component
  - [x] 8.1 Create `src/components/SummaryCard.tsx`
    - Render a white-background card with soft-grey border and base-8px padding
    - Display `title` (caption) and `value` (heading) with correct typographic hierarchy
    - When `trend === 'up'`, render a Neon_Green upward sparkline graphic; include `aria-label` from `trendAriaLabel` prop on the graphic element
    - When `alertCount > 0`, render a Soft_Red badge displaying the count; include `aria-label="[count] stock alerts"` on the badge
    - Render a loading shimmer skeleton when no value is provided (loading state)
    - _Requirements: 3.1, 3.2, 3.3, 3.6, 3.7, 3.8, 7.1–7.7, 8.3, 8.6_

  - [x] 8.2 Write unit tests for SummaryCard
    - Test renders title and value text
    - Test Neon_Green sparkline renders when `trend="up"` and is absent when `trend="down"`
    - Test Soft_Red badge renders with correct count when `alertCount > 0`
    - Test `aria-label` is present on trend graphic and alert badge
    - _Requirements: 3.3, 3.7, 8.3, 8.6_

- [x] 9. Implement BusinessOverview — SummaryCardRow
  - Create `src/components/SummaryCardRow.tsx`
    - Render four `<SummaryCard>` components in a horizontal flex row
    - Wire each card to the appropriate field from `KpiSummaryResponse` via `useKpiSummary()`
    - Pass correct props: revenue value + sparkline + trend, transaction count, best-seller name, stock-alert count
    - While `isLoading`, render skeleton shimmer state in each card
    - _Requirements: 3.1–3.8_

- [x] 10. Implement BusinessOverview — SalesChartPanel
  - [x] 10.1 Create `src/components/SalesChartPanel.tsx`
    - Use Recharts `<LineChart>` inside a `<ResponsiveContainer>`
    - Render two `<Line>` series: `historicalData` (solid line, primary color) and `predictionData` (dashed line, secondary color)
    - Render `<Legend>` with labels "Historical Sales" and "AI Revenue Prediction"
    - Render `<XAxis>` (time/date labels) and `<YAxis>` (currency value labels)
    - Apply `aria-label` prop to the chart wrapper `<div>`
    - When both arrays are empty, render empty-state message "No sales data available yet"
    - When `isLoading`, render a loading skeleton
    - _Requirements: 4.1–4.7, 7.2, 8.5_

  - [x] 10.2 Write unit tests for SalesChartPanel
    - Test that legend renders with both series names
    - Test that empty-state message renders when both data arrays are empty
    - Test that `aria-label` attribute is present on the chart container
    - _Requirements: 4.5, 4.7, 8.5_

  - [x] 10.3 Write property test for sales data completeness
    - **Property 6: Sales chart data completeness**
    - **Validates: Requirements 4.2, 4.3**
    - Generate arbitrary `SalesChartResponse`; assert every `SalesDataPoint` in both arrays has a truthy `date` string and `revenue >= 0`

- [x] 11. Assemble BusinessOverview section
  - Create `src/components/BusinessOverview.tsx`
    - Render `<SummaryCardRow />` followed by `<SalesChartPanel />` in a vertical flex column
    - Apply `flex-[2]` width and a right border (soft grey) to match the two-thirds layout
    - Pass `ariaLabel` to `SalesChartPanel` summarizing chart purpose and data range
    - _Requirements: 2.1, 2.3, 2.4_

- [x] 12. Implement SmartInventoryFocus — ProductList
  - [x] 12.1 Create `src/components/ProductList.tsx`
    - Render a semantic `<table>` with `<thead>` containing `<th>` elements: "Product", "SKU", "Status", "AI Forecast"
    - Map each `Product` to a `<tr>` with four `<td>` cells; apply alternating row background for readability
    - "Status" cell: render a colored badge — Neon_Green for `"healthy"`, Soft_Red for `"low_stock"`
    - "AI Forecast" cell: render a brain icon + `aiForecasterDays` text (e.g., "5 days"); display "–" when value is missing
    - Apply Soft_Red row emphasis (background tint or left-border) when `aiForecasterDays <= 7` (use `applyRowEmphasis` from utils)
    - When `isLoading`, render 5 skeleton rows in place of data rows
    - _Requirements: 5.1–5.8, 7.3, 7.4, 8.4_

  - [x] 12.2 Write unit tests for ProductList
    - Test column headers render with correct text
    - Test skeleton rows render when `isLoading === true`
    - Test Soft_Red row emphasis applied when `aiForecasterDays <= 7` and not applied when `> 7`
    - Test Neon_Green badge for "healthy" status and Soft_Red badge for "low_stock"
    - Test `aria-label` and semantic `<th>` elements present for screen reader support
    - _Requirements: 5.1–5.8, 8.4_

- [x] 13. Implement SmartInventoryFocus — RestockChartPanel
  - [x] 13.1 Create `src/components/RestockChartPanel.tsx`
    - Use Recharts `<BarChart>` inside a `<ResponsiveContainer>`
    - Render `<Bar>` with Deep_Teal fill color
    - Render `<XAxis>` (day abbreviation labels) and `<YAxis>` (quantity labels)
    - Apply `aria-label` prop to the chart wrapper `<div>`
    - When data is empty, render empty-state message "No restock plan scheduled"
    - When `isLoading`, render a loading skeleton
    - _Requirements: 6.1–6.5, 7.2, 8.5_

  - [x] 13.2 Write unit tests for RestockChartPanel
    - Test empty-state message renders when data array is empty
    - Test `aria-label` attribute is present on chart container
    - _Requirements: 6.5, 8.5_

  - [x] 13.3 Write property test for restock day validity
    - **Property 7: Restock chart days are a subset of the week**
    - **Validates: Requirements 6.2, 6.4**
    - Generate arbitrary `RestockPlanResponse`; assert every `RestockDataPoint.day` is in `["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]` and `quantity >= 0`

- [x] 14. Assemble SmartInventoryFocus section and DashboardPage
  - [x] 14.1 Create `src/components/SmartInventoryFocus.tsx`
    - Render `<ProductList />` followed by `<RestockChartPanel />` in a vertical flex column
    - Apply `flex-[1]` width to match the one-third layout
    - Wire `useInventory()` and `useRestockPlan()` hooks; pass `isLoading` and data to children
    - Pass `ariaLabel` to `RestockChartPanel`
    - _Requirements: 2.2, 2.3, 5.8, 6.1_

  - [x] 14.2 Create `src/pages/DashboardPage.tsx`
    - Render `<BusinessOverview />` and `<SmartInventoryFocus />` side by side in a flex row
    - Apply white background, generous whitespace (base-8px scale), and soft grey section borders
    - Ensure layout is responsive and readable at ≥ 1280px viewport width
    - _Requirements: 2.1–2.5, 7.1, 7.6_

- [x] 15. Add error boundaries and global error handling
  - Create `src/components/ErrorBoundary.tsx` using React class-based `ErrorBoundary` pattern
  - Wrap `<DashboardPage />` (and other page routes) with `<ErrorBoundary>` in `AppShell`
  - Implement inline error banners with a "Retry" button inside `SalesChartPanel`, `ProductList`, `RestockChartPanel`, and `SummaryCardRow` for API failures
  - _Requirements: 4.7, 5.8, 6.5_

- [x] 16. Checkpoint — Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [x] 17. Accessibility hardening and design system audit
  - [x] 17.1 Audit and fix color contrast
    - Run the contrast-checker script against all design token combinations to verify minimum 4.5:1 ratio for normal text
    - Adjust token values if any combination fails WCAG 2.1 AA
    - _Requirements: 8.1_

  - [x] 17.2 Add automated accessibility tests with vitest-axe
    - Run `axe` against rendered `<DashboardPage />`, `<NavBar />`, `<ProductList />`, `<SalesChartPanel />`, and `<RestockChartPanel />` in Vitest
    - Assert zero violations for each component
    - _Requirements: 8.1–8.6_

  - [x] 17.3 Verify all aria attributes are in place
    - Confirm `aria-label` on trend graphic in `SummaryCard` (req 8.3)
    - Confirm `aria-label` on `SalesChartPanel` and `RestockChartPanel` wrappers (req 8.5)
    - Confirm `aria-label` on Stock_Alert badge (req 8.6)
    - Confirm `<th>` elements in `ProductList` table (req 8.4)
    - _Requirements: 8.3–8.6_

- [x] 18. Final checkpoint — Ensure all tests pass
  - Run the full test suite (`vitest --run`) and confirm all unit, property, and accessibility tests pass.
  - Fix any remaining failures before considering the implementation complete.
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP; all required tasks must be completed for a production-ready build.
- Each task references specific requirements for full traceability back to the specification.
- Checkpoints at tasks 6, 16, and 18 ensure incremental validation at key milestones.
- Property tests (tasks 5.1–5.5, 10.3, 13.3) validate universal behavioral invariants using `fast-check` with a minimum of 100 iterations each.
- Unit tests use `@testing-library/react` selectors that mirror how real users and assistive technologies interact with the UI.
- The mock API layer (task 2.3) is designed to be drop-in replaced with real REST endpoints without changes to hooks or components.
