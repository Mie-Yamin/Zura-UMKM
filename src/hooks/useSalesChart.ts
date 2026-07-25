import { useQuery } from '@tanstack/react-query';
import { fetchSalesChart } from '../api/client';
import type { SalesChartResponse } from '../types';

export function useSalesChart() {
  return useQuery<SalesChartResponse, Error>({
    queryKey: ['sales-chart'],
    queryFn: fetchSalesChart,
  });
}
