import { useQuery } from '@tanstack/react-query';
import { discoverHomePromoCarousel, type DiscoverHomePromo } from '@shc/utils';
import { client } from '../lib/api-client';

export function useDiscoverPromos() {
  const fallback = discoverHomePromoCarousel();
  const query = useQuery({
    queryKey: ['discover-promos'],
    queryFn: () => client.getDiscoverPromos() as Promise<DiscoverHomePromo[]>,
    staleTime: 60_000,
  });
  const promos = query.data?.length ? query.data : fallback;
  return { promos, ...query };
}
