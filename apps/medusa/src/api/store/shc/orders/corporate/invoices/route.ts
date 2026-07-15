import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../../../modules/shc-order-meta/service";
import { requireCustomerId } from "../../../../../../lib/shc-actors";
import { buildCorporateInvoicesDownloadUrl } from "../../../../../../lib/shc-invoice-sign";
import {
  corporateInvoicesZipBuffer,
  fetchCorporateInvoicesForCustomer,
} from "../../../../../../lib/shc-corporate-invoices-bundle";

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
 * ?issue_url=1 → signed hook URL for mobile Linking.openURL.
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

  const { from, to, format, limit } = parse.data;
  const issueUrl =
    String((req.query as any)?.issue_url || "") === "1" ||
    String((req.query as any)?.issue_url || "").toLowerCase() === "true";

  if (issueUrl) {
    const link = buildCorporateInvoicesDownloadUrl({
      customer_id: customerId,
      from,
      to,
    });
    return res.json(link);
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const invoices = await fetchCorporateInvoicesForCustomer(metaService, customerId, { from, to, limit });

  if (format === "zip") {
    const stamp = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10);
    const { buf, filename } = await corporateInvoicesZipBuffer(invoices, stamp);
    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
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
