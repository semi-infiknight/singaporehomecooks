import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { buildOrderInvoice, invoiceToHtml, invoiceToPdfBase64 } from "@shc/utils";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import {
  getAuthContext,
  requireCustomerId,
  requireCookId,
  unauthorized,
} from "../../../../../../lib/shc-actors";

/**
 * GET /store/shc/orders/:id/invoice
 * SG tax invoice (customer) or settlement note (cook). PDF base64 + HTML.
 * Query: ?format=json|pdf|html  (default json)
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const format = String((req.query as any)?.format || "json").toLowerCase();
  const auth = getAuthContext(req);
  if (!auth) {
    return unauthorized(res, "Login required to download invoice");
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(id);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${id}`) });
  }
  const m = data.meta as any;

  let audience: "customer" | "cook" = "customer";
  try {
    if (auth.actor_type === "cook") {
      const cookId = requireCookId(req);
      if (m.cook_id && m.cook_id !== cookId) {
        return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Not your order") });
      }
      audience = "cook";
    } else if (auth.actor_type === "customer") {
      const customerId = requireCustomerId(req);
      // Enforce ownership when order has customer_id; legacy rows without owner remain downloadable when logged in
      if (m.customer_id && String(m.customer_id).length > 0 && m.customer_id !== customerId) {
        return res.status(403).json({ error: createSHCError("SHC-GENERIC-001", "Not your order") });
      }
      audience = "customer";
    } else {
      return unauthorized(res, "Login required");
    }
  } catch {
    return unauthorized(res, "Login required");
  }

  // Normalize money: meta may store total_cents OR dollars in total
  const rawTotal = m.total_cents != null ? Number(m.total_cents) : Number(m.total);
  const total_cents =
    Number.isFinite(rawTotal) && rawTotal > 0
      ? rawTotal >= 1000 && Number.isInteger(rawTotal)
        ? rawTotal // likely already cents
        : Math.round(rawTotal * (rawTotal < 1000 ? 100 : 1))
      : 0;
  // Prefer explicit total_cents when present
  const resolvedTotalCents =
    m.total_cents != null && Number(m.total_cents) > 0
      ? Math.round(Number(m.total_cents))
      : m.total != null && Number(m.total) > 0
        ? Math.round(Number(m.total) * 100)
        : total_cents;

  const order = {
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
    items: m.items && m.items.length ? m.items : [{ name: "Order item", qty: 1 }],
    total: resolvedTotalCents / 100,
    total_cents: resolvedTotalCents,
    credits_applied_cents: m.credits_applied_cents || 0,
    is_corporate: !!m.is_corporate,
    created_at:
      m.created_at instanceof Date
        ? m.created_at.toISOString()
        : m.created_at || m.updated_at instanceof Date
          ? m.updated_at.toISOString()
          : m.updated_at,
  };

  const invoice = buildOrderInvoice({
    order,
    audience,
    actorName: auth.actor_type === "cook" ? "Cook" : "Customer",
    supplier: {
      uen: process.env.SHC_PLATFORM_UEN || process.env.PAYNOW_UEN || undefined,
      legal_name: process.env.SHC_PLATFORM_LEGAL_NAME || "Singapore Home Cooks",
    },
  });

  const html = invoiceToHtml(invoice);
  const pdf_base64 = invoiceToPdfBase64(invoice);
  const filename = `${invoice.invoice_number}.pdf`;

  if (format === "pdf") {
    const buf = Buffer.from(pdf_base64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buf);
  }
  if (format === "html") {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    return res.send(html);
  }

  res.json({
    invoice,
    html,
    pdf_base64,
    filename,
    mime: "application/pdf",
  });
}
