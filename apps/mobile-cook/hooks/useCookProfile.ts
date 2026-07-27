import { useQuery } from '@tanstack/react-query';
import { getCookProfile } from '../lib/api-client';

export function useCookProfile() {
  return useQuery({
    queryKey: ['cook-profile'],
    queryFn: async () => {
      const res = await getCookProfile();
      return res.cook as Record<string, unknown>;
    },
  });
}
