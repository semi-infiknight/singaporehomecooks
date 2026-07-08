/** Canonical Railway Medusa — sole client backend. Local Medusa is not supported. */
export const RAILWAY_MEDUSA_BASE = 'https://medusa-production-d2ba.up.railway.app' as const;

export const RAILWAY_MEDUSA_PUBLISHABLE_KEY =
  'pk_0c98d5a5c7ba76cad2ea42501361d8e29825876bcedb8425a627f35a2c12b9b2' as const;

const LOCAL_HOST_RE = /localhost|127\.0\.0\.1/i;

export function assertRailwayMedusaBase(url: string, label = 'MEDUSA_BASE'): string {
  const normalized = url.replace(/\/$/, '');
  if (LOCAL_HOST_RE.test(normalized)) {
    throw new Error(
      `${label} must point at Railway (${RAILWAY_MEDUSA_BASE}). Local Medusa backend is disabled.`
    );
  }
  return normalized;
}

export function resolveRailwayMedusaBase(envValue?: string | null): string {
  const base = (envValue?.trim() || RAILWAY_MEDUSA_BASE).replace(/\/$/, '');
  return assertRailwayMedusaBase(base);
}

export function resolveRailwayPublishableKey(envValue?: string | null): string {
  return envValue?.trim() || RAILWAY_MEDUSA_PUBLISHABLE_KEY;
}