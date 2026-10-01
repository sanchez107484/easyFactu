'use client';

import { useQuery } from '@tanstack/react-query';
import { activityApi } from '@/lib/api/activity-api';
import { ActivitySummary } from '@easyfactura/shared-types';

export function useActivitySummary() {
  return useQuery<ActivitySummary>({
    queryKey: ['activity', 'summary'],
    queryFn: () => activityApi.getSummary(),
    staleTime: 60_000,
  });
}
