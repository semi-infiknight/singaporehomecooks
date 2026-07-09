import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const Body = z
  .object({
    collection_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    product_ids: z.array(z.string()).default([]),
    note: z.string().max(300).optional(),
  })
  .strict();

/** PUT /store/shc/tiffin/cook/menu — publish day menu (HomelyEats kitchen menu update) */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parse = Body.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid menu body") });
  }
  try {
    const cookId = getCookId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const result = await tiffin.publishDayMenu(
      cookId,
      parse.data.collection_date,
      parse.data.product_ids,
      parse.data.note
    );
    res.json(result);
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Cook login required");
  }
}

/** GET /store/shc/tiffin/cook/menu?date=YYYY-MM-DD */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const cookId = getCookId(req);
    const date = typeof req.query?.date === "string" ? req.query.date : "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "date required") });
    }
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const menu = await tiffin.getDayMenu(cookId, date);
    res.json({ menu });
  } catch {
    return unauthorized(res, "Cook login required");
  }
}
