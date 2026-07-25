import { useInventory } from '../hooks/useInventory';
import { useRestockPlan } from '../hooks/useRestockPlan';
import ProductList from './ProductList';
import RestockChartPanel from './RestockChartPanel';

// ─── SmartInventoryFocus ──────────────────────────────────────────────────────

export default function SmartInventoryFocus() {
  const {
    data: inventoryData,
    isLoading: isInventoryLoading,
    isError: isInventoryError,
    refetch: refetchInventory,
  } = useInventory();

  const {
    data: restockData,
    isLoading: isRestockLoading,
    isError: isRestockError,
    refetch: refetchRestock,
  } = useRestockPlan();

  const products = inventoryData?.products ?? [];
  const restockPlan = restockData?.plan ?? [];

  const ariaLabel = 'Weekly restock plan — quantities grouped by day of week';

  return (
    <section
      aria-label="Smart Inventory Focus"
      className="flex-[1] flex flex-col gap-6 p-6 overflow-y-auto"
    >
      {/* Product List — error banner is rendered inline by the component */}
      <ProductList
        products={products}
        isLoading={isInventoryLoading}
        isError={isInventoryError}
        refetch={() => void refetchInventory()}
      />

      {/* Restock Chart — error banner is rendered inline by the component */}
      <RestockChartPanel
        data={restockPlan}
        isLoading={isRestockLoading}
        ariaLabel={ariaLabel}
        isError={isRestockError}
        refetch={() => void refetchRestock()}
      />
    </section>
  );
}
