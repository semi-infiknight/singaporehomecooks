import { useQuery } from '@tanstack/react-query';
import { getPlatformStats } from './api-client';

export function usePlatformStats() {
  return useQuery({
    queryKey: ['platform-stats'],
    queryFn: getPlatformStats,
    staleTime: 60_000,
  });
}
