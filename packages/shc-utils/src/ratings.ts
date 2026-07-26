/** Coerce API rating fields — undefined when missing or invalid (never invent 4.8). */
export function coerceRating(value: unknown): number | undefined {
  if (value == null || value === '') return undefined;
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}
