/**
 * SHC Ops dashboard refresh policy — near-realtime polling (not WebSocket push).
 * All SHC Ops pages import these constants so behaviour stays consistent.
 */

/** Hot paths: orders board, compliance queue, HitPay. */
export const SHC_OPS_POLL_FAST_MS = 30_000

/** Default auto-refresh for overview, charts, listings, controls. */
export const SHC_OPS_POLL_MS = 45_000

/** React Query options spread onto every SHC Ops useQuery. */
export const shcOpsLiveQuery = {
  refetchInterval: SHC_OPS_POLL_MS,
  refetchIntervalInBackground: false,
} as const

export const shcOpsLiveQueryFast = {
  refetchInterval: SHC_OPS_POLL_FAST_MS,
  refetchIntervalInBackground: false,
} as const
