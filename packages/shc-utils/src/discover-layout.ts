/**
 * Discover composition model — the single source of truth for what the customer
 * home screen shows, in what order, and under which heading.
 *
 * Web (`apps/web/app/page.tsx`) and mobile (`apps/mobile-customer/app/(customer)/index.tsx`)
 * both render `discoverSections()` and switch on the section id, so ordering,
 * visibility and copy cannot drift between the two surfaces.
 *
 * IA follows `discoverJourneyZones()`: browse (dishes) · subscribe (kitchens).
 * Occasions live on `/occasions` — linked from the browse spine, not an inline mode.
 */

import type { MealTypeId } from './meal-type';

export type DiscoverModeId = 'dishes' | 'kitchens';

export const DISCOVER_MODES: Array<{ id: DiscoverModeId; label: string; testID: string }> = [
  { id: 'dishes', label: 'Dishes', testID: 'discover-mode-dishes' },
  { id: 'kitchens', label: 'Kitchens', testID: 'discover-mode-kitchens' },
];

/** Third browse-spine action — navigates to dedicated occasions screen. */
export const DISCOVER_OCCASIONS_NAV = {
  label: 'Occasions',
  testID: 'discover-nav-occasions',
} as const;

export function isDiscoverMode(value: unknown): value is DiscoverModeId {
  return value === 'dishes' || value === 'kitchens';
}

/* -------------------------------------------------------------------------- */
/* Filters — one control surface instead of three scattered chip rows          */
/* -------------------------------------------------------------------------- */

export type DiscoverFilters = {
  mealType?: MealTypeId;
  cuisine?: string;
  occasion?: string;
  halalOnly?: boolean;
  vegetarianOnly?: boolean;
  /** Present when the "light" preference is on. */
  maxCal?: number;
};

const MEAL_TYPE_LABEL: Record<Exclude<MealTypeId, 'all'>, string> = {
  breakfast: 'Breakfast',
  lunch: 'Lunch',
  snacks: 'Snacks',
  dinner: 'Dinner',
};

/** Human labels for every filter currently narrowing the results. */
export function discoverActiveFilters(filters: DiscoverFilters): string[] {
  const active: string[] = [];
  if (filters.mealType && filters.mealType !== 'all') active.push(MEAL_TYPE_LABEL[filters.mealType]);
  if (filters.cuisine) active.push(filters.cuisine);
  if (filters.occasion) active.push(filters.occasion);
  if (filters.halalOnly) active.push('Halal');
  if (filters.vegetarianOnly) active.push('Vegetarian');
  if (filters.maxCal != null) active.push(`Under ${filters.maxCal} cal`);
  return active;
}

export function discoverActiveFilterCount(filters: DiscoverFilters): number {
  return discoverActiveFilters(filters).length;
}

/** Label for the filter button — names the filters when there is room, counts them otherwise. */
export function discoverFilterSummary(filters: DiscoverFilters): string {
  const active = discoverActiveFilters(filters);
  if (active.length === 0) return 'Filters';
  if (active.length <= 2) return active.join(' · ');
  return `${active.length} filters`;
}

export function clearedDiscoverFilters(): Required<Pick<DiscoverFilters, 'mealType' | 'cuisine' | 'occasion'>> & {
  halalOnly: false;
  vegetarianOnly: false;
  maxCal: undefined;
} {
  return {
    mealType: 'all',
    cuisine: '',
    occasion: '',
    halalOnly: false,
    vegetarianOnly: false,
    maxCal: undefined,
  };
}

/* -------------------------------------------------------------------------- */
/* "For you" — one personalised rail instead of three competing ones           */
/* -------------------------------------------------------------------------- */

export type DiscoverForYouSource = 'reorder' | 'saved' | 'top-rated';

export type DiscoverForYouRail<T> = {
  source: DiscoverForYouSource;
  title: string;
  /** Deep-link label for the rail header, when the source has a dedicated screen. */
  actionLabel?: string;
  dishes: T[];
};

/**
 * Order again → Saved → Top rated. Past behaviour beats intent, intent beats
 * popularity, so the single slot always carries the most personal list available.
 */
export function discoverForYouRail<T>(input: {
  reorder?: T[];
  saved?: T[];
  topRated?: T[];
  limit?: number;
}): DiscoverForYouRail<T> | null {
  const limit = input.limit ?? 8;
  const reorder = input.reorder ?? [];
  const saved = input.saved ?? [];
  const topRated = input.topRated ?? [];

  if (reorder.length > 0) {
    return { source: 'reorder', title: 'Order again', actionLabel: 'Orders', dishes: reorder.slice(0, limit) };
  }
  if (saved.length > 0) {
    return { source: 'saved', title: 'Saved for later', actionLabel: 'Saved', dishes: saved.slice(0, limit) };
  }
  if (topRated.length > 0) {
    return { source: 'top-rated', title: 'Top rated this week', dishes: topRated.slice(0, limit) };
  }
  return null;
}

/* -------------------------------------------------------------------------- */
/* Section model                                                               */
/* -------------------------------------------------------------------------- */

export type DiscoverSectionId =
  | 'search-results'
  | 'guest'
  | 'promos'
  | 'cooking-soon'
  | 'for-you'
  | 'browse-switch'
  | 'cuisine-rail'
  | 'occasion-rail'
  | 'dish-grid'
  | 'kitchen-list'
  | 'request';

export type DiscoverSection = { id: DiscoverSectionId; testID: string };

export type DiscoverLayoutState = {
  isSearching: boolean;
  isGuest: boolean;
  mode: DiscoverModeId;
  hasPromos: boolean;
  hasForYou: boolean;
};

/**
 * Ordered, visible sections for the current state.
 *
 * Time-sensitive content (promos, batches cooking this week) sits above the
 * browse spine because it expires; evergreen catalogue sits below it.
 */
export function discoverSections(state: DiscoverLayoutState): DiscoverSection[] {
  if (state.isSearching) {
    return [{ id: 'search-results', testID: 'discover-search-results' }];
  }

  const sections: DiscoverSection[] = [];
  const push = (id: DiscoverSectionId) => sections.push({ id, testID: `discover-section-${id}` });

  if (state.isGuest) push('guest');
  if (state.hasPromos) push('promos');
  push('cooking-soon');
  if (state.hasForYou) push('for-you');
  push('browse-switch');

  if (state.mode === 'dishes') {
    push('cuisine-rail');
    push('dish-grid');
  } else {
    push('kitchen-list');
  }

  push('request');
  return sections;
}

export function discoverSectionIds(state: DiscoverLayoutState): DiscoverSectionId[] {
  return discoverSections(state).map((s) => s.id);
}

/* -------------------------------------------------------------------------- */
/* Headings                                                                    */
/* -------------------------------------------------------------------------- */

/** Grid heading reflects the active mode and filters so the list is never unlabelled. */
export function discoverGridHeading(
  mode: DiscoverModeId,
  filters: DiscoverFilters,
  hasLocation = false
): { title: string; hint: string } {
  const proximityHint = hasLocation ? 'Sorted by nearest kitchen' : 'Add to cart for a single meal';
  if (filters.cuisine) {
    return { title: `${filters.cuisine} dishes`, hint: proximityHint };
  }
  return { title: 'All dishes', hint: proximityHint };
}

/**
 * Only claim proximity when a collection point is set — otherwise the list is
 * every kitchen in API order and "near you" is not true.
 */
export function discoverKitchensHeading(
  count: number,
  hasLocation: boolean
): { title: string; hint?: string } {
  if (hasLocation) {
    return { title: count === 1 ? '1 kitchen near you' : `${count} kitchens near you` };
  }
  return {
    title: count === 1 ? '1 home kitchen' : `${count} home kitchens`,
    hint: 'Set your collection point to sort kitchens by distance',
  };
}

/** Empty-state copy per mode — never a dead end, always routed to a next step. */
export function discoverEmptyCopy(
  mode: DiscoverModeId,
  filters: DiscoverFilters
): { title: string; description: string } {
  const active = discoverActiveFilters(filters);
  if (active.length > 0) {
    return {
      title: 'No dishes match those filters',
      description: `Clear ${active.join(' · ')} to see everything, or request the dish you had in mind.`,
    };
  }
  if (mode === 'kitchens') {
    return {
      title: 'No kitchens listed yet',
      description: 'New home cooks are onboarding — check back or request a dish to bring one in.',
    };
  }
  return {
    title: 'Nothing on the menu right now',
    description: 'Cooks post batches through the week. Request a dish and a kitchen can pick it up.',
  };
}
