/**
 * Occasion labels for request wizard + admin config.
 * Customer **browse** pages `/occasions` and `/(customer)/occasions` were removed
 * (cooks do not tag dishes by occasion). Prefer `/request` for festive demand.
 */

import { getOccasionImageUrl } from './food-visuals';

export const OCCASION_BROWSE_OPTIONS = [
  'Hari Raya',
  'Deepavali',
  'Chinese New Year',
  'Family Gathering',
  'Birthday',
  'Wedding',
  'Christmas',
] as const;

export type OccasionBrowseOption = (typeof OCCASION_BROWSE_OPTIONS)[number];

/** Short chip label for circular occasion rail. */
export function occasionBrowseLabel(id: string): string {
  if (!id) return 'All';
  if (id === 'Chinese New Year') return 'CNY';
  if (id === 'Family Gathering') return 'Family';
  if (id.length > 12) return id.split(' ')[0] ?? id;
  return id;
}

export function occasionBrowseCategories(): Array<{ id: string; label: string; imageUrl?: string }> {
  return [
    { id: '', label: 'All' },
    ...OCCASION_BROWSE_OPTIONS.map((o) => ({
      id: o,
      label: occasionBrowseLabel(o),
      imageUrl: getOccasionImageUrl(o),
    })),
  ];
}

export function occasionBrowseHeading(occasion: string): { title: string; hint: string } {
  if (occasion) {
    return {
      title: `${occasion} spread`,
      hint: 'Add dishes for your event · cooks confirm your collection slot',
    };
  }
  return {
    title: 'Plan an occasion',
    hint: 'Party spreads and festive dishes from home kitchens',
  };
}

/** Web + mobile deep link with optional pre-selected occasion. */
/** @deprecated Browse pages removed — returns custom request routes. */
export function occasionBrowseRoute(occasion?: string): { web: string; mobile: string } {
  void occasion;
  return { web: '/request', mobile: '/(customer)/request' };
}
