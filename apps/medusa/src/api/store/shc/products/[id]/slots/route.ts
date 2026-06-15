import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { createSHCError } from "@shc/types";
import ShcAvailabilityModuleService from "../../../../../../modules/shc-availability/service";

/** GET /store/shc/products/:id/slots — collection slots for product */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { id } = req.params as { id: string };
  const availService: ShcAvailabilityModuleService = req.scope.resolve("shcAvailability") as any;
  const avail = await availService.getAvailability(id);
  if (!avail || avail.paused) {
    return res.json({ slots: [], paused: true });
  }
  const slots: { date: string; slot: string }[] = [];
  const today = new Date();
  for (let d = 1; d <= 4; d++) {
    const dt = new Date(today);
    dt.setDate(today.getDate() + d);
    const dateStr = dt.toISOString().slice(0, 10);
    for (const slot of avail.time_slots || ["17:00-19:00", "18:00-20:00"]) {
      slots.push({ date: dateStr, slot });
    }
  }
  res.json({ slots, availability: avail });
}