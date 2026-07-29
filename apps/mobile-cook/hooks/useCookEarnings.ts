import { useQuery } from '@tanstack/react-query';
import { getEarnings } from '../lib/api-client';

export function useCookEarnings() {
  return useQuery({
    queryKey: ['cook-earnings'],
    queryFn: getEarnings,
  });
}
