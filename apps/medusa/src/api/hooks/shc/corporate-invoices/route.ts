import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcOrderMetaModuleService from "../../../../modules/shc-order-meta/service";
import { verifyCorporateInvoicesDownload } from "../../../../lib/shc-invoice-sign";
import {
  corporateInvoicesZipBuffer,
  fetchCorporateInvoicesForCustomer,
} from "../../../../lib/shc-corporate-invoices-bundle";

/**
 * GET /hooks/shc/corporate-invoices
 * Signed ZIP download for mobile (no JWT). Issued via store ?issue_url=1.
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query || {}) as Record<string, string>;
  const customer_id = String(q.customer_id || "").trim();
  const from = q.from?.trim() || undefined;
  const to = q.to?.trim() || undefined;
  const exp = q.exp || "";
  const sig = q.sig || "";

  const verified = verifyCorporateInvoicesDownload({ customer_id, from, to, exp, sig });
  if (!verified.ok) {
    return res.status(403).json({
      error: createSHCError("SHC-GENERIC-001", `Invalid corporate invoice link: ${verified.reason}`),
    });
  }

  const metaService: ShcOrderMetaModuleService = req.scope.resolve("shcOrderMeta") as any;
  const invoices = await fetchCorporateInvoicesForCustomer(metaService, customer_id, { from, to });
  if (!invoices.length) {
    return res.status(404).json({
      error: createSHCError("SHC-GENERIC-001", "No paid corporate orders in this range"),
    });
  }

  const stamp = from && to ? `${from}_${to}` : new Date().toISOString().slice(0, 10);
  const { buf, filename } = await corporateInvoicesZipBuffer(invoices, stamp);
  res.setHeader("Content-Type", "application/zip");
  res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
  return res.send(buf);
}
