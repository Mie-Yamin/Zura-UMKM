import BusinessOverview from '../components/BusinessOverview';
import SmartInventoryFocus from '../components/SmartInventoryFocus';

// ─── DashboardPage ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  return (
    <div
      className="flex min-h-full w-full bg-white min-w-[1280px]"
      aria-label="Dashboard"
    >
      {/* Two-thirds: Business Overview */}
      <BusinessOverview />

      {/* One-third: Smart Inventory Focus */}
      <SmartInventoryFocus />
    </div>
  );
}
