/**
 * Cook portal chrome — admin-managed platform config with code defaults.
 * Cook-owned content (listings, story, collection_instructions) stays on cook APIs.
 */

import { BENTO_ACTION_IMAGES } from './food-visuals';
import { COMPLIANCE_COURSE_LINKS, type ComplianceCourseLink } from './compliance-courses';
import {
  ALLERGEN_TIER1_PRESETS,
} from './listing-form';
import {
  COOK_CHAT_QUICK_REPLIES,
  CUSTOMER_CHAT_QUICK_REPLIES,
} from './order-chat';
import { DEFAULT_COOK_GREETING, type CookGreetingCopy } from './cook-portal';

export const COOK_PORTAL_CONFIG_KEY = 'cook_portal_config';

export type CookBentoImageKey = keyof typeof BENTO_ACTION_IMAGES;
export type CookBentoVariant = 'bento-mint' | 'bento-peach' | 'bento-yellow';
export type CookBentoIconKey = 'orders' | 'listings' | 'home' | 'earnings' | 'compliance' | 'request';

export type CookDashboardTile = {
  id: string;
  label: string;
  icon_key: CookBentoIconKey;
  image_key: CookBentoImageKey;
  image_url?: string;
  variant: CookBentoVariant;
  mobile_href: string;
  web_href: string;
  enabled: boolean;
  sort_order: number;
};

export type CookPortalConfig = {
  greeting: CookGreetingCopy;
  dashboard_tiles: CookDashboardTile[];
  compliance_course_links: ComplianceCourseLink[];
  allergen_tier1_presets: string[];
  chat_quick_replies: {
    customer: string[];
    cook: string[];
  };
};

const DEFAULT_DASHBOARD_TILES: CookDashboardTile[] = [
  {
    id: 'cooking-soon',
    label: 'Cooking soon',
    icon_key: 'orders',
    image_key: 'orders',
    variant: 'bento-mint',
    mobile_href: '/(cook)/batches',
    web_href: '/cook-portal/batches',
    enabled: true,
    sort_order: 10,
  },
  {
    id: 'listings',
    label: 'Listings',
    icon_key: 'listings',
    image_key: 'listings',
    variant: 'bento-peach',
    mobile_href: '/(cook)/listings',
    web_href: '/cook-portal/listings',
    enabled: true,
    sort_order: 20,
  },
  {
    id: 'orders',
    label: 'Orders',
    icon_key: 'orders',
    image_key: 'orders',
    variant: 'bento-mint',
    mobile_href: '/(cook)/orders',
    web_href: '/cook-portal/orders',
    enabled: true,
    sort_order: 30,
  },
  {
    id: 'tiffin',
    label: 'Tiffin OS',
    icon_key: 'home',
    image_key: 'listings',
    variant: 'bento-yellow',
    mobile_href: '/(cook)/tiffin',
    web_href: '/cook-portal/tiffin',
    enabled: true,
    sort_order: 40,
  },
  {
    id: 'earnings',
    label: 'Earnings',
    icon_key: 'earnings',
    image_key: 'earnings',
    variant: 'bento-yellow',
    mobile_href: '/(cook)/earnings',
    web_href: '/cook-portal/earnings',
    enabled: true,
    sort_order: 50,
  },
  {
    id: 'compliance',
    label: 'Compliance',
    icon_key: 'compliance',
    image_key: 'compliance',
    variant: 'bento-peach',
    mobile_href: '/(cook)/compliance',
    web_href: '/cook-portal/compliance',
    enabled: true,
    sort_order: 60,
  },
];

export function defaultCookPortalConfig(): CookPortalConfig {
  return {
    greeting: { ...DEFAULT_COOK_GREETING },
    dashboard_tiles: DEFAULT_DASHBOARD_TILES.map((t) => ({ ...t })),
    compliance_course_links: COMPLIANCE_COURSE_LINKS.map((l) => ({ ...l })),
    allergen_tier1_presets: [...ALLERGEN_TIER1_PRESETS],
    chat_quick_replies: {
      customer: [...CUSTOMER_CHAT_QUICK_REPLIES],
      cook: [...COOK_CHAT_QUICK_REPLIES],
    },
  };
}

function cleanStrings(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) return [...fallback];
  const cleaned = value.map((s) => String(s || '').trim()).filter(Boolean);
  return cleaned.length ? cleaned : [...fallback];
}

function normalizeComplianceLink(raw: unknown, fallback?: ComplianceCourseLink): ComplianceCourseLink | null {
  if (!raw || typeof raw !== 'object') return fallback || null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id || fallback?.id || '').trim();
  const title = String(row.title || fallback?.title || '').trim();
  const url = String(row.url || fallback?.url || '').trim();
  if (!id || !title || !url) return null;
  const forVal = String(row.for || fallback?.for || 'both').toLowerCase();
  const forType: ComplianceCourseLink['for'] =
    forVal === 'sfa' || forVal === 'wsq' ? forVal : 'both';
  return {
    id,
    title,
    description: String(row.description || fallback?.description || '').trim(),
    url,
    for: forType,
  };
}

function normalizeDashboardTile(raw: unknown, fallback?: CookDashboardTile): CookDashboardTile | null {
  if (!raw || typeof raw !== 'object') return fallback || null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id || fallback?.id || '').trim();
  const label = String(row.label || fallback?.label || '').trim();
  if (!id || !label) return null;
  const iconKey = String(row.icon_key || fallback?.icon_key || 'orders') as CookBentoIconKey;
  const imageKey = String(row.image_key || fallback?.image_key || 'orders') as CookBentoImageKey;
  const variant = String(row.variant || fallback?.variant || 'bento-mint') as CookBentoVariant;
  const safeVariant: CookBentoVariant =
    variant === 'bento-peach' || variant === 'bento-yellow' ? variant : 'bento-mint';
  return {
    id,
    label,
    icon_key: iconKey,
    image_key: imageKey in BENTO_ACTION_IMAGES ? imageKey : 'orders',
    image_url: row.image_url ? String(row.image_url).trim() : undefined,
    variant: safeVariant,
    mobile_href: String(row.mobile_href || fallback?.mobile_href || '').trim(),
    web_href: String(row.web_href || fallback?.web_href || '').trim(),
    enabled: typeof row.enabled === 'boolean' ? row.enabled : fallback?.enabled ?? true,
    sort_order: Number.isFinite(Number(row.sort_order))
      ? Math.floor(Number(row.sort_order))
      : fallback?.sort_order ?? 0,
  };
}

export function normalizeCookPortalConfig(input?: Partial<CookPortalConfig> | null): CookPortalConfig {
  const base = defaultCookPortalConfig();
  if (!input || typeof input !== 'object') return base;

  const greeting = {
    morning: String(input.greeting?.morning || base.greeting.morning).trim() || base.greeting.morning,
    afternoon: String(input.greeting?.afternoon || base.greeting.afternoon).trim() || base.greeting.afternoon,
    evening: String(input.greeting?.evening || base.greeting.evening).trim() || base.greeting.evening,
  };

  const tilesInput = Array.isArray(input.dashboard_tiles) ? input.dashboard_tiles : base.dashboard_tiles;
  const dashboard_tiles = tilesInput
    .map((t, i) => normalizeDashboardTile(t, base.dashboard_tiles[i]))
    .filter((t): t is CookDashboardTile => Boolean(t));
  const linksInput = Array.isArray(input.compliance_course_links)
    ? input.compliance_course_links
    : base.compliance_course_links;
  const compliance_course_links = linksInput
    .map((l, i) => normalizeComplianceLink(l, base.compliance_course_links[i]))
    .filter((l): l is ComplianceCourseLink => Boolean(l));

  return {
    greeting,
    dashboard_tiles: dashboard_tiles.length ? dashboard_tiles : base.dashboard_tiles,
    compliance_course_links: compliance_course_links.length
      ? compliance_course_links
      : base.compliance_course_links,
    allergen_tier1_presets: cleanStrings(input.allergen_tier1_presets, base.allergen_tier1_presets),
    chat_quick_replies: {
      customer: cleanStrings(input.chat_quick_replies?.customer, base.chat_quick_replies.customer),
      cook: cleanStrings(input.chat_quick_replies?.cook, base.chat_quick_replies.cook),
    },
  };
}

export function cookDashboardTiles(config: CookPortalConfig): CookDashboardTile[] {
  return [...config.dashboard_tiles]
    .filter((t) => t.enabled)
    .sort((a, b) => a.sort_order - b.sort_order);
}

export function cookDashboardTileImage(tile: CookDashboardTile): string {
  if (tile.image_url) return tile.image_url;
  return BENTO_ACTION_IMAGES[tile.image_key] || BENTO_ACTION_IMAGES.orders;
}

export function cookComplianceLinks(
  config: CookPortalConfig,
  type: 'sfa' | 'wsq'
): ComplianceCourseLink[] {
  return config.compliance_course_links.filter((l) => l.for === type || l.for === 'both');
}

export function cookAllergenTier1Presets(config: CookPortalConfig): readonly string[] {
  return config.allergen_tier1_presets;
}

export function cookChatQuickReplies(
  role: 'customer' | 'cook',
  config: CookPortalConfig
): readonly string[] {
  return role === 'cook' ? config.chat_quick_replies.cook : config.chat_quick_replies.customer;
}
