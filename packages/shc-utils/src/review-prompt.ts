/**
 * Timely post-collection review prompts.
 * Ask ~1 hour after collection so the customer has usually eaten.
 * Dimensions: taste, communication, presentation, quantity, oily, spicy.
 */

/** Delay after collection before auto review notification (1 hour). */
export const REVIEW_PROMPT_DELAY_MS = 60 * 60 * 1000;

export const REVIEW_PROMPT_DELAY_LABEL = 'about an hour after collection';

export type ReviewDimensionId =
  | 'taste'
  | 'communication'
  | 'presentation'
  | 'quantity'
  | 'oily'
  | 'spicy';

export type ReviewDimensionDef = {
  id: ReviewDimensionId;
  label: string;
  /** Short helper under the stars */
  hint?: string;
};

/** Criteria customers rate after a meal — product request. */
export const REVIEW_DIMENSIONS: readonly ReviewDimensionDef[] = [
  { id: 'taste', label: 'Taste of food' },
  { id: 'communication', label: 'Communication' },
  { id: 'presentation', label: 'Presentation' },
  { id: 'quantity', label: 'Quantity' },
  { id: 'oily', label: 'How oily', hint: '1 = not oily · 5 = very oily' },
  { id: 'spicy', label: 'How spicy', hint: '1 = mild · 5 = very spicy' },
] as const;

export type ReviewDimensionScores = Partial<Record<ReviewDimensionId, number>>;

/** In-app / push type — unique per order so the worker is idempotent. */
export function reviewPromptNotificationType(orderId: string): string {
  return `review_prompt:${String(orderId || '').trim()}`;
}

export function orderIdFromReviewPromptType(type: string | undefined | null): string | null {
  if (!type || !type.startsWith('review_prompt:')) return null;
  const id = type.slice('review_prompt:'.length).trim();
  return id || null;
}

export function isReviewPromptNotification(type: string | undefined | null): boolean {
  return Boolean(orderIdFromReviewPromptType(type));
}

/**
 * True when enough time has passed since collection for the timed review ask.
 * `collectedAt` = when status became collected (usually meta.updated_at at transition).
 */
export function isReviewPromptDue(
  collectedAt: string | Date | null | undefined,
  nowMs: number = Date.now(),
  delayMs: number = REVIEW_PROMPT_DELAY_MS
): boolean {
  if (collectedAt == null || collectedAt === '') return false;
  const t = collectedAt instanceof Date ? collectedAt.getTime() : Date.parse(String(collectedAt));
  if (!Number.isFinite(t)) return false;
  return nowMs >= t + delayMs;
}

export type ReviewPromptGateInput = {
  shcStatus: string;
  /** ISO timestamp when order was marked collected (or updated_at while collected). */
  collectedAt?: string | Date | null;
  hasReview: boolean;
  /** True if we already sent review_prompt:{orderId} to this customer. */
  alreadyPrompted: boolean;
  nowMs?: number;
  delayMs?: number;
  eligibleStatuses?: readonly string[];
};

/**
 * Worker gate: send automatic review notification only when due, once, after collection.
 */
export function shouldSendReviewPrompt(input: ReviewPromptGateInput): boolean {
  const eligible = input.eligibleStatuses ?? ['collected', 'completed'];
  const status = String(input.shcStatus || '').toLowerCase();
  if (!eligible.includes(status)) return false;
  if (input.hasReview) return false;
  if (input.alreadyPrompted) return false;
  return isReviewPromptDue(input.collectedAt, input.nowMs ?? Date.now(), input.delayMs ?? REVIEW_PROMPT_DELAY_MS);
}

export function buildReviewPromptCopy(input: {
  cookName?: string;
  dishSummary?: string;
  orderRef?: string;
}): { title: string; body: string } {
  const cook = (input.cookName || 'your home cook').trim() || 'your home cook';
  const dishes = (input.dishSummary || 'your meal').trim() || 'your meal';
  const ref = input.orderRef ? ` (#${input.orderRef})` : '';
  return {
    title: 'How was your meal?',
    body: `Hope you enjoyed ${dishes} from ${cook}${ref}. Rate taste, communication, presentation, quantity, oily & spicy — takes a minute.`,
  };
}

/** Clamp dimension score to 1–5 stars. */
export function clampReviewScore(n: unknown): number | undefined {
  const v = typeof n === 'number' ? n : Number(n);
  if (!Number.isFinite(v)) return undefined;
  const r = Math.round(v);
  if (r < 1 || r > 5) return undefined;
  return r;
}

export function normalizeDimensionScores(raw: ReviewDimensionScores | null | undefined): ReviewDimensionScores {
  const out: ReviewDimensionScores = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const dim of REVIEW_DIMENSIONS) {
    const score = clampReviewScore(raw[dim.id]);
    if (score != null) out[dim.id] = score;
  }
  return out;
}

/** Overall star rating from filled dimensions (rounded mean); null if none set. */
export function overallRatingFromDimensions(scores: ReviewDimensionScores): number | null {
  const vals = REVIEW_DIMENSIONS.map((d) => scores[d.id]).filter((n): n is number => n != null);
  if (!vals.length) return null;
  const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
  return Math.min(5, Math.max(1, Math.round(avg)));
}

/**
 * Merge dimension scores into the review body text for storage without a schema migration.
 * Human-readable and stable for cook display.
 */
export function formatReviewBodyWithDimensions(
  note: string | undefined,
  scores: ReviewDimensionScores
): string | undefined {
  const dims = normalizeDimensionScores(scores);
  const lines: string[] = [];
  const dimParts = REVIEW_DIMENSIONS.map((d) => {
    const s = dims[d.id];
    return s != null ? `${d.label}: ${s}/5` : null;
  }).filter(Boolean) as string[];
  if (dimParts.length) {
    lines.push(dimParts.join(' · '));
  }
  const trimmed = (note || '').trim();
  if (trimmed) lines.push(trimmed);
  if (!lines.length) return undefined;
  return lines.join('\n');
}

/** Parse dimension scores back out of a stored body (best-effort). */
export function parseDimensionsFromReviewBody(body: string | undefined | null): ReviewDimensionScores {
  const out: ReviewDimensionScores = {};
  if (!body) return out;
  const firstLine = body.split('\n')[0] || '';
  for (const dim of REVIEW_DIMENSIONS) {
    const re = new RegExp(`${dim.label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}:\\s*([1-5])\\/5`, 'i');
    const m = firstLine.match(re);
    if (m) out[dim.id] = Number(m[1]);
  }
  return out;
}
