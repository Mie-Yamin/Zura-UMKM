# Design Document: UMKM Pulse Dashboard

## Overview

UMKM Pulse Dashboard is a single-page web application (SPA) providing small and medium enterprise owners with a unified interface for monitoring business health. The dashboard aggregates KPI summary cards, a dual-line sales/prediction chart, an AI-powered inventory product list, and a weekly restock bar chart — all inside a two-panel layout anchored by a persistent left navigation bar.

The application is built with **React + TypeScript**, styled with **Tailwind CSS** (supplemented by CSS custom properties for the design token palette), and uses **Recharts** for chart rendering. Data is served from a lightweight mock API layer (JSON fixtures during development, replaceable with real REST/GraphQL endpoints in production). State management uses **React Context + useReducer** for UI state; server data is fetched and cached with **React Query (TanStack Query)**.

### Design Goals

- **Clarity first**: every pixel either conveys information or provides breathing room — no decorative clutter.
- **Actionable data**: AI forecasts and stock alerts surface the items that need attention without requiring the user to hunt.
- **Accessible by default**: semantic HTML, keyboard nav, and WCAG 2.1 AA contrast are first-class requirements, not afterthoughts.
- **Extensible shell**: the navigation bar and routing shell must accommodate future modules (POS, Customers, Finance) with zero structural changes.

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│  Browser                                                         │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  React SPA                                                │  │
│  │  ┌──────────────┐  ┌──────────────────────────────────┐  │  │
│  │  │  NavBar      │  │  Route Content Area              │  │  │
│  │  │  (Persistent)│  │  ┌─────────────────────────────┐ │  │  │
│  │  │              │  │  │  DashboardPage               │ │  │  │
│  │  │              │  │  │  ┌──────────────┬──────────┐ │ │  │  │
│  │  │              │  │  │  │BusinessOver  │SmartInv  │ │ │  │  │
│  │  │              │  │  │  │view (2/3)    │Focus(1/3)│ │ │  │  │
│  │  │              │  │  │  └──────────────┴──────────┘ │ │  │  │
│  │  │              │  │  └─────────────────────────────┘ │  │  │
│  │  └──────────────┘  └──────────────────────────────────┘  │  │
│  │                                                            │  │
│  │  Data Layer (React Query)                                 │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  useKpiSummary  useSalesChart  useInventory          │ │  │
│  │  └─────────────────────┬────────────────────────────────┘ │  │
│  └────────────────────────┼───────────────────────────────────┘  │
└───────────────────────────┼──────────────────────────────────────┘
                            │ HTTP / JSON
               ┌────────────▼─────────────────┐
               │  API Layer (mock / real)      │
               │  GET /api/kpi-summary         │
               │  GET /api/sales-chart         │
               │  GET /api/inventory           │
               │  GET /api/restock-plan        │
               └──────────────────────────────┘
```

### Technology Stack

| Concern | Choice | Rationale |
|---|---|---|
| UI Framework | React 18 + TypeScript | Industry standard SPA toolchain; strong typing prevents data-shape bugs |
| Styling | Tailwind CSS + CSS vars for tokens | Utility-first keeps co-location; design tokens (colors, spacing) live in one place |
| Charts | Recharts | Declarative React wrappers over D3; built-in accessibility props; responsive containers |
| Data fetching | TanStack Query v5 | Handles loading/error states, caching, and refetch intervals — no boilerplate |
| Routing | React Router v6 | Nested layouts make the persistent NavBar trivial to implement |
| Testing (unit) | Vitest + React Testing Library | Fast, Vite-native; RTL encourages accessible selector patterns |
| Testing (property) | fast-check | TypeScript-native PBT library; integrates with Vitest |
| Build | Vite | Near-instant HMR; straightforward TS+React config |

---

## Components and Interfaces

### Component Tree

```
<App>
  <Router>
    <AppShell>                   ← layout: flex row, h-screen
      <NavBar />                 ← w-64, full height, sticky
      <main>
        <Routes>
          <Route path="/"          element={<DashboardPage />} />
          <Route path="/pos"       element={<PosPage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/customers" element={<CustomersPage />} />
          <Route path="/finance"   element={<FinancePage />} />
        </Routes>
      </main>
    </AppShell>
  </Router>
</App>

<DashboardPage>
  <BusinessOverview>             ← flex-[2], border-r
    <SummaryCardRow>
      <SummaryCard key="revenue"      />
      <SummaryCard key="transactions" />
      <SummaryCard key="best-seller"  />
      <SummaryCard key="stock-alerts" />
    </SummaryCardRow>
    <SalesChartPanel />
  </BusinessOverview>
  <SmartInventoryFocus>          ← flex-[1]
    <ProductList />
    <RestockChartPanel />
  </SmartInventoryFocus>
</DashboardPage>
```

### Component Interfaces (TypeScript)

```typescript
// NavBar
interface NavItem {
  id: string;
  label: string;
  path: string;
  icon: React.ComponentType<{ className?: string }>;
}
interface NavBarProps {
  items: NavItem[];
  activePath: string;
}

// SummaryCard
interface SummaryCardProps {
  title: string;
  value: string | number;
  /** Optional sparkline/trend data points for the revenue card */
  trendData?: number[];
  /** Direction of trend: 'up' | 'down' | 'neutral' */
  trend?: 'up' | 'down' | 'neutral';
  /** Count of alerts; when > 0 renders Soft_Red badge */
  alertCount?: number;
  /** aria-label override for the trend graphic */
  trendAriaLabel?: string;
}

// SalesChartPanel
interface SalesChartProps {
  historicalData: SalesDataPoint[];
  predictionData: SalesDataPoint[];
  isLoading: boolean;
  /** aria-label for chart container */
  ariaLabel: string;
}
interface SalesDataPoint {
  date: string;   // ISO date string, e.g. "2025-06-01"
  revenue: number;
}

// ProductList
interface Product {
  id: string;
  name: string;
  sku: string;
  status: 'healthy' | 'low_stock';
  stockCount: number;
  aiForecasterDays: number; // estimated days until stockout
}
interface ProductListProps {
  products: Product[];
  isLoading: boolean;
}

// RestockChartPanel
interface RestockDataPoint {
  day: string;      // e.g. "Mon", "Tue"
  quantity: number;
}
interface RestockChartProps {
  data: RestockDataPoint[];
  isLoading: boolean;
  ariaLabel: string;
}
```

---

## Data Models

### API Response Models

```typescript
// GET /api/kpi-summary
interface KpiSummaryResponse {
  todayRevenue: {
    value: number;
    currency: string;          // e.g. "IDR"
    trend: 'up' | 'down' | 'neutral';
    trendPercent: number;      // e.g. 12.5 means +12.5%
    sparkline: number[];       // last N data points for mini-chart
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

// GET /api/sales-chart?range=6m
interface SalesChartResponse {
  historical: SalesDataPoint[];  // past months/weeks
  prediction: SalesDataPoint[];  // next month AI projection
  currency: string;
}

// GET /api/inventory
interface InventoryResponse {
  products: Product[];           // see Product interface above
  lastUpdated: string;           // ISO datetime
}

// GET /api/restock-plan
interface RestockPlanResponse {
  weekOf: string;                // ISO date of Monday
  plan: RestockDataPoint[];      // 7 items (Mon–Sun)
}
```

### Design Token Model

Design tokens are defined as CSS custom properties in `src/styles/tokens.css` and referenced via Tailwind config:

```css
:root {
  --color-deep-teal:  #0D7377;
  --color-neon-green: #39FF14;
  --color-soft-red:   #FF6B6B;
  --color-surface:    #FFFFFF;
  --color-border:     #E5E7EB;
  --color-text-primary:   #111827;
  --color-text-secondary: #6B7280;

  --spacing-base: 8px;
}
```

### Routing State Model

```typescript
// Managed by React Router; NavBar reads useLocation()
type ModuleId = 'dashboard' | 'pos' | 'inventory' | 'customers' | 'finance';

interface NavState {
  activeModuleId: ModuleId;
}
```

### Loading / Error State Model

Each data hook returns a standard shape from TanStack Query:

```typescript
interface QueryResult<T> {
  data: T | undefined;
  isLoading: boolean;
  isError: boolean;
  error: Error | null;
}
```

---

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Stock-alert badge reflects actual low-stock count

*For any* inventory dataset, the count shown in the "Stock Alerts" Summary_Card badge SHALL equal the number of products in that dataset whose `stockCount` is below the minimum threshold.

**Validates: Requirements 3.6, 3.7**

---

### Property 2: AI Forecast row emphasis is consistent with threshold

*For any* product list, every product whose `aiForecasterDays` is 7 or fewer SHALL have its row visually emphasized (the `emphasized` flag set to `true`), and every product whose `aiForecasterDays` is greater than 7 SHALL NOT be emphasized.

**Validates: Requirements 5.6**

---

### Property 3: Product status badge maps correctly to stock level

*For any* product, if `status` is `"low_stock"` the badge color SHALL be Soft_Red, and if `status` is `"healthy"` the badge color SHALL be Neon_Green — no other mapping is valid.

**Validates: Requirements 5.4**

---

### Property 4: Revenue trend direction agrees with data

*For any* KPI summary payload, when `trendPercent > 0` the trend value SHALL be `"up"`, when `trendPercent < 0` it SHALL be `"down"`, and when `trendPercent === 0` it SHALL be `"neutral"`.

**Validates: Requirements 3.3**

---

### Property 5: Active nav item is always the current route

*For any* navigation state, exactly one NavItem SHALL be marked active, and its `path` SHALL match the current URL pathname.

**Validates: Requirements 1.3, 1.5**

---

### Property 6: Sales chart data completeness

*For any* `SalesChartResponse`, every `SalesDataPoint` in both `historical` and `prediction` arrays SHALL have a non-empty `date` string and a non-negative `revenue` value.

**Validates: Requirements 4.2, 4.3**

---

### Property 7: Restock chart days are a subset of the week

*For any* `RestockPlanResponse`, every `RestockDataPoint.day` value SHALL be one of the seven canonical weekday abbreviations (`"Mon"` – `"Sun"`), and `quantity` SHALL be a non-negative integer.

**Validates: Requirements 6.2, 6.4**

---

## Error Handling

| Scenario | Handling Strategy |
|---|---|
| API request fails (network error, 5xx) | React Query retries 3× with exponential back-off; on final failure, component renders an inline error banner with a "Retry" button |
| Empty historical sales data | `SalesChartPanel` renders an empty-state illustration with the message "No sales data available yet" |
| Empty restock plan | `RestockChartPanel` renders an empty-state message "No restock plan scheduled" |
| Product list loading | Skeleton rows (5 placeholder rows) shown while `isLoading === true` |
| KPI data loading | Skeleton shimmer inside each `SummaryCard` |
| Unknown route | React Router `<Navigate to="/" replace />` redirects to dashboard |
| Missing `aiForecasterDays` value | Displayed as "–" in the AI Forecast column; row NOT emphasized |
| Invalid trend direction from API | Treated as `"neutral"` (defensive default) |

All error boundaries are implemented with React's `ErrorBoundary` pattern at the page level, catching unexpected render errors and displaying a full-page fallback.

---

## Testing Strategy

### Dual Approach

Both unit/example-based tests and property-based tests are used. Unit tests cover specific examples, integration points, loading/error states, and accessibility markup. Property tests cover universal behavioral invariants across generated data.

### Unit Tests (Vitest + React Testing Library)

- **NavBar**: renders all five module links; active state updates on click; keyboard Tab navigation moves focus sequentially.
- **SummaryCard**: renders title and value; renders Neon_Green trend graphic when `trend="up"`; renders Soft_Red badge when `alertCount > 0`; aria-label is present on trend graphic.
- **SalesChartPanel**: renders legend with two entries; shows empty-state when both arrays are empty; aria-label is present on chart wrapper.
- **ProductList**: renders correct column headers (`Product`, `SKU`, `Status`, `AI Forecast`); shows skeleton rows during loading; Soft_Red row emphasis applied when `aiForecasterDays <= 7`.
- **RestockChartPanel**: renders labeled axes; shows empty-state when data is empty; aria-label is present.
- **Design tokens**: CSS custom properties resolve to correct hex values in the computed style.

### Property-Based Tests (Vitest + fast-check)

Each property test runs a **minimum of 100 iterations**.

#### Property 1 — Stock-alert count
```
Feature: umkm-pulse-dashboard, Property 1: Stock-alert badge reflects actual low-stock count
```
Generate an arbitrary list of products with random `stockCount` values and a random threshold. Assert that `computeStockAlertCount(products, threshold)` equals `products.filter(p => p.stockCount < threshold).length`.

#### Property 2 — AI Forecast row emphasis
```
Feature: umkm-pulse-dashboard, Property 2: AI Forecast row emphasis is consistent with threshold
```
Generate an arbitrary list of products with random `aiForecasterDays`. Assert that after calling `applyRowEmphasis(products)`, every product with `aiForecasterDays <= 7` has `emphasized === true` and every other product has `emphasized === false`.

#### Property 3 — Status badge color mapping
```
Feature: umkm-pulse-dashboard, Property 3: Product status badge maps correctly to stock level
```
Generate a product with status sampled from `["healthy", "low_stock"]`. Assert that `getStatusBadgeColor(product.status)` returns `neonGreen` if `"healthy"` and `softRed` if `"low_stock"`.

#### Property 4 — Revenue trend direction
```
Feature: umkm-pulse-dashboard, Property 4: Revenue trend direction agrees with data
```
Generate an arbitrary `trendPercent: number`. Assert that `deriveTrendDirection(trendPercent)` returns `"up"` when `> 0`, `"down"` when `< 0`, and `"neutral"` when `=== 0`.

#### Property 5 — Active nav item uniqueness
```
Feature: umkm-pulse-dashboard, Property 5: Active nav item is always the current route
```
Generate an arbitrary `NavItem[]` and one path from the list. Assert that `markActiveNavItem(items, path)` results in exactly one item with `active === true` and its `path` matches the input path.

#### Property 6 — Sales data completeness
```
Feature: umkm-pulse-dashboard, Property 6: Sales chart data completeness
```
Generate an arbitrary `SalesChartResponse`. Assert that every `SalesDataPoint` in both arrays has a truthy `date` string and `revenue >= 0`.

#### Property 7 — Restock day validity
```
Feature: umkm-pulse-dashboard, Property 7: Restock chart days are a subset of the week
```
Generate an arbitrary `RestockPlanResponse`. Assert that every `RestockDataPoint.day` is in `["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]` and `quantity >= 0`.

### Accessibility Testing

- **Automated**: `jest-axe` (or `vitest-axe`) runs on every page-level render to catch WCAG violations at CI time.
- **Manual**: keyboard-only walkthrough and screen-reader smoke test (NVDA/VoiceOver) before each release milestone.
- **Contrast**: design tokens are validated against the 4.5:1 ratio requirement using a contrast-checker script in the CI pipeline.

### Integration / E2E

- **Playwright** smoke tests cover the happy-path dashboard render and the navigation active-state behavior against the mock API dev server.
