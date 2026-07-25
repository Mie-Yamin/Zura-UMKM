import { useQuery } from '@tanstack/react-query';
import { fetchKpiSummary } from '../api/client';
import type { KpiSummaryResponse } from '../types';

export function useKpiSummary() {
  return useQuery<KpiSummaryResponse, Error>({
    queryKey: ['kpi-summary'],
    queryFn: fetchKpiSummary,
  });
}
