import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { payoutInvoiceToPdfBase64 } from "@shc/utils";
import { verifyPayoutInvoiceDownload } from "../../../../lib/shc-invoice-sign";
import { buildPayoutInvoiceForCook } from "../../../../lib/shc-payout-invoice-build";

/**
 * GET /hooks/shc/payout-invoice?batch_id=&cook_id=&exp=&sig=
 * Signed weekly payout PDF (no JWT).
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const q = (req.query || {}) as Record<string, string>;
  const batchId = String(q.batch_id || "").trim();
  const cookId = String(q.cook_id || "").trim();
  const exp = String(q.exp || "").trim();
  const sig = String(q.sig || "").trim();

  if (!batchId || !cookId || !exp || !sig) {
    return res.status(400).json({
      error: createSHCError("SHC-GENERIC-001", "Missing batch_id, cook_id, exp, or sig"),
    });
  }

  const verified = verifyPayoutInvoiceDownload({ batch_id: batchId, cook_id: cookId, exp, sig });
  if (!verified.ok) {
    return res.status(403).json({
      error: createSHCError("SHC-GENERIC-001", `Invalid payout invoice link: ${verified.reason}`),
    });
  }

  const invoice = await buildPayoutInvoiceForCook(req.scope, batchId, cookId);
  if (!invoice) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Payout invoice not found") });
  }

  const pdf_base64 = payoutInvoiceToPdfBase64(invoice);
  const filename = `${invoice.invoice_number}.pdf`;
  const buf = Buffer.from(pdf_base64, "base64");
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `inline; filename="${filename}"`);
  res.setHeader("Cache-Control", "private, no-store");
  return res.send(buf);
}
