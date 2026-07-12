import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../../lib/shc-actors";
import ShcDropModuleService from "../../../../../modules/shc-drop/service";
import ShcCookModuleService from "../../../../../modules/shc-cook/service";

/** GET /store/shc/drops/:id */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id || "");
  const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
  try {
    const drop = await dropService.getDrop(id);
    if (!drop) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Drop not found") });
    }
    let cook: any = null;
    try {
      const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
      const [rows] = await cookService.listAndCountCooks({ id: drop.cook_id } as any, { take: 1 });
      const c = (rows as any[])?.[0];
      if (c) {
        cook = {
          id: c.id,
          display_name: c.display_name || c.name,
          slug: c.slug || c.id,
          area: c.area,
        };
      }
    } catch {
      /* optional */
    }
    res.json({
      drop: {
        ...drop,
        cook,
        cook_name: cook?.display_name || null,
        cook_slug: cook?.slug || drop.cook_id,
      },
    });
  } catch (e: any) {
    res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Get drop failed") });
  }
}

const PatchSchema = z
  .object({
    status: z.enum(["open", "paused", "closed", "sold_out"]).optional(),
    order_by: z.string().optional(),
    note: z.string().max(500).optional(),
    max_qty: z.number().int().positive().optional(),
  })
  .strict();

/** PATCH /store/shc/drops/:id — cook pause / end / extend */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const id = String(req.params.id || "");
  const parse = PatchSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid patch", parse.error.format() as any) });
  }
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }
  try {
    const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
    const drop = await dropService.patchDrop(id, cookId, parse.data);
    res.json({ drop });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Patch failed") });
  }
}
