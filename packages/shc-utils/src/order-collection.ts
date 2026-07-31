/** Cook collection address / instructions on orders — gated until release window. */

const POST_PAID_STATUSES = new Set([
  'preparing',
  'ready_for_collection',
  'collected',
  'completed',
  'disputed',
  'resolved',
]);

const PAID_AWAITING_RELEASE_STATUSES = new Set(['paid']);

export type OrderCollectionReleaseInput = {
  shc_status?: string | null;
  address_released_at?: string | Date | null;
  now?: Date;
};

/** True when customer may see cook HDB collection address + instructions. */
export function isOrderCollectionAddressReleased(
  input: OrderCollectionReleaseInput,
  now = input.now ?? new Date()
): boolean {
  const status = String(input.shc_status || '').toLowerCase();
  if (!status || status === 'cart' || status === 'cancelled' || status === 'accepted') return false;
  if (POST_PAID_STATUSES.has(status)) return true;
  if (PAID_AWAITING_RELEASE_STATUSES.has(status)) {
    if (!input.address_released_at) return false;
    const releaseAt =
      input.address_released_at instanceof Date
        ? input.address_released_at
        : new Date(String(input.address_released_at));
    if (Number.isNaN(releaseAt.getTime())) return false;
    return now >= releaseAt;
  }
  return false;
}

export const ORDER_COLLECTION_PRIVACY_HINT =
  'HDB collection address unlocks ~2 hours before your slot, after payment.';

export type OrderCollectionFieldsInput = OrderCollectionReleaseInput & {
  collection_address?: string | null;
  collection_instructions?: string | null;
  /** Cooks always see their own collection fields on order detail/chat. */
  viewerRole?: 'customer' | 'cook';
};

export type ResolvedOrderCollectionFields = {
  collection_address_released: boolean;
  collection_address?: string;
  collection_instructions?: string;
  privacyHint?: string;
};

export function resolveOrderCollectionFields(
  input: OrderCollectionFieldsInput,
  now = input.now ?? new Date()
): ResolvedOrderCollectionFields {
  const released =
    input.viewerRole === 'cook' || isOrderCollectionAddressReleased(input, now);
  const address = String(input.collection_address || '').trim();
  const instructions = String(input.collection_instructions || '').trim();

  return {
    collection_address_released: released,
    collection_address: released && address ? address : undefined,
    collection_instructions: released && instructions ? instructions : undefined,
    privacyHint: released ? undefined : ORDER_COLLECTION_PRIVACY_HINT,
  };
}
