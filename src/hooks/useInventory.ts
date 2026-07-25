import { useQuery } from '@tanstack/react-query';
import { fetchInventory } from '../api/client';
import type { InventoryResponse } from '../types';

export function useInventory() {
  return useQuery<InventoryResponse, Error>({
    queryKey: ['inventory'],
    queryFn: fetchInventory,
  });
}
