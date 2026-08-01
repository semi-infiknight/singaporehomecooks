import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import { payoutInvoiceToPdfBase64 } from "@shc/utils";
import { getCookId } from "../../../../../../../lib/shc-actors";
import { buildPayoutInvoiceDownloadUrl } from "../../../../../../../lib/shc-invoice-sign";
import { buildPayoutInvoiceForCook } from "../../../../../../../lib/shc-payout-invoice-build";

/** GET /store/shc/earnings/payouts/:batchId/invoice — weekly payout invoice (SHC → cook). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { batchId } = req.params as { batchId: string };
  const format = String((req.query as any)?.format || "json").toLowerCase();
  const issueUrl =
    String((req.query as any)?.issue_url || "") === "1" ||
    String((req.query as any)?.issue_url || "").toLowerCase() === "true";

  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Cook login required") });
  }

  const invoice = await buildPayoutInvoiceForCook(req.scope, batchId, cookId);
  if (!invoice) {
    return res.status(404).json({
      error: createSHCError("SHC-GENERIC-001", "Payout invoice not found for this batch"),
    });
  }

  const filename = `${invoice.invoice_number}.pdf`;

  if (issueUrl || format === "link" || format === "url") {
    const link = buildPayoutInvoiceDownloadUrl({ batch_id: batchId, cook_id: cookId });
    return res.json({
      download_url: link.download_url,
      expires_at: link.expires_at,
      expires_in: link.expires_in,
      filename,
      mime: "application/pdf",
    });
  }

  const pdf_base64 = payoutInvoiceToPdfBase64(invoice);

  if (format === "pdf") {
    const buf = Buffer.from(pdf_base64, "base64");
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    return res.send(buf);
  }

  res.json({
    invoice,
    pdf_base64,
    filename,
    mime: "application/pdf",
  });
}
