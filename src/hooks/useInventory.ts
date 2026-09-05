import { useQuery } from '@tanstack/react-query';
import { fetchInventory } from '../api/client';
import type { InventoryResponse } from '../types';

export function useInventory() {
  return useQuery<InventoryResponse, Error>({
    queryKey: ['inventory-summary'],
    queryFn: async () => {
      const res = await fetchInventory();
      const products = Array.isArray(res) ? res : [];
      return {
        products,
        lastUpdated: new Date().toISOString(),
      };
    },
  });
}