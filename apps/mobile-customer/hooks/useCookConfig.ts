import { useQuery } from '@tanstack/react-query';
import {
  defaultCookPortalConfig,
  type CookPortalConfig,
} from '@shc/utils';
import { client } from '../lib/api-client';

const FALLBACK = defaultCookPortalConfig();

/** Shared cook portal chrome — used by customer chat for quick replies too. */
export function useCookConfig() {
  const query = useQuery({
    queryKey: ['cook-config'],
    queryFn: () => client.getCookConfig() as Promise<{ config: CookPortalConfig; source?: string }>,
    staleTime: 60_000,
  });
  const config = query.data?.config ?? FALLBACK;
  return { config, ...query };
}
