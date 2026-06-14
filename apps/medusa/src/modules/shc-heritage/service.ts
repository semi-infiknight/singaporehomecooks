import { MedusaService } from "@medusajs/framework/utils";
import { Heritage } from "./models/heritage";
import { createSHCError } from "@shc/types";

/**
 * shc-heritage module (Phase 8).
 * Permanent archive for cook heritage recipes/stories. Visible publicly on cook profile.
 * Published flag ensures persistence even if cook status inactive.
 */
class ShcHeritageModuleService extends MedusaService({ Heritage }) {
  async getArchiveForCook(cookId: string): Promise<any[]> {
    const [entries] = await (this as any).listAndCountHeritages({
      filters: { cook_id: cookId, published: true },
      order: { created_at: "DESC" },
    } as any);
    return entries || [];
  }

  async addEntry(cookId: string, entry: { title: string; story: string; photo_stub?: string }): Promise<any> {
    if (!entry.title || !entry.story) {
      throw createSHCError("SHC-GENERIC-001", "Heritage entry requires title and story");
    }
    const [created] = await this.createHeritages([{
      cook_id: cookId,
      title: entry.title,
      story: entry.story,
      photo_stub: entry.photo_stub || null,
      published: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    } as any]);
    return created;
  }
}

export default ShcHeritageModuleService;
