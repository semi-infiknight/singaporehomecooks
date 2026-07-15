import JSZip from "jszip";
import ShcOrderMetaModuleService from "../modules/shc-order-meta/service";
import {
  customerInvoiceFromMeta,
  isPaidOrderStatus,
  type InvoiceMetaRow,
} from "./shc-order-invoice-from-meta";

export type CorporateInvoiceOpts = {
  from?: string;
  to?: string;
  limit?: number;
};

export async function fetchCorporateInvoicesForCustomer(
  metaService: ShcOrderMetaModuleService,
  customerId: string,
  opts: CorporateInvoiceOpts = {}
) {
  const limit = opts.limit ?? 25;
  const [metas] = await metaService
    .listAndCountOrderMetas({ customer_id: customerId } as any, { take: 200 })
    .catch(() => [[]]);

  const rows = ((metas || []) as InvoiceMetaRow[])
    .filter((m) => !!m.is_corporate && isPaidOrderStatus(String(m.shc_status || "")))
    .filter((m) => {
      const d = String(m.collection_date || "").slice(0, 10);
      if (!d) return true;
      if (opts.from && d < opts.from) return false;
      if (opts.to && d > opts.to) return false;
      return true;
    })
    .slice(0, limit);

  return rows.map((m) => customerInvoiceFromMeta(m));
}

export async function corporateInvoicesZipBuffer(
  invoices: ReturnType<typeof customerInvoiceFromMeta>[],
  stamp?: string
): Promise<{ buf: Buffer; filename: string }> {
  const zip = new JSZip();
  for (const inv of invoices) {
    zip.file(inv.filename, Buffer.from(inv.pdf_base64, "base64"));
  }
  const buf = await zip.generateAsync({ type: "nodebuffer" });
  const nameStamp = stamp || new Date().toISOString().slice(0, 10);
  return { buf, filename: `shc-corporate-invoices-${nameStamp}.zip` };
}
