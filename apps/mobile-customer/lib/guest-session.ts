import * as SecureStore from 'expo-secure-store';
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

export async function getGuestId(): Promise<string | null> {
  if (cachedGuestId) return cachedGuestId;
  const raw = await SecureStore.getItemAsync(GUEST_ID_STORAGE_KEY);
  return normalizeGuestId(raw);
}

export async function ensureGuestId(): Promise<string> {
  const existing = await getGuestId();
  if (existing) return existing;
  const id = createGuestUuid();
  cachedGuestId = id;
  await SecureStore.setItemAsync(GUEST_ID_STORAGE_KEY, id);
  return id;
}

export async function readGuestContact(): Promise<GuestCheckoutContact | null> {
  try {
    const raw = await SecureStore.getItemAsync(GUEST_CONTACT_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as GuestCheckoutContact;
    return parsed?.name ? parsed : null;
  } catch {
    return null;
  }
}

export async function saveGuestContact(contact: GuestCheckoutContact): Promise<void> {
  await SecureStore.setItemAsync(GUEST_CONTACT_STORAGE_KEY, JSON.stringify(contact));
}

export async function listGuestOrderIds(): Promise<string[]> {
  const raw = await SecureStore.getItemAsync(GUEST_ORDERS_STORAGE_KEY);
  return parseGuestOrdersJson(raw);
}

export async function recordGuestOrder(orderId: string): Promise<void> {
  const next = appendGuestOrderId(await listGuestOrderIds(), orderId);
  await SecureStore.setItemAsync(GUEST_ORDERS_STORAGE_KEY, JSON.stringify(next));
}

export async function isTrackedGuestOrder(orderId: string): Promise<boolean> {
  return (await listGuestOrderIds()).includes(String(orderId || ''));
}

/** Sync getter for api-client header (must call ensureGuestId during cart bootstrap). */
export function getGuestIdSync(): string | null {
  return cachedGuestId;
}

export function primeGuestId(id: string): void {
  cachedGuestId = normalizeGuestId(id);
}
