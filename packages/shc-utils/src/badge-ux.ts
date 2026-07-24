/**
 * SHCBadge semantic kinds — tri-platform product logic (web + mobile).
 * Screens use SHCMetaBadge / label helpers; do not hand-pick warm vs default.
 */

export type ShcBadgeVariant = 'default' | 'success' | 'warning' | 'error' | 'warm';

/** What the chip represents — maps to variant via shcBadgeVariant(). */
export type ShcBadgeSemanticKind =
  /** Food culture: Peranakan, Malay, etc. */
  | 'cuisine'
  /** Hari Raya, CNY, kitchen tags, listing occasion tags */
  | 'occasion'
  /** Collab / catering headcount */
  | 'party_size'
  /** When food is cooked or ready for collection */
  | 'cook_date'
  /** Minimum order portions */
  | 'portion_min'
  /** Tiffin subscription meals per week */
  | 'meal_plan'
  /** Customer can customize the meal */
  | 'customizable'
  /** Listing photo guidance */
  | 'photo_tips'
  /** Loyalty / subscription tier */
  | 'tier'
  /** Earnings or reporting period (e.g. "This week") */
  | 'period'
  /** Positive earnings / payout total */
  | 'earnings'
  /** Price, fees — neutral */
  | 'price'
  /** Collection time slot */
  | 'slot'
  /** Operational calendar date (not cook day) */
  | 'date'
  /** Generic neutral label (empty states, counts) */
  | 'label'
  /** Compliance document type */
  | 'upload_type'
  /** Tax / regulatory tag */
  | 'tax'
  /** Halal certified */
  | 'halal'
  /** Listing or feature paused */
  | 'paused'
  /** Live, published, on */
  | 'live';

const WARM_KINDS = new Set<ShcBadgeSemanticKind>([
  'cuisine',
  'occasion',
  'party_size',
  'cook_date',
  'portion_min',
  'meal_plan',
  'customizable',
  'photo_tips',
  'tier',
  'period',
]);

const SUCCESS_KINDS = new Set<ShcBadgeSemanticKind>(['halal', 'live', 'earnings']);

/** Product rule: kind → badge variant. */
export function shcBadgeVariant(kind: ShcBadgeSemanticKind): ShcBadgeVariant {
  if (WARM_KINDS.has(kind)) return 'warm';
  if (SUCCESS_KINDS.has(kind)) return 'success';
  if (kind === 'paused') return 'warning';
  return 'default';
}

export function shcMealPlanBadgeLabel(mealsPerWeek: number | string): string {
  return `${mealsPerWeek} meals/wk`;
}

export function shcPartySizeBadgeLabel(partySize: number | string): string {
  return `${partySize} guests`;
}

export function shcPortionMinBadgeLabel(minQty: number | string): string {
  return `min ${minQty}`;
}

export function shcTierBadgeLabel(tier: string): string {
  return `${tier} tier`;
}

export function shcUploadTypeBadgeLabel(type: string): string {
  return `${type.toUpperCase()} upload`;
}

/** Order / fulfilment status → semantic badge variant. */
export function shcOrderStatusBadgeVariant(status: string): ShcBadgeVariant {
  const s = status.toLowerCase();
  if (s === 'completed' || s === 'collected' || s === 'delivered') return 'success';
  if (s === 'paid' || s === 'ready_for_collection' || s === 'accepted') return 'warning';
  if (s === 'canceled' || s === 'cancelled' || s === 'failed') return 'error';
  return 'default';
}

export function shcOrderStatusBadgeLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

/** Drop open vs closed. */
export function shcDropStatusBadgeVariant(open: boolean): ShcBadgeVariant {
  return open ? 'success' : 'warning';
}

/** Subscription paused vs active. */
export function shcSubscriptionStatusBadgeVariant(paused: boolean): ShcBadgeVariant {
  return paused ? 'warning' : 'success';
}

/** Collab request matched vs pending. */
export function shcCollabRequestBadgeVariant(matched: boolean): ShcBadgeVariant {
  return matched ? 'success' : 'warning';
}
