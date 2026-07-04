export type CookListingStatusFilter = 'all' | 'live' | 'paused';

export type CookListingRow = {
  name?: string;
  cuisine?: string;
  occasion_tags?: string[];
  heritage_note?: string;
  shc_availability?: { paused?: boolean };
};

export function filterCookListings<T extends CookListingRow>(
  listings: T[],
  opts: { q?: string; status?: CookListingStatusFilter; cuisine?: string }
): T[] {
  const q = opts.q?.trim().toLowerCase();
  const cuisine = opts.cuisine && opts.cuisine !== 'all' ? opts.cuisine : undefined;

  return listings.filter((listing) => {
    if (q) {
      const haystack = [
        listing.name,
        listing.cuisine,
        listing.heritage_note,
        ...(listing.occasion_tags || []),
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    if (opts.status === 'live' && listing.shc_availability?.paused) return false;
    if (opts.status === 'paused' && !listing.shc_availability?.paused) return false;
    if (cuisine && listing.cuisine !== cuisine) return false;
    return true;
  });
}

export function uniqueListingCuisines(listings: CookListingRow[]): string[] {
  return [...new Set(listings.map((l) => l.cuisine).filter((c): c is string => Boolean(c)))].sort();
}