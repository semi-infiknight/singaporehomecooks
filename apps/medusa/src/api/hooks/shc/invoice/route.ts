import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { buildOrderInvoice, canDownloadCookSettlementInvoice, invoiceToPdfBase64 } from "@shc/utils";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import { verifyInvoiceDownload } from "../../../../lib/shc-invoice-sign";

/**
 * GET /hooks/shc/invoice?order_id=&audience=cook|customer&exp=&sig=
 * Public short-lived signed PDF download (no JWT, no publishable key).
 * Issued only after authenticated GET …/invoice?issue_url=1
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query || {}) as Record<string, string>;
  const orderId = String(q.order_id || "").trim();
  const audience = String(q.audience || "").trim();
  const exp = String(q.exp || "").trim();
  const sig = String(q.sig || "").trim();

  if (!orderId || !audience || !exp || !sig) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Missing order_id, audience, exp, or sig"),
    });
  }

  const verified = verifyInvoiceDownload({ order_id: orderId, audience, exp, sig });
  if (!verified.ok) {
    return res.status(403).json({
      error: createSHCError("SHC-GENERIC-001", `Invalid invoice link: ${verified.reason}`),
    });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const data = await metaService.getOrderMetaWithMessages(orderId);
  if (!data.meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", `Order not found: ${orderId}`) });
  }
  const m = data.meta as any;

  if (verified.audience === "cook" && !canDownloadCookSettlementInvoice(m.shc_status)) {
    return res.status(403).json({
      error: createSHCError(
        "SHC-ORDER-001",
        "Settlement invoice is available after you accept the order."
      ),
    });
  }

  const resolvedTotalCents =
    m.total_cents != null && Number(m.total_cents) > 0
      ? Math.round(Number(m.total_cents))
      : m.total != null && Number(m.total) > 0
        ? Math.round(Number(m.total) * 100)
        : 0;

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
    audience: verified.audience,
    actorName: verified.audience === "cook" ? "Cook" : "Customer",
    supplier: {
      uen: process.env.SHC_PLATFORM_UEN || process.env.PAYNOW_UEN || undefined,
      legal_name: process.env.SHC_PLATFORM_LEGAL_NAME || "Singapore Home Cooks",
    },
  });

  const pdf_base64 = invoiceToPdfBase64(invoice);
  const filename = `${invoice.invoice_number}.pdf`;
  const buf = Buffer.from(pdf_base64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(buf);
}
