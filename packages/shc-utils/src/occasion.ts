/** Normalize occasion labels for fuzzy match (seed slugs vs UI display names). */
export function normalizeOccasionLabel(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[_\s/]+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
}

/** True when a product occasion tag matches a UI filter label. */
export function matchOccasionTag(tag: string, filter: string): boolean {
  if (!filter) return true;
  const tagNorm = normalizeOccasionLabel(tag);
  const filterNorm = normalizeOccasionLabel(filter);
  if (!tagNorm || !filterNorm) return false;
  return tagNorm.includes(filterNorm) || filterNorm.includes(tagNorm);
}

export function productMatchesOccasion(
  occasionTags: string[] | undefined,
  filter: string | undefined
): boolean {
  if (!filter) return true;
  if (!Array.isArray(occasionTags) || occasionTags.length === 0) return false;
  return occasionTags.some((tag) => matchOccasionTag(tag, filter));
}