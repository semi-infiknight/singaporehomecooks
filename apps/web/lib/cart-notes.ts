/** Persist cart cooking/collection notes between cart → checkout (web sessionStorage). */

export const CART_NOTES_STORAGE_KEY = 'shc_cart_notes';

export type CartCheckoutNotes = {
  cookingNotes?: string;
  collectionNotes?: string;
};

export function persistCartCheckoutNotes(notes: CartCheckoutNotes): void {
  if (typeof window === 'undefined') return;
  const payload: CartCheckoutNotes = {
    cookingNotes: notes.cookingNotes?.trim() || undefined,
    collectionNotes: notes.collectionNotes?.trim() || undefined,
  };
  if (!payload.cookingNotes && !payload.collectionNotes) {
    clearCartCheckoutNotes();
    return;
  }
  try {
    sessionStorage.setItem(CART_NOTES_STORAGE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore */
  }
}

export function readCartCheckoutNotes(): CartCheckoutNotes {
  if (typeof window === 'undefined') return {};
  try {
    const raw = sessionStorage.getItem(CART_NOTES_STORAGE_KEY);
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

export function clearCartCheckoutNotes(): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem(CART_NOTES_STORAGE_KEY);
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
