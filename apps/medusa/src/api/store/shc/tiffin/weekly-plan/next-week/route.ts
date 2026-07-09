import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { weekStartMonday } from "@shc/business-rules";
import { getCustomerId, unauthorized } from "../../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../../modules/shc-tiffin/service";

const SlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  product_id: z.string(),
  collection_slot: z.string().optional(),
});

const NextWeekSchema = z.object({ slots: z.array(SlotSchema) }).strict();

function nextWeekStart(): string {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + 7);
  return weekStartMonday(d);
}

/** PUT /store/shc/tiffin/weekly-plan/next-week — override plan for upcoming week only */
export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parse = NextWeekSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid next-week plan", parse.error.format() as any) });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const sub = await tiffin.getActiveSubscription(customerId);
    if (!sub) {
      return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "No active tiffin subscription") });
    }
    const config = await tiffin.getKitchenConfig(sub.cook_id);
    if (!config) {
      return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Kitchen config missing") });
    }
    const week = nextWeekStart();
    const plan = await tiffin.saveWeeklyPlan(
      sub.id,
      { slots: parse.data.slots, week_start: week, as_recurring_template: false },
      {
        mealsPerWeek: sub.meals_per_week,
        eligibleProductIds: config.eligible_product_ids,
        collectionDays: config.collection_days,
      }
    );
    res.json({ week_start: week, plan });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Customer login required");
  }
}