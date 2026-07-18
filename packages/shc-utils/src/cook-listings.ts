export type CookListingStatusFilter = 'all' | 'live' | 'paused';

export type CookListingRow = {
  name?: string;
  cuisine?: string;
  occasion_tags?: string[];
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

/** Stable Maestro long-press target when cook has no API listings. */
export const E2E_COOK_SEED_LISTING = {
  id: 'e2e-seed',
  name: 'E2E Nyonya Laksa',
  price: 12,
  min_qty: 3,
  cuisine: 'Peranakan',
  shc_availability: { paused: false },
} as const;

export function resolveCookListingsForDisplay<T extends { id?: string }>(
  myListings: T[],
  opts: { dev?: boolean; maestroE2e?: boolean } = {}
): T[] {
  if (myListings.length > 0) return myListings;
  if (opts.dev || opts.maestroE2e) return [E2E_COOK_SEED_LISTING as unknown as T];
  return [];
}

export function cookListingE2eTestId(listing: { id?: string }, index: number): string {
  if (listing.id === E2E_COOK_SEED_LISTING.id || index === 0) return 'listing-card-e2e';
  return `listing-card-${listing.id}`;
}