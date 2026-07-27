import { resolveOrderCollectionFields } from '@shc/utils';

export type OrderMetaRow = Record<string, unknown> & {
  order_id?: string;
  cook_id?: string;
  shc_status?: string;
  collection_date?: string;
  collection_slot?: string;
  paynow_reference?: string;
  allergen_acked_at?: string | Date | null;
  pdpa_consent_at?: string | Date | null;
  address_released_at?: string | Date | null;
  customer_id?: string;
  is_corporate?: boolean;
  cooking_notes?: string | null;
  collection_notes?: string | null;
  items?: unknown[];
  total_cents?: number;
  total?: number;
  origin_request_id?: string | null;
  corporate_note?: string | null;
};

export type CookCollectionRow = {
  display_name?: string | null;
  collection_address?: string | null;
  collection_instructions?: string | null;
};

export type ShapeStoreOrderOpts = {
  viewerRole?: 'customer' | 'cook';
  now?: Date;
};

function normalizeItems(items: unknown[] | undefined) {
  if (items?.length) return items;
  return [{ name: 'Order item', qty: 1, product_id: '' }];
}

function resolveTotal(meta: OrderMetaRow): number {
  if (meta.total_cents != null && Number(meta.total_cents) > 0) {
    return Math.round(Number(meta.total_cents) / 100);
  }
  if (meta.total != null && Number(meta.total) > 0) {
    return Number(meta.total);
  }
  return 0;
}

/** Store-facing order payload with cook collection fields gated by release window. */
export function shapeStoreOrder(
  meta: OrderMetaRow,
  cook?: CookCollectionRow | null,
  opts: ShapeStoreOrderOpts = {}
) {
  const m = meta;
  const collection = resolveOrderCollectionFields(
    {
      shc_status: m.shc_status,
      address_released_at: m.address_released_at,
      collection_address: cook?.collection_address,
      collection_instructions: cook?.collection_instructions,
      viewerRole: opts.viewerRole,
      now: opts.now,
    },
    opts.now
  );

  return {
    id: m.order_id,
    order_id: m.order_id,
    cook_id: m.cook_id,
    cook_name: cook?.display_name || undefined,
    customer_id: m.customer_id || 'cust_demo',
    shc_status: m.shc_status,
    collection_date: m.collection_date,
    collection_slot: m.collection_slot,
    paynow_reference: m.paynow_reference,
    allergen_acked_at: m.allergen_acked_at,
    pdpa_consent_at: m.pdpa_consent_at,
    address_released_at: m.address_released_at,
    collection_address_released: collection.collection_address_released,
    collection_address: collection.collection_address,
    collection_instructions: collection.collection_instructions,
    origin_request_id: m.origin_request_id || null,
    is_corporate: !!m.is_corporate,
    corporate_note: m.corporate_note || null,
    cooking_notes: m.cooking_notes || null,
    collection_notes: m.collection_notes || null,
    items: normalizeItems(m.items as unknown[] | undefined),
    total: resolveTotal(m),
  };
}

export async function loadCooksById(
  cookService: { listAndCountCooks: (where: any, opts?: any) => Promise<[any[], number]> },
  cookIds: string[]
): Promise<Map<string, CookCollectionRow>> {
  const unique = [...new Set(cookIds.filter(Boolean))];
  const map = new Map<string, CookCollectionRow>();
  if (!unique.length) return map;

  await Promise.all(
    unique.map(async (cookId) => {
      try {
        const [rows] = await cookService.listAndCountCooks({ id: cookId } as any, { take: 1 });
        const cook = (rows as CookCollectionRow[])?.[0];
        if (cook) map.set(cookId, cook);
      } catch {
        /* optional */
      }
    })
  );

  return map;
}
