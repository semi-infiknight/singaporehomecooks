/** Cook home dashboard — setup checklist + snapshot from onboarding/profile data. */

export type CookDashboardSetupItem = {
  id: string;
  label: string;
  detail: string;
  done: boolean;
  href: string;
};

export type CookDashboardProfileSnapshot = {
  display_name?: string | null;
  area?: string | null;
  collection_address?: string | null;
  paynow_mobile?: string | null;
  paynow_uen?: string | null;
  payout_legal_name?: string | null;
  kitchen_halal_certified?: boolean | null;
  availability_paused?: boolean | null;
  responsible_person_name?: string | null;
};

export function cookDashboardKitchenSubtitle(profile: CookDashboardProfileSnapshot, fallbackName = 'Chef'): string {
  const name = String(profile.display_name || fallbackName).trim() || fallbackName;
  const area = String(profile.area || '').trim();
  const paused = Boolean(profile.availability_paused);
  const status = paused ? 'Paused' : 'Open for orders';
  if (area) return `${name} · ${area} · ${status}`;
  return `${name} · HDB kitchen · ${status}`;
}

export function cookDashboardAddressLine(profile: CookDashboardProfileSnapshot): string {
  const address = String(profile.collection_address || '').trim();
  if (!address) return 'Add your collection address';
  return address.length > 72 ? `${address.slice(0, 69)}…` : address;
}

export function buildCookDashboardSetupItems(input: {
  profile: CookDashboardProfileSnapshot;
  listingCount: number;
  complianceVerified: boolean;
  paynowConfigured: boolean;
}): CookDashboardSetupItem[] {
  const { profile, listingCount, complianceVerified, paynowConfigured } = input;
  const hasAddress = String(profile.collection_address || '').trim().length >= 8;
  const hasName = String(profile.display_name || '').trim().length >= 3;
  const items: CookDashboardSetupItem[] = [
    {
      id: 'kitchen',
      label: 'Kitchen profile',
      detail: hasName && hasAddress ? cookDashboardAddressLine(profile) : 'Name + collection address from onboarding',
      done: hasName && hasAddress,
      href: '/(cook)/settings',
    },
    {
      id: 'paynow',
      label: 'PayNow payout',
      detail: paynowConfigured ? 'Ready for customer payments' : 'Add PayNow mobile so you can get paid',
      done: paynowConfigured,
      href: '/(cook)/settings',
    },
    {
      id: 'menu',
      label: 'Menu dishes',
      detail: listingCount > 0 ? `${listingCount} dish${listingCount === 1 ? '' : 'es'} on your menu` : 'Add the dishes customers can order',
      done: listingCount > 0,
      href: '/(cook)/listings/new',
    },
    {
      id: 'compliance',
      label: 'SFA & WSQ',
      detail: complianceVerified
        ? 'Verified — you can accept orders'
        : 'Upload certificates to accept paid orders',
      done: complianceVerified,
      href: '/(cook)/compliance',
    },
  ];
  return items;
}

export function cookDashboardIncompleteSetup(items: CookDashboardSetupItem[]): CookDashboardSetupItem[] {
  return items.filter((i) => !i.done);
}

export function cookDashboardOrdersNeedingCook(orders: Array<{ shc_status?: string; status?: string }>): typeof orders {
  return orders.filter((o) => {
    const s = String(o.shc_status || o.status || '');
    return s === 'paid' || s === 'cart';
  });
}
