import {
  GUEST_CONTACT_STORAGE_KEY,
  GUEST_ID_STORAGE_KEY,
  GUEST_ORDERS_STORAGE_KEY,
  appendGuestOrderId,
  createGuestUuid,
  normalizeGuestId,
  parseGuestOrdersJson,
  type GuestCheckoutContact,
} from '@shc/utils';

let cachedGuestId: string | null = null;

export function getGuestId(): string | null {
  if (typeof window === 'undefined') return cachedGuestId;
  const raw = cachedGuestId || localStorage.getItem(GUEST_ID_STORAGE_KEY);
  const bare = normalizeGuestId(raw);
  return bare;
}

export function ensureGuestId(): string {
  const existing = getGuestId();
  if (existing) return existing;
  const id = createGuestUuid();
  cachedGuestId = id;
  if (typeof window !== 'undefined') {
    localStorage.setItem(GUEST_ID_STORAGE_KEY, id);
  }
  return id;
}

export function readGuestContact(): GuestCheckoutContact | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(GUEST_CONTACT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestCheckoutContact;
    return parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

export function saveGuestContact(contact: GuestCheckoutContact): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(GUEST_CONTACT_STORAGE_KEY, JSON.stringify(contact));
}

export function listGuestOrderIds(): string[] {
  if (typeof window === 'undefined') return [];
  return parseGuestOrdersJson(localStorage.getItem(GUEST_ORDERS_STORAGE_KEY));
}

export function recordGuestOrder(orderId: string): void {
  if (typeof window === 'undefined') return;
  const next = appendGuestOrderId(listGuestOrderIds(), orderId);
  localStorage.setItem(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(next));
}

export function isTrackedGuestOrder(orderId: string): boolean {
  return listGuestOrderIds().includes(String(orderId || ''));
}
