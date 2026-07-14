import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import JSZip from "jszip";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { requireCustomerId } from "../../../../../../lib/shc-actors";
import {
  customerInvoiceFromMeta,
  isPaidOrderStatus,
  type InvoiceMetaRow,
} from "../../../../../../lib/shc-order-invoice-from-meta";

const QuerySchema = z
  .object({
    from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    format: z.enum(["json", "zip"]).default("json"),
    limit: z.coerce.number().int().min(1).max(50).default(25),
  })
  .strict();

/**
 * GET /store/shc/orders/corporate/invoices
 * Customer JWT — paid corporate orders in optional date range → JSON bundle or ZIP of tax invoices.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const parse = QuerySchema.safeParse(req.query || {});
  if (!parse.success) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Bad query", parse.error.format() as any),
    });
  }

  let customerId: string;
  try {
    customerId = String(requireCustomerId(req));
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Customer login required") });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const [metas] = await metaService.listAndCountOrderMetas(
    { customer_id: customerId } as any,
    { take: 200 }
  ).catch(() => [[]]);

  const { from, to, format, limit } = parse.data;
  const rows = ((metas || []) as InvoiceMetaRow[])
    .filter((m) => !!m.is_corporate && isPaidOrderStatus(String(m.shc_status || "")))
    .filter((m) => {
      const d = String(m.collection_date || "").slice(0, 10);
      if (!d) return true;
      if (from && d < from) return false;
      if (to && d > to) return false;
      return true;
    })
    .slice(0, limit);

  const invoices = rows.map((m) => customerInvoiceFromMeta(m));

  if (format === "zip") {
    const zip = new JSZip();
    for (const inv of invoices) {
      zip.file(inv.filename, Buffer.from(inv.pdf_base64, "base64"));
    }
    const buf = await zip.generateAsync({ type: "nodebuffer" });
    const stamp = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="shc-corporate-invoices-${stamp}.zip"`);
    return res.send(buf);
  }

  return res.json({
    count: invoices.length,
    from: from || null,
    to: to || null,
    invoices: invoices.map(({ order_id, filename, pdf_base64 }) => ({
      order_id,
      filename,
      pdf_base64,
      mime: "application/pdf",
    })),
  });
}
