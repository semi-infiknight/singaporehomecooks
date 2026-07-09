import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId, tiffinCustomerError } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const Body = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    collection_slot: z.string().optional(),
    extra_lines: z.array(z.string()).default([]),
    amount_cents: z.number().int().min(0).optional(),
    paynow_ref: z.string().nullable().optional(),
  })
  .strict();

/** POST /store/shc/tiffin/orders/customize — add extras (≥8h cutoff, HomelyEats) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid customize body") });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.customizeMeal(customerId, parse.data.collection_date, {
      extra_lines: parse.data.extra_lines,
      amount_cents: parse.data.amount_cents,
      paynow_ref: parse.data.paynow_ref,
      collection_slot: parse.data.collection_slot,
    });
    res.json(result);
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Customize failed");
  }
}
