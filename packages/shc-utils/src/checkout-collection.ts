import type { SHCSavedAddress } from '@shc/types';
import { formatLocationLabel, formatLocationShort } from './location';

export type CheckoutCollectionPrefill = {
  line1: string;
  line2: string;
  postal_code: string;
  instructions: string;
  shortLabel: string;
  fullLabel: string;
};

/** Map saved customer location → checkout form defaults. */
export function checkoutCollectionPrefill(
  address: Partial<SHCSavedAddress> | null | undefined
): CheckoutCollectionPrefill | null {
  if (!address?.line1 || address.lat == null || address.lng == null) return null;
  const line1 = String(address.line1).trim();
  if (!line1) return null;
  return {
    line1,
    line2: String(address.line2 ?? '').trim(),
    postal_code: String(address.postal_code ?? '').trim(),
    instructions: String(address.instructions ?? '').trim(),
    shortLabel: formatLocationShort({ line1, postal_code: address.postal_code }),
    fullLabel: formatLocationLabel(address as SHCSavedAddress),
  };
}

/** Persist collection point on the order as human-readable collection_notes. */
export function buildCheckoutCollectionNotes(input: {
  location: Partial<SHCSavedAddress> | null | undefined;
  unit?: string;
  instructions?: string;
  cartCollectionNotes?: string;
}): string | null {
  const prefill = checkoutCollectionPrefill(input.location);
  const parts: string[] = [];

  if (prefill) {
    const unit = (input.unit ?? prefill.line2).trim();
    const line = [prefill.line1, unit, prefill.postal_code ? `S${prefill.postal_code}` : '']
      .filter(Boolean)
      .join(', ');
    parts.push(`Collection point: ${line}`);
  }

  const pickupNotes = (input.instructions ?? prefill?.instructions ?? '').trim();
  if (pickupNotes) parts.push(`Pickup notes: ${pickupNotes}`);

  const cartNote = input.cartCollectionNotes?.trim();
  if (cartNote && cartNote !== pickupNotes) parts.push(cartNote);

  const joined = parts.join(' · ');
  return joined.length ? joined.slice(0, 2000) : null;
}

export type CustomerCollectionSnapshot = {
  customer_collection_lat: number;
  customer_collection_lng: number;
  customer_collection_postal_code: string | null;
  customer_collection_line1: string | null;
};

/** Structured collection point for order meta (ops / support). */
export function customerCollectionForOrder(
  address: Partial<SHCSavedAddress> | null | undefined,
  unit?: string
): CustomerCollectionSnapshot | null {
  const prefill = checkoutCollectionPrefill(address);
  if (!prefill || address?.lat == null || address?.lng == null) return null;
  const unitPart = (unit ?? prefill.line2).trim();
  const line1 = [prefill.line1, unitPart].filter(Boolean).join(', ');
  return {
    customer_collection_lat: Number(address.lat),
    customer_collection_lng: Number(address.lng),
    customer_collection_postal_code: prefill.postal_code || null,
    customer_collection_line1: line1 || null,
  };
}
