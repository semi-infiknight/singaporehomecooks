import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { weekStartMonday } from "@shc/business-rules";
import { getCustomerId, unauthorized } from "../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../modules/shc-tiffin/service";

const SlotSchema = z.object({
  day_of_week: z.number().int().min(0).max(6),
  product_id: z.string(),
  collection_slot: z.string().optional(),
});

const PlanSchema = z
  .object({
    slots: z.array(SlotSchema),
    week_start: z.string().nullable().optional(),
    as_recurring_template: z.boolean().optional(),
  })
  .strict();

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const sub = await tiffin.getActiveSubscription(customerId);
    if (!sub) return res.json({ plan: null });
    const week = (req.query.week_start as string) || weekStartMonday();
    const plans = await tiffin.listPlans(sub.id);
    const slots = tiffin.resolveSlotsForWeek(plans, week);
    res.json({ week_start: week, slots, plans });
  } catch {
    return unauthorized(res, "Customer login required");
  }
}

export async function PUT(req: MedusaRequest, res: MedusaResponse) {
  const parse = PlanSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid weekly plan", parse.error.format() as any) });
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
    const plan = await tiffin.saveWeeklyPlan(
      sub.id,
      {
        slots: parse.data.slots,
        week_start: parse.data.week_start,
        as_recurring_template: parse.data.as_recurring_template,
      },
      {
        mealsPerWeek: sub.meals_per_week,
        eligibleProductIds: config.eligible_product_ids,
        collectionDays: config.collection_days,
      }
    );
    res.json({ plan });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return unauthorized(res, "Customer login required");
  }
}