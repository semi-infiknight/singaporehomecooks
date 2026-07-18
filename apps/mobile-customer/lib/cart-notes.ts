/** Persist cart cooking/collection notes between cart → checkout (mobile SecureStore). */
import * as SecureStore from 'expo-secure-store';

export const CART_NOTES_STORAGE_KEY = 'shc_cart_notes';

export type CartCheckoutNotes = {
  cookingNotes?: string;
  collectionNotes?: string;
};

export async function persistCartCheckoutNotes(notes: CartCheckoutNotes): Promise<void> {
  const payload: CartCheckoutNotes = {
    cookingNotes: notes.cookingNotes?.trim() || undefined,
    collectionNotes: notes.collectionNotes?.trim() || undefined,
  };
  if (!payload.cookingNotes && !payload.collectionNotes) {
    await clearCartCheckoutNotes();
    return;
  }
  await SecureStore.setItemAsync(CART_NOTES_STORAGE_KEY, JSON.stringify(payload));
}

export async function readCartCheckoutNotes(): Promise<CartCheckoutNotes> {
  try {
    const raw = await SecureStore.getItemAsync(CART_NOTES_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as CartCheckoutNotes;
    return {
      cookingNotes: parsed.cookingNotes?.trim() || undefined,
      collectionNotes: parsed.collectionNotes?.trim() || undefined,
    };
  } catch {
    return {};
  }
}

export async function clearCartCheckoutNotes(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(CART_NOTES_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function toOrderNotesPayload(notes: CartCheckoutNotes) {
  return {
    cooking_notes: notes.cookingNotes || null,
    collection_notes: notes.collectionNotes || null,
  };
}
