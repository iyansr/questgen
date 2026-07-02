import { useQuery } from '@tanstack/react-query';

import { api } from '@/services/fetcher';

import { QUERY_KEYS } from '../api/query-keys';

export type DashboardStats = {
  totalQuestions: number;
  savedSets: number;
  uploadedDocuments: number;
};

export async function getDashboardStatsService() {
  return api.get('dashboard/stats').json<DashboardStats>();
}

export function useDashboardStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.DASHBOARD.STATS],
    queryFn: getDashboardStatsService,
  });
}
