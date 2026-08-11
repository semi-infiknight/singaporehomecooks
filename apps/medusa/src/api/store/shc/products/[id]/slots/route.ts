import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import {
  listEligibleCollectionSlots,
  orderWindowCustomerCopy,
  normalizeOrderWindowRules,
} from "@shc/utils";
import ShcAvailabilityModuleService from "../../../../../../modules/shc-availability/service";

/** GET /store/shc/products/:id/slots — collection slots for product (lead/cutoff enforced). */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  const avail = await availService.getAvailability(id);
  if (!avail || avail.paused) {
    return res.json({ slots: [], paused: true, order_window_copy: null, availability: avail });
  }

  const rules = normalizeOrderWindowRules({
    collection_days: (avail as any).collection_days || [],
    time_slots: (avail as any).time_slots || [],
    paused: Boolean((avail as any).paused),
    min_order_lead_days: (avail as any).min_order_lead_days,
    min_order_lead_hours: (avail as any).min_order_lead_hours,
    order_cutoff_time: (avail as any).order_cutoff_time,
  });

  // If collection_days empty in legacy rows, allow any day (legacy slots behaviour)
  if (!rules.collection_days.length) {
    rules.collection_days = [0, 1, 2, 3, 4, 5, 6];
  }
  if (!rules.time_slots.length) {
    rules.time_slots = ["17:00-19:00", "18:00-20:00"];
  }

  const slots = listEligibleCollectionSlots(rules, new Date(), { daysAhead: 14 });
  res.json({
    slots,
    availability: avail,
    order_window_copy: orderWindowCustomerCopy(rules),
  });
}
