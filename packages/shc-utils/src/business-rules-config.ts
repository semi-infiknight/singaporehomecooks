/**
 * Marketplace business rules — admin-managed platform config with code defaults.
 * Versioned commission schedules stay in shc_commission_rule; this is the fallback + tunables.
 */

import {
  DEFAULT_COMMISSION_RATE,
  DROP_CUSTOMER_WINDOW_DAYS,
  TIFFIN_CUSTOMIZE_CUTOFF_HOURS,
} from '@shc/business-rules';

export const BUSINESS_RULES_CONFIG_KEY = 'business_rules_config';

export type BusinessRulesConfig = {
  commission: {
    /** Fallback when no versioned commission rule is effective */
    default_rate_pct: number;
  };
  drop: {
    /** Customer feed horizon — cook dates today through +N days inclusive */
    customer_window_days: number;
  };
  tiffin: {
    /** Hours before collection slot when skip/customize is blocked */
    customize_cutoff_hours: number;
  };
  cart: {
    one_cook_enforced: boolean;
  };
  review: {
    eligible_statuses: string[];
  };
};

export function defaultBusinessRulesConfig(): BusinessRulesConfig {
  return {
    commission: { default_rate_pct: Math.round(DEFAULT_COMMISSION_RATE * 100) },
    drop: { customer_window_days: DROP_CUSTOMER_WINDOW_DAYS },
    tiffin: { customize_cutoff_hours: TIFFIN_CUSTOMIZE_CUTOFF_HOURS },
    cart: { one_cook_enforced: true },
    review: { eligible_statuses: ['collected', 'completed'] },
  };
}

function clampInt(value: unknown, min: number, max: number, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  const floored = Math.floor(n);
  if (floored < min) return fallback;
  return Math.min(max, floored);
}

function clampRatePct(value: unknown, fallback: number): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(100, Math.max(0, Math.round(n * 100) / 100));
}

function normalizeStatuses(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value
    .map((s) => String(s || '').trim().toLowerCase())
    .filter(Boolean);
  return cleaned.length ? Array.from(new Set(cleaned)) : [...fallback];
}

/** Merge partial admin payload onto frozen defaults. */
export function normalizeBusinessRulesConfig(input?: Partial<BusinessRulesConfig> | null): BusinessRulesConfig {
  const base = defaultBusinessRulesConfig();
  if (!input || typeof input !== 'object') return base;

  return {
    commission: {
      default_rate_pct: clampRatePct(
        input.commission?.default_rate_pct,
        base.commission.default_rate_pct
      ),
    },
    drop: {
      customer_window_days: clampInt(
        input.drop?.customer_window_days,
        1,
        30,
        base.drop.customer_window_days
      ),
    },
    tiffin: {
      customize_cutoff_hours: clampInt(
        input.tiffin?.customize_cutoff_hours,
        1,
        72,
        base.tiffin.customize_cutoff_hours
      ),
    },
    cart: {
      one_cook_enforced:
        typeof input.cart?.one_cook_enforced === 'boolean'
          ? input.cart.one_cook_enforced
          : base.cart.one_cook_enforced,
    },
    review: {
      eligible_statuses: normalizeStatuses(input.review?.eligible_statuses, base.review.eligible_statuses),
    },
  };
}

export function businessRulesCommissionRate(config: BusinessRulesConfig): number {
  return config.commission.default_rate_pct / 100;
}
