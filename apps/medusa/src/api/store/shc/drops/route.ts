import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCookId, unauthorized } from "../../../../lib/shc-actors";
import ShcDropModuleService from "../../../../modules/shc-drop/service";
import ShcCookModuleService from "../../../../modules/shc-cook/service";

const CreateSchema = z
  .object({
    title: z.string().min(2).max(120),
    note: z.string().max(500).optional(),
    image_url: z.string().max(500).optional(),
    product_id: z.string().optional(),
    price_cents: z.number().int().positive().optional(),
    /** dollars alternative — converted to cents */
    price: z.number().positive().optional(),
    min_qty: z.number().int().nonnegative().optional(),
    max_qty: z.number().int().positive(),
    cook_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    collection_slot: z.string().min(1).max(40),
    order_by: z.string().min(1),
    visibility: z.enum(["marketplace", "kitchen_only"]).optional(),
  })
  .strict();

/**
 * GET /store/shc/drops
 * ?cook_id= · ?mine=true (cook JWT) · default marketplace open batches
 */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
  const cookService: ShcCookModuleService = req.scope.resolve("shcCook") as any;
  const q = req.query as Record<string, string | undefined>;

  try {
    if (q.mine === "true" || q.mine === "1") {
      let cookId: string;
      try {
        cookId = getCookId(req);
      } catch {
        return unauthorized(res, "Cook login required");
      }
      const drops = await dropService.listForCook(cookId, { limit: 50 });
      return res.json({ drops, count: drops.length });
    }

    if (q.cook_id) {
      const drops = await dropService.listForCook(String(q.cook_id), {
        activeOnly: true,
        limit: 30,
      });
      return res.json({ drops, count: drops.length });
    }

    const drops = await dropService.listMarketplace(40);
    // Enrich cook display names
    const cookIds = Array.from(new Set(drops.map((d: any) => d.cook_id).filter(Boolean)));
    const cooks: Record<string, any> = {};
    for (const id of cookIds) {
      try {
        const [rows] = await cookService.listAndCountCooks({ id } as any, { take: 1 });
        const c = (rows as any[])?.[0];
        if (c) {
          cooks[id] = {
            id: c.id,
            display_name: c.display_name || c.name,
            slug: c.slug || c.id,
            area: c.area,
          };
        }
      } catch {
        /* optional */
      }
    }
    const enriched = drops.map((d: any) => ({
      ...d,
      cook: cooks[d.cook_id] || null,
      cook_name: cooks[d.cook_id]?.display_name || null,
      cook_slug: cooks[d.cook_id]?.slug || d.cook_id,
    }));
    res.json({ drops: enriched, count: enriched.length });
  } catch (e: any) {
    res.status(500).json({ error: createSHCError("SHC-GENERIC-001", e.message || "List drops failed") });
  }
}

/** POST /store/shc/drops — cook creates a Cooking soon batch */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  let cookId: string;
  try {
    cookId = getCookId(req);
  } catch {
    return unauthorized(res, "Cook login required");
  }
  const parse = CreateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid drop", parse.error.format() as any) });
  }
  const priceCents =
    parse.data.price_cents != null
      ? parse.data.price_cents
      : parse.data.price != null
        ? Math.round(parse.data.price * 100)
        : 0;
  if (priceCents < 50) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "price_cents required (min S$0.50)") });
  }
  try {
    const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
    const drop = await dropService.createDrop({
      cook_id: cookId,
      title: parse.data.title,
      note: parse.data.note,
      image_url: parse.data.image_url,
      product_id: parse.data.product_id,
      price_cents: priceCents,
      min_qty: parse.data.min_qty,
      max_qty: parse.data.max_qty,
      cook_date: parse.data.cook_date,
      collection_slot: parse.data.collection_slot,
      order_by: parse.data.order_by,
      visibility: parse.data.visibility,
    });
    const logger = (req.scope as any).resolve?.("logger") || console;
    logger.info?.({ event: "drop.created", drop_id: drop.id, cook_id: cookId });
    res.status(201).json({ drop });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Create drop failed") });
  }
}
