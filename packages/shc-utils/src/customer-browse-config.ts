/**
 * Customer browse chrome — admin-managed platform config with code defaults.
 * Cook-owned content (listings, collection_instructions, story) stays on cook APIs.
 */

import { MIND_CUISINE_CATEGORIES, OCCASION_IMAGE, resolveImageUrl } from './food-visuals';
import { MEAL_TYPE_CHIPS, type MealTypeId } from './meal-type';
import { OCCASION_BROWSE_OPTIONS, occasionBrowseLabel } from './occasion-browse';
import {
  DISCOVER_MODES,
  DISCOVER_OCCASIONS_NAV,
  discoverForYouRail,
  type DiscoverForYouRail,
  type DiscoverModeId,
} from './discover-layout';
import {
  defaultDiscoverPromoConfigs,
  discoverPromoConfigsToSlides,
  normalizeDiscoverPromoConfigs,
  type DiscoverHomePromo,
} from './discover-promos';

export const CUSTOMER_BROWSE_CONFIG_KEY = 'customer_browse_config';

export type CustomerCategory = { id: string; label: string; imageUrl: string; enabled?: boolean; sort_order?: number };

export type CustomerOccasion = {
  id: string;
  label: string;
  short_label?: string;
  image_url: string;
  enabled: boolean;
  sort_order: number;
};

export type CustomerBrowseCopy = {
  guest_headline: string;
  guest_subtitle?: string;
  signed_in_subtitle: string;
  category_offer_title: string;
  category_offer_subtitle: string;
  empty_dishes_title: string;
  empty_dishes_description: string;
  empty_kitchens_title: string;
  empty_kitchens_description: string;
  empty_filtered_title: string;
  empty_filtered_description: string;
  occasions_heading_title: string;
  occasions_heading_hint: string;
  occasions_spread_title: string;
  occasions_spread_hint: string;
  for_you_reorder: string;
  for_you_saved: string;
  for_you_top_rated: string;
};

export type CustomerBrowseConfig = {
  categories: CustomerCategory[];
  occasions: CustomerOccasion[];
  meal_type_chips: Array<{ id: MealTypeId; label: string }>;
  discover_modes: Array<{ id: DiscoverModeId; label: string; testID: string }>;
  occasions_nav: { label: string; testID: string };
  copy: CustomerBrowseCopy;
  popular: { min_rating: number; top_percent: number };
  defaults: { location_label: string; kitchen_open_fallback: string };
};

export type CustomerConfigPayload = {
  categories: CustomerCategory[];
  promos: DiscoverHomePromo[];
  config: CustomerBrowseConfig;
};

const DEFAULT_COPY: CustomerBrowseCopy = {
  guest_headline: 'Hungry? Order & Eat.',
  signed_in_subtitle: 'What would you like today?',
  category_offer_title: 'Explore {{label}} kitchens',
  category_offer_subtitle: 'Top-rated home cooks · HDB collection · order one dish or plan an occasion spread',
  empty_dishes_title: 'Nothing on the menu right now',
  empty_dishes_description: 'Cooks post batches through the week. Request a dish and a kitchen can pick it up.',
  empty_kitchens_title: 'No kitchens listed yet',
  empty_kitchens_description: 'New home cooks are onboarding — check back or request a dish to bring one in.',
  empty_filtered_title: 'No dishes match those filters',
  empty_filtered_description: 'Clear filters to see everything, or request the dish you had in mind.',
  occasions_heading_title: 'Plan an occasion',
  occasions_heading_hint: 'Party spreads and festive dishes from home kitchens',
  occasions_spread_title: '{{occasion}} spread',
  occasions_spread_hint: 'Add dishes for your event · cooks confirm your collection slot',
  for_you_reorder: 'Order again',
  for_you_saved: 'Saved for later',
  for_you_top_rated: 'Top rated this week',
};

export function defaultCustomerCategories(): CustomerCategory[] {
  return MIND_CUISINE_CATEGORIES.map((c, i) => ({
    id: c.id,
    label: c.label,
    imageUrl: c.imageUrl,
    enabled: true,
    sort_order: (i + 1) * 10,
  }));
}

export function defaultCustomerOccasions(): CustomerOccasion[] {
  return OCCASION_BROWSE_OPTIONS.map((o, i) => ({
    id: o,
    label: o,
    short_label: occasionBrowseLabel(o),
    image_url: OCCASION_IMAGE[o] || OCCASION_IMAGE[''],
    enabled: true,
    sort_order: (i + 1) * 10,
  }));
}

export function defaultCustomerBrowseConfig(): CustomerBrowseConfig {
  return {
    categories: defaultCustomerCategories(),
    occasions: defaultCustomerOccasions(),
    meal_type_chips: MEAL_TYPE_CHIPS.map((c) => ({ ...c })),
    discover_modes: DISCOVER_MODES.map((m) => ({ ...m })),
    occasions_nav: { ...DISCOVER_OCCASIONS_NAV },
    copy: { ...DEFAULT_COPY },
    popular: { min_rating: 4.7, top_percent: 20 },
    defaults: {
      location_label: 'Katong, Singapore',
      kitchen_open_fallback: 'HDB collection evenings',
    },
  };
}

export function normalizeCustomerCategories(raw: unknown): CustomerCategory[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultCustomerCategories();
  return raw
    .map((row: any, i: number) => ({
      id: String(row.id ?? '').trim(),
      label: String(row.label || row.id || 'Category').trim(),
      imageUrl: String(row.imageUrl || row.image_url || '').trim(),
      enabled: row.enabled !== false,
      sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : (i + 1) * 10,
    }))
    .filter((c) => c.id !== undefined)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

export function normalizeCustomerOccasions(raw: unknown): CustomerOccasion[] {
  if (!Array.isArray(raw) || raw.length === 0) return defaultCustomerOccasions();
  return raw
    .map((row: any, i: number) => {
      const id = String(row.id || row.label || `occasion_${i}`).trim();
      return {
        id,
        label: String(row.label || id).trim(),
        short_label: row.short_label ? String(row.short_label).trim() : occasionBrowseLabel(id),
        image_url: String(row.image_url || row.imageUrl || OCCASION_IMAGE[id] || '').trim(),
        enabled: row.enabled !== false,
        sort_order: Number.isFinite(Number(row.sort_order)) ? Number(row.sort_order) : (i + 1) * 10,
      };
    })
    .filter((o) => o.id)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function normalizeCustomerBrowseConfig(raw: unknown): CustomerBrowseConfig {
  const base = defaultCustomerBrowseConfig();
  if (!raw || typeof raw !== 'object') return base;
  const row = raw as Record<string, unknown>;
  const copy = { ...base.copy, ...(row.copy as object) };
  return {
    categories: normalizeCustomerCategories(row.categories ?? base.categories),
    occasions: normalizeCustomerOccasions(row.occasions ?? base.occasions),
    meal_type_chips: Array.isArray(row.meal_type_chips) && row.meal_type_chips.length
      ? (row.meal_type_chips as CustomerBrowseConfig['meal_type_chips'])
      : base.meal_type_chips,
    discover_modes: Array.isArray(row.discover_modes) && row.discover_modes.length
      ? (row.discover_modes as CustomerBrowseConfig['discover_modes'])
      : base.discover_modes,
    occasions_nav: { ...base.occasions_nav, ...((row.occasions_nav as object) || {}) },
    copy,
    popular: {
      min_rating: Number((row.popular as any)?.min_rating) || base.popular.min_rating,
      top_percent: Number((row.popular as any)?.top_percent) || base.popular.top_percent,
    },
    defaults: { ...base.defaults, ...((row.defaults as object) || {}) },
  };
}

/** Mind-row categories for discover (includes All). */
export function customerMindCategories(config: CustomerBrowseConfig): CustomerCategory[] {
  const all = config.categories.find((c) => !c.id) ?? defaultCustomerCategories()[0];
  const enabled = config.categories.filter((c) => c.id && c.enabled !== false);
  return [
    { id: all.id, label: all.label, imageUrl: all.imageUrl || defaultCustomerCategories()[0].imageUrl },
    ...enabled.map((c) => ({
      id: c.id,
      label: c.label,
      imageUrl: resolveImageUrl(c.imageUrl) || c.imageUrl,
    })),
  ];
}

export function customerOccasionCategories(config: CustomerBrowseConfig): Array<{ id: string; label: string; imageUrl?: string }> {
  return [
    { id: '', label: 'All' },
    ...config.occasions
      .filter((o) => o.enabled)
      .map((o) => ({
        id: o.id,
        label: o.short_label || o.label,
        imageUrl: resolveImageUrl(o.image_url) || o.image_url,
      })),
  ];
}

export function applyTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function customerCategoryOfferCopy(
  config: CustomerBrowseConfig,
  label: string
): { title: string; subtitle: string } {
  return {
    title: applyTemplate(config.copy.category_offer_title, { label }),
    subtitle: config.copy.category_offer_subtitle,
  };
}

export function customerDiscoverEmptyCopy(
  config: CustomerBrowseConfig,
  mode: DiscoverModeId,
  hasActiveFilters: boolean
): { title: string; description: string } {
  if (hasActiveFilters) {
    return {
      title: config.copy.empty_filtered_title,
      description: config.copy.empty_filtered_description,
    };
  }
  if (mode === 'kitchens') {
    return {
      title: config.copy.empty_kitchens_title,
      description: config.copy.empty_kitchens_description,
    };
  }
  return {
    title: config.copy.empty_dishes_title,
    description: config.copy.empty_dishes_description,
  };
}

export function customerOccasionHeading(
  config: CustomerBrowseConfig,
  occasion: string
): { title: string; hint: string } {
  if (occasion) {
    return {
      title: applyTemplate(config.copy.occasions_spread_title, { occasion }),
      hint: config.copy.occasions_spread_hint,
    };
  }
  return {
    title: config.copy.occasions_heading_title,
    hint: config.copy.occasions_heading_hint,
  };
}

export function customerIsPopularDish(
  product: Record<string, unknown>,
  allProducts: Record<string, unknown>[] | undefined,
  popular: CustomerBrowseConfig['popular']
): boolean {
  const rating = Number(product.rating ?? 0);
  if (rating >= popular.min_rating) return true;
  if (!allProducts?.length) return false;
  const sorted = [...allProducts].map((p) => Number(p.rating ?? 0)).sort((a, b) => b - a);
  const pct = Math.max(1, Math.min(100, popular.top_percent));
  const cutoffIndex = Math.max(0, Math.floor(sorted.length * (pct / 100)) - 1);
  const cutoff = sorted[cutoffIndex] ?? popular.min_rating - 0.2;
  return rating >= cutoff && rating >= popular.min_rating - 0.2;
}

export function customerForYouRail<T>(
  config: CustomerBrowseConfig,
  input: Parameters<typeof discoverForYouRail<T>>[0]
): DiscoverForYouRail<T> | null {
  const rail = discoverForYouRail(input);
  if (!rail) return null;
  const titles: Record<string, string> = {
    reorder: config.copy.for_you_reorder,
    saved: config.copy.for_you_saved,
    'top-rated': config.copy.for_you_top_rated,
  };
  return { ...rail, title: titles[rail.source] || rail.title };
}

export function buildCustomerConfigPayload(input: {
  categories?: unknown;
  promos?: unknown;
  browse?: unknown;
}): CustomerConfigPayload {
  const config = normalizeCustomerBrowseConfig(input.browse);
  const storedCategories = normalizeCustomerCategories(input.categories ?? config.categories);
  const categories = customerMindCategories({ ...config, categories: storedCategories });
  const promos = discoverPromoConfigsToSlides(normalizeDiscoverPromoConfigs(input.promos));
  return { categories, promos, config: { ...config, categories: storedCategories } };
}
