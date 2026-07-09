import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { weekStartMonday } from "@shc/business-rules";
import { getCustomerId, unauthorized, tiffinCustomerError } from "../../../../../lib/shc-actors";
import ShcTiffinModuleService from "../../../../../modules/shc-tiffin/service";
import { shapeTiffinKitchen } from "../../../../../lib/shc-tiffin-shape";

const SubscribeSchema = z
  .object({
    cook_id: z.string(),
    meals_per_week: z.union([z.literal(2), z.literal(3), z.literal(4)]),
    /** Plan duration weeks (HomelyEats prepaid period) — defaults to 4 */
    weeks: z.number().int().min(1).max(12).optional(),
  })
  .strict();

async function subscriptionPayload(tiffin: ShcTiffinModuleService, sub: any, scope: any) {
  const config = await tiffin.getKitchenConfig(sub.cook_id);
  const plans = await tiffin.listPlans(sub.id);
  const currentWeek = weekStartMonday();
  const nextWeek = weekStartMonday(new Date(Date.now() + 7 * 86400000));
  const slotsCurrent = tiffin.resolveSlotsForWeek(plans, currentWeek);
  const slotsNext = tiffin.resolveSlotsForWeek(plans, nextWeek);
  const kitchen = config ? await shapeTiffinKitchen(config, scope) : null;
  const os = await tiffin.getSubscriptionOsFields(sub);
  let ledger: any[] = [];
  try {
    const led = await tiffin.listLedger(
      // listLedger re-fetches active by customer — use direct pg via service method with sub id path
      // Service listLedger needs customerId; GET has it via outer. Pass through below for GET only.
      (sub as any).__customerId || sub.customer_id,
      40
    );
    ledger = led.entries || [];
  } catch {
    ledger = [];
  }
  return {
    subscription: {
      id: sub.id,
      cook_id: sub.cook_id,
      meals_per_week: sub.meals_per_week,
      status: os.status,
      flex_quota: os.flex_quota,
      flex_remaining: os.flex_remaining,
      paused_until: os.paused_until,
      expires_on: os.expires_on,
      cancel_reason: os.cancel_reason,
      deliveries_left: os.deliveries_left,
      balance_cents: os.balance_cents ?? 0,
      cooking_notes: os.cooking_notes ?? null,
      collection_notes: os.collection_notes ?? null,
    },
    kitchen,
    plans,
    ledger,
    current_week: currentWeek,
    next_week: nextWeek,
    slots_current_week: slotsCurrent,
    slots_next_week: slotsNext,
  };
}

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const pastRaw = await tiffin.listPastSubscriptions(customerId);
    const past_subscriptions = pastRaw.map((p: any) => ({
      id: p.id,
      cook_id: p.cook_id,
      meals_per_week: p.meals_per_week,
      status: "canceled",
      canceled_at: p.updated_at || p.created_at || null,
    }));
    const sub = await tiffin.getActiveSubscription(customerId);
    if (!sub) {
      return res.json({ subscription: null, ledger: [], past_subscriptions });
    }
    (sub as any).__customerId = customerId;
    const payload = await subscriptionPayload(tiffin, sub, req.scope);
    res.json({ ...payload, past_subscriptions });
  } catch {
    return unauthorized(res, "Customer login required");
  }
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = SubscribeSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid subscribe body", parse.error.format() as any) });
  }
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const sub = await tiffin.createSubscription(
      customerId,
      parse.data.cook_id,
      parse.data.meals_per_week,
      parse.data.weeks ?? 4
    );
    (sub as any).__customerId = customerId;
    res.status(201).json(await subscriptionPayload(tiffin, sub, req.scope));
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Subscribe failed");
  }
}

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const tiffin: ShcTiffinModuleService = req.scope.resolve("shcTiffin") as any;
    const reason =
      typeof (req.body as any)?.reason === "string" ? (req.body as any).reason : undefined;
    await tiffin.cancelSubscription(customerId, reason);
    res.json({ ok: true });
  } catch (e: any) {
    return tiffinCustomerError(res, e, "Cancel failed");
  }
}