import { useQuery } from '@tanstack/react-query';
import {
  businessRulesCommissionRate,
  defaultBusinessRulesConfig,
  normalizeBusinessRulesConfig,
  type BusinessRulesConfig,
} from '@shc/utils';
import { client } from './api-client';

const FALLBACK = defaultBusinessRulesConfig();

export function useBusinessRules() {
  const query = useQuery({
    queryKey: ['business-rules'],
    queryFn: () => client.getBusinessRules() as Promise<{ config: BusinessRulesConfig; source?: string }>,
    staleTime: 60_000,
  });
  const config = normalizeBusinessRulesConfig(query.data?.config ?? FALLBACK);
  const commissionRate = businessRulesCommissionRate(config);
  const commissionRatePct = config.commission.default_rate_pct;
  return { config, commissionRate, commissionRatePct, ...query };
}
