# Requirements Document

## Introduction

UMKM Pulse is a smart business management web application dashboard designed for small and medium enterprises (UMKM). The dashboard provides an all-in-one interface for monitoring business performance, managing sales and inventory, tracking customers, and overseeing finances. It features AI-powered insights including revenue predictions and inventory stockout forecasting. The UI is clean and modern, prioritizing clarity, accessibility, and actionable data presentation.

## Glossary

- **Dashboard**: The main landing screen of UMKM Pulse showing the Business Overview and Smart Inventory Focus sections.
- **Navigation_Bar**: The persistent left-side vertical navigation panel containing primary module links.
- **Business_Overview**: The left two-thirds panel of the main content area containing summary cards and the sales chart.
- **Smart_Inventory_Focus**: The right one-third panel of the main content area containing the product list and restock chart.
- **Summary_Card**: A compact UI widget displaying a single KPI metric with supporting visual indicator.
- **Sales_Chart**: A line graph visualizing Historical Sales data alongside AI Revenue Prediction for the upcoming month.
- **Product_List**: A tabular component displaying inventory items with SKU, status, and AI forecast columns.
- **Restock_Chart**: A bar chart visualizing the weekly restock plan for inventory items.
- **AI_Forecast**: The AI-generated prediction showing estimated days until a product stockout occurs.
- **Stock_Alert**: A visual badge indicating that a product's inventory has reached a critically low level.
- **POS**: Point of Sale — the module for recording and managing sales transactions.
- **SKU**: Stock Keeping Unit — a unique identifier for each inventory product.
- **Deep_Teal**: The primary accent color (e.g., `#0D7377` or equivalent) used for active states and key UI elements.
- **Neon_Green**: The positive data color (e.g., `#39FF14` or equivalent) used for growth indicators and healthy statuses.
- **Soft_Red**: The alert color (e.g., `#FF6B6B` or equivalent) used for critical alerts and low-stock indicators.

---

## Requirements

### Requirement 1: Application Shell and Navigation

**User Story:** As a business owner, I want a persistent and clearly structured navigation bar, so that I can quickly switch between the key modules of UMKM Pulse at any time.

#### Acceptance Criteria

1. THE Navigation_Bar SHALL be rendered on the left side of the viewport and remain visible on all primary module screens.
2. THE Navigation_Bar SHALL display the following module links in order: Dashboard, Sales/POS, Smart Inventory, Customers, and Finance.
3. WHEN a module link is active, THE Navigation_Bar SHALL visually distinguish it using the Deep_Teal accent color and a filled icon style.
4. THE Navigation_Bar SHALL display a distinct icon alongside the text label for each module link.
5. WHEN a user clicks a module link, THE Navigation_Bar SHALL update the active state to reflect the selected module.
6. THE Navigation_Bar SHALL display the UMKM Pulse application name or logo at the top of the bar.

---

### Requirement 2: Dashboard Layout

**User Story:** As a business owner, I want the dashboard to present key business and inventory data side by side, so that I can view my operational status at a glance without scrolling horizontally.

#### Acceptance Criteria

1. THE Dashboard SHALL render the Business_Overview section occupying approximately two-thirds of the main content area width.
2. THE Dashboard SHALL render the Smart_Inventory_Focus section occupying approximately one-third of the main content area width.
3. THE Dashboard SHALL display the Business_Overview and Smart_Inventory_Focus sections side by side in a single horizontal row.
4. THE Dashboard SHALL use a white background, soft grey borders between sections, and generous whitespace between all UI elements.
5. THE Dashboard SHALL be responsive and maintain a readable layout at viewport widths of 1280px and above.

---

### Requirement 3: Business Overview — Summary Cards

**User Story:** As a business owner, I want to see four key performance indicator cards at the top of my dashboard, so that I can instantly understand today's most critical business metrics.

#### Acceptance Criteria

1. THE Business_Overview SHALL display exactly four Summary_Cards in a horizontal row at the top of the section.
2. THE Dashboard SHALL render a "Today's Revenue" Summary_Card displaying the current day's total revenue value.
3. WHEN the revenue has grown compared to the previous period, THE "Today's Revenue" Summary_Card SHALL display a Neon_Green upward trend line graphic.
4. THE Dashboard SHALL render a "Transactions" Summary_Card displaying the total count of transactions for the current day.
5. THE Dashboard SHALL render a "Best Seller Product" Summary_Card displaying the name of the top-selling product for the current day.
6. THE Dashboard SHALL render a "Stock Alerts" Summary_Card displaying the count of products currently below the minimum stock threshold.
7. WHEN one or more products are below the minimum stock threshold, THE "Stock Alerts" Summary_Card SHALL display a Soft_Red warning badge with the alert count.
8. THE Dashboard SHALL render each Summary_Card with a white background, soft grey border, and clean typography.

---

### Requirement 4: Business Overview — Sales Chart

**User Story:** As a business owner, I want to see a historical sales chart with an AI revenue prediction overlay, so that I can compare past performance with future projections to inform purchasing and staffing decisions.

#### Acceptance Criteria

1. THE Business_Overview SHALL display the Sales_Chart below the four Summary_Cards.
2. THE Sales_Chart SHALL render a line representing Historical Sales data across a time axis.
3. THE Sales_Chart SHALL render a second line representing AI Revenue Prediction data for the next month.
4. THE Sales_Chart SHALL visually differentiate the Historical Sales line from the AI Revenue Prediction line using distinct colors or line styles (e.g., solid vs. dashed).
5. THE Sales_Chart SHALL display a legend identifying each of the two data lines.
6. THE Sales_Chart SHALL display labeled axes: a horizontal time axis and a vertical revenue axis with currency units.
7. WHEN no historical sales data is available, THE Sales_Chart SHALL display an empty-state message in place of the chart.

---

### Requirement 5: Smart Inventory Focus — Product List

**User Story:** As a business owner, I want to see a detailed inventory product list with AI stockout forecasts, so that I can proactively plan restocking before items run out.

#### Acceptance Criteria

1. THE Smart_Inventory_Focus SHALL display the Product_List as a table with the following columns in order: Product, SKU, Status, and AI Forecast.
2. THE Product_List SHALL display each product's name in the "Product" column.
3. THE Product_List SHALL display each product's unique identifier in the "SKU" column.
4. THE Product_List SHALL display each product's inventory status in the "Status" column using a colored badge (Neon_Green for "Healthy", Soft_Red for "Low Stock").
5. THE Product_List SHALL display the AI_Forecast for each product in the "AI Forecast" column, including a brain icon and the estimated days until stockout (e.g., "5 days").
6. WHEN a product's AI_Forecast indicates 7 days or fewer until stockout, THE Product_List SHALL visually emphasize that row using a Soft_Red highlight or indicator.
7. THE Product_List SHALL render rows with alternating or clearly separated styling for readability.
8. WHEN the product inventory data is loading, THE Product_List SHALL display a loading skeleton in place of the table rows.

---

### Requirement 6: Smart Inventory Focus — Weekly Restock Chart

**User Story:** As a business owner, I want to see a weekly restock plan chart below the product list, so that I can understand the recommended restock schedule at a glance.

#### Acceptance Criteria

1. THE Smart_Inventory_Focus SHALL display the Restock_Chart below the Product_List.
2. THE Restock_Chart SHALL be a bar chart displaying restock quantities grouped by day of the week.
3. THE Restock_Chart SHALL use the Deep_Teal accent color for bar fill.
4. THE Restock_Chart SHALL display labeled axes: a horizontal day axis and a vertical quantity axis.
5. WHEN no restock plan data is available, THE Restock_Chart SHALL display an empty-state message in place of the chart.

---

### Requirement 7: Visual Design System

**User Story:** As a business owner, I want the dashboard to have a consistent, modern, and professional visual style, so that I can trust the tool and use it comfortably for extended periods.

#### Acceptance Criteria

1. THE Dashboard SHALL use a primary background color of bright white for all main content surfaces.
2. THE Dashboard SHALL use Deep_Teal as the primary accent color for active navigation states, chart elements, and interactive controls.
3. THE Dashboard SHALL use Neon_Green exclusively to represent positive data trends, healthy statuses, and growth indicators.
4. THE Dashboard SHALL use Soft_Red exclusively to represent critical alerts, low-stock conditions, and negative indicators.
5. THE Dashboard SHALL use soft grey for borders, dividers, and secondary text elements.
6. THE Dashboard SHALL apply consistent spacing using a base-8px spacing scale throughout all layout regions.
7. THE Dashboard SHALL use a single, clean sans-serif typeface for all text elements, with a clear typographic hierarchy (heading, subheading, body, caption sizes).
8. THE Dashboard SHALL render all icons in a consistent icon set style (outline or filled, not mixed) matching the active/inactive navigation state convention.

---

### Requirement 8: Accessibility

**User Story:** As a business owner, I want the dashboard to be accessible, so that users with visual impairments or keyboard-only navigation can use the tool effectively.

#### Acceptance Criteria

1. THE Dashboard SHALL provide sufficient color contrast between text and background, meeting a minimum contrast ratio of 4.5:1 for normal text as defined by WCAG 2.1 AA.
2. THE Navigation_Bar SHALL support keyboard navigation, allowing focus to move between module links using the Tab key.
3. WHEN a Summary_Card contains a trend graphic, THE Dashboard SHALL provide an accessible text alternative (aria-label) describing the trend direction and value.
4. THE Product_List SHALL use semantic HTML table markup with appropriate column header elements to support screen reader navigation.
5. THE Sales_Chart and Restock_Chart SHALL each include a descriptive aria-label attribute summarizing the chart's purpose and data range.
6. WHEN a Stock_Alert badge is displayed, THE Dashboard SHALL include an aria-label conveying the alert count and its meaning to assistive technologies.
