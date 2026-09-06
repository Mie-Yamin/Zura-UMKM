import { useQuery } from '@tanstack/react-query';
import { fetchRestockPlan } from '../api/client';
import type { RestockPlanResponse } from '../types';

export function useRestockPlan() {
  return useQuery<RestockPlanResponse, Error>({
    queryKey: ['restock-plan'],
    queryFn: () => fetchRestockPlan(),
  });
}
