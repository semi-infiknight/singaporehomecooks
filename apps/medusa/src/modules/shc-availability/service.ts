import { MedusaService } from "@medusajs/framework/utils";
import { Availability } from "./models/availability";
import { SHCAvailability, shcAvailabilitySchema } from "@shc/types";

class ShcAvailabilityModuleService extends MedusaService({ Availability }) {
  async upsertAvailability(data: Partial<SHCAvailability>): Promise<SHCAvailability> {
    const validated = shcAvailabilitySchema.partial().parse(data);
    const existing = await this.listAvailabilities({ filters: { product_id: validated.product_id } });
    if (existing.length) {
      const [updated] = await this.updateAvailabilities({
        selector: { product_id: validated.product_id },
        data: { ...validated, updated_at: new Date() } as any,
      });
      return updated as unknown as SHCAvailability;
    }
    const [created] = await this.createAvailabilities([validated as any]);
    return created as unknown as SHCAvailability;
  }

  async getAvailability(productId: string): Promise<SHCAvailability | null> {
    const [list] = await this.listAndCountAvailabilities({ product_id: productId } as any, { take: 1 }).catch(() => [[]]);
    return ((list as any[])?.[0] as unknown as SHCAvailability) || null;
  }

  async checkPortionsAvailable(productId: string, date: string, requestedQty: number): Promise<{ available: boolean; remaining?: number }> {
    const avail = await this.getAvailability(productId);
    if (!avail || avail.paused) return { available: false };
    // Simplified: portions_per_day is daily cap (MVP). Real would query orders for date.
    // For Wave1 assume available if <= portions; full check in workflow later.
    return { available: requestedQty <= (avail.portions_per_day || 10), remaining: avail.portions_per_day };
  }
}

export default ShcAvailabilityModuleService;
