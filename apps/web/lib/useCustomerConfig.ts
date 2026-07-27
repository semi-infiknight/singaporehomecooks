import { useQuery } from '@tanstack/react-query';
import {
  buildCustomerConfigPayload,
  type CustomerConfigPayload,
} from '@shc/utils';
import { client } from './api-client';

const FALLBACK = buildCustomerConfigPayload({});

export function useCustomerConfig() {
  const query = useQuery({
    queryKey: ['customer-config'],
    queryFn: () => client.getCustomerConfig() as Promise<CustomerConfigPayload & { source?: string }>,
    staleTime: 60_000,
  });
  const data = query.data;
  const categories = data?.categories?.length ? data.categories : FALLBACK.categories;
  const promos = data?.promos?.length ? data.promos : FALLBACK.promos;
  const config = data?.config ?? FALLBACK.config;
  return { categories, promos, config, ...query };
}
