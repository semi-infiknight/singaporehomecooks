import { buildOrderInvoice, invoiceToPdfBase64, type OrderInvoiceDoc } from "@shc/utils";

export type InvoiceMetaRow = Record<string, unknown> & {
  order_id?: string;
  cook_id?: string;
  cook_name?: string;
  cook_display_name?: string;
  customer_id?: string;
  customer_name?: string;
  shc_status?: string;
  collection_date?: string;
  collection_slot?: string;
  paynow_reference?: string;
  items?: unknown[];
  total_cents?: number;
  total?: number;
  credits_applied_cents?: number;
  is_corporate?: boolean;
  created_at?: Date | string;
  updated_at?: Date | string;
};

const PAID_STATUSES = new Set([
  "paid",
  "accepted",
  "preparing",
  "ready_for_collection",
  "collected",
  "completed",
]);

type InvoiceOrderItem = {
  name?: string;
  qty?: number;
  price?: number;
  price_cents?: number;
  unit_price_cents?: number;
};

function normalizeInvoiceItems(items: unknown[] | undefined): InvoiceOrderItem[] {
  if (!items?.length) return [{ name: "Order item", qty: 1 }];
  return items.map((raw) => {
    const it = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
    return {
      name: typeof it.name === "string" ? it.name : "Order item",
      qty: typeof it.qty === "number" ? it.qty : Number(it.qty) || 1,
      price: typeof it.price === "number" ? it.price : it.price != null ? Number(it.price) : undefined,
      price_cents:
        typeof it.price_cents === "number"
          ? it.price_cents
          : it.price_cents != null
            ? Number(it.price_cents)
            : undefined,
      unit_price_cents:
        typeof it.unit_price_cents === "number"
          ? it.unit_price_cents
          : it.unit_price_cents != null
            ? Number(it.unit_price_cents)
            : undefined,
    };
  });
}

export function isPaidOrderStatus(status: string | undefined): boolean {
  return PAID_STATUSES.has(String(status || "").toLowerCase());
}

export function orderFromMeta(m: InvoiceMetaRow) {
  const resolvedTotalCents =
    m.total_cents != null && Number(m.total_cents) > 0
      ? Math.round(Number(m.total_cents))
      : m.total != null && Number(m.total) > 0
        ? Math.round(Number(m.total) * 100)
        : 0;

  return {
    id: m.order_id,
    order_id: m.order_id,
    cook_id: m.cook_id,
    cook_name: m.cook_name || m.cook_display_name,
    customer_id: m.customer_id,
    customer_name: m.customer_name,
    shc_status: m.shc_status,
    collection_date: m.collection_date,
    collection_slot: m.collection_slot,
    paynow_reference: m.paynow_reference,
    items: normalizeInvoiceItems(m.items as unknown[] | undefined),
    total: resolvedTotalCents / 100,
    total_cents: resolvedTotalCents,
    credits_applied_cents: m.credits_applied_cents || 0,
    is_corporate: !!m.is_corporate,
    created_at:
      m.created_at instanceof Date
        ? m.created_at.toISOString()
        : m.created_at || m.updated_at instanceof Date
          ? (m.updated_at as Date).toISOString()
          : m.updated_at,
  };
}

export function customerInvoiceFromMeta(m: InvoiceMetaRow): {
  order_id: string;
  filename: string;
  pdf_base64: string;
  invoice: OrderInvoiceDoc;
} {
  const order = orderFromMeta(m);
  const invoice = buildOrderInvoice({
    order,
    audience: "customer",
    actorName: "Customer",
    supplier: {
      uen: process.env.SHC_PLATFORM_UEN || process.env.PAYNOW_UEN || undefined,
      legal_name: process.env.SHC_PLATFORM_LEGAL_NAME || "Singapore Home Cooks",
    },
  });
  const filename = `${invoice.invoice_number}.pdf`;
  return {
    order_id: String(m.order_id || order.order_id),
    filename,
    pdf_base64: invoiceToPdfBase64(invoice),
    invoice,
  };
}
