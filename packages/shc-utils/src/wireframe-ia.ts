/**
 * HomelyEats paper-wireframe IA (image 13) — pure helpers for Account, Cart, Kitchen trust, Tiffin plan.
 * SHC maps delivery → HDB collection; orange brand is not adopted.
 */

export type AccountMenuItem = {
  id: string;
  label: string;
  /** App-relative path (web). Mobile maps separately. */
  href: string;
  /** Shown for signed-in users only */
  requiresAuth?: boolean;
  /** Shown for guests only */
  guestOnly?: boolean;
  testID: string;
};

/** Wireframe Account screen rows (signed-in). */
export function accountMenuItemsSignedIn(): AccountMenuItem[] {
  return [
    { id: 'profile', label: 'My Profile', href: '/profile', testID: 'account-menu-profile' },
    {
      id: 'subscriptions',
      label: 'My Subscriptions',
      href: '/tiffin/subscriptions',
      testID: 'account-menu-subscriptions',
    },
    { id: 'orders', label: 'My Orders', href: '/orders', testID: 'account-menu-orders' },
    { id: 'address', label: 'Manage Address', href: '/location', testID: 'account-menu-address' },
    { id: 'requests', label: 'My Requests', href: '/request', testID: 'account-menu-requests' },
  ];
}

/** Wireframe Account guest: Sign up / Log in emphasis. */
export function accountMenuItemsGuest(): AccountMenuItem[] {
  return [
    { id: 'login', label: 'Sign Up / Log In', href: '/login', guestOnly: true, testID: 'account-menu-login' },
    { id: 'browse', label: 'Browse kitchens', href: '/', testID: 'account-menu-browse' },
    { id: 'tiffin', label: 'Explore tiffin plans', href: '/tiffin', testID: 'account-menu-tiffin' },
  ];
}

export type KitchenTrustCert = {
  id: string;
  label: string;
  detail: string;
  status: 'verified' | 'declared' | 'pending';
};

/**
 * Wireframe Kitchen Details → Contact tags, Licenses, Food Safety, Hygiene Certificates.
 * Uses SFA reg when present; otherwise declared trust practices (no fake licenses).
 */
export function kitchenTrustCerts(cook?: {
  sfa_reg_number?: string | null;
  display_name?: string | null;
  area?: string | null;
  status?: string | null;
} | null): KitchenTrustCert[] {
  const name = cook?.display_name || 'This kitchen';
  const sfa = cook?.sfa_reg_number ? String(cook.sfa_reg_number).trim() : '';
  return [
    {
      id: 'contact',
      label: 'Contact tags',
      detail: cook?.area
        ? `HDB collection · ${cook.area} · chat opens after PayNow`
        : 'HDB collection · chat opens after PayNow confirm',
      status: 'declared',
    },
    {
      id: 'licenses',
      label: 'Licenses',
      detail: sfa
        ? `SFA-aware reg · ${sfa}`
        : `${name} follows home-based food practices (SFA guidelines)`,
      status: sfa ? 'verified' : 'declared',
    },
    {
      id: 'food_safety',
      label: 'Food safety',
      detail: 'Allergen disclosure on every dish · no raw claims without labels',
      status: 'declared',
    },
    {
      id: 'hygiene',
      label: 'Hygiene certificates',
      detail: sfa
        ? 'Hygiene practices declared with registration on file'
        : 'Home kitchen hygiene checklist · ops may request photos',
      status: sfa ? 'verified' : 'pending',
    },
  ];
}

/** Cart sections from wireframe: Delivery/collection, Itemize, Coupon, Bill, Payment. */
export const CART_WIREFRAME_LABELS = {
  collection: 'Collection point',
  items: 'Itemize',
  coupon: 'Apply coupon',
  bill: 'Bill summary',
  payment: 'Payment',
  paynow: 'PayNow',
  cookingInstructions: 'Cooking instructions',
  collectionInstructions: 'Collection instructions',
} as const;

export type TiffinPlanDurationId = '7d' | '1m' | 'custom';

/** Wireframe Daily Packages → Select plan duration (maps to SHC weekly billing). */
export function tiffinPlanDurationOptions(): Array<{
  id: TiffinPlanDurationId;
  label: string;
  hint: string;
  weeks: number;
}> {
  return [
    { id: '7d', label: '7 days', hint: '1 week of collections', weeks: 1 },
    { id: '1m', label: '1 month', hint: '4 weeks · best value framing', weeks: 4 },
    { id: 'custom', label: 'Custom', hint: 'Start weekly · manage anytime', weeks: 1 },
  ];
}

/** Estimate total for duration × meals/week × price per meal (display only). */
export function tiffinPlanDurationTotal(
  mealsPerWeek: number,
  pricePerMeal: number,
  weeks: number
): number {
  const m = Math.max(0, Number(mealsPerWeek) || 0);
  const p = Math.max(0, Number(pricePerMeal) || 0);
  const w = Math.max(1, Number(weeks) || 1);
  return Math.round(m * p * w * 100) / 100;
}

/**
 * Cafe wireframe IA (Vrindavan case study) — discover → menu → cart → collect.
 * Gestalt “common region”: each zone gets a distinct eyebrow + grouped content.
 */
export type DiscoverJourneyZone = {
  id: string;
  eyebrow: string;
  title?: string;
  testID: string;
};

export function discoverJourneyZones(): DiscoverJourneyZone[] {
  return [
    {
      id: 'subscribe',
      eyebrow: 'Weekly tiffin',
      title: 'Subscribe from one home kitchen',
      testID: 'discover-zone-subscribe',
    },
    {
      id: 'browse',
      eyebrow: 'Browse menu',
      title: 'Find dishes by meal or cuisine',
      testID: 'discover-zone-browse',
    },
    {
      id: 'occasions',
      eyebrow: 'Plan an occasion',
      title: 'Party spreads & custom requests',
      testID: 'discover-zone-occasions',
    },
    {
      id: 'order',
      eyebrow: 'Order once',
      title: 'Add a single dish to your cart',
      testID: 'discover-zone-order',
    },
  ];
}

/** Three-step food cafe journey (paper wireframe narrative). */
export function foodCafeJourneySteps(): Array<{ id: string; label: string; detail: string }> {
  return [
    { id: 'browse', label: 'Browse', detail: 'Menus & home kitchens near you' },
    { id: 'order', label: 'Order', detail: 'Cart or weekly tiffin plan' },
    { id: 'collect', label: 'Collect', detail: 'HDB pickup on your slot' },
  ];
}

export function discoverZoneById(id: string): DiscoverJourneyZone | undefined {
  return discoverJourneyZones().find((z) => z.id === id);
}
