/**
 * Guest checkout session — device-local id + contact, no account required.
 */

export const GUEST_ID_STORAGE_KEY = 'shc_guest_id_v1';
export const GUEST_CONTACT_STORAGE_KEY = 'shc_guest_contact_v1';
export const GUEST_ORDERS_STORAGE_KEY = 'shc_guest_orders_v1';

export type GuestCheckoutContact = {
  name: string;
  email: string;
  phone: string;
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function normalizeGuestId(raw: string | null | undefined): string | null {
  const trimmed = String(raw || '').trim();
  if (!trimmed) return null;
  const bare = trimmed.startsWith('guest_') ? trimmed.slice(6) : trimmed;
  return UUID_RE.test(bare) ? bare : null;
}

export function toGuestCartActorId(guestUuid: string): string {
  const bare = normalizeGuestId(guestUuid);
  if (!bare) throw new Error('Invalid guest id');
  return `guest_${bare}`;
}

export function isGuestCartActorId(actorId: string | null | undefined): boolean {
  return String(actorId || '').startsWith('guest_');
}

export function createGuestUuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  const rnd = () => Math.floor(Math.random() * 0x10000).toString(16).padStart(4, '0');
  return `${rnd()}${rnd()}-${rnd()}-4${rnd().slice(1)}-a${rnd().slice(1)}-${rnd()}${rnd()}${rnd()}`.slice(0, 36);
}

export function parseGuestOrdersJson(raw: string | null | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : [];
  } catch {
    return [];
  }
}

export function appendGuestOrderId(existing: string[], orderId: string): string[] {
  const id = String(orderId || '').trim();
  if (!id) return existing;
  if (existing.includes(id)) return existing;
  return [id, ...existing].slice(0, 50);
}

export function isGuestCheckoutContactComplete(
  contact: Partial<GuestCheckoutContact> | null | undefined
): contact is GuestCheckoutContact {
  const name = contact?.name?.trim() || '';
  const email = contact?.email?.trim() || '';
  const phone = contact?.phone?.trim() || '';
  return name.length >= 2 && phone.length >= 8 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
