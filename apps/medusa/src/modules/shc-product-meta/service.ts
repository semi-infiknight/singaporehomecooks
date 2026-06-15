import { MedusaService } from "@medusajs/framework/utils";
import { ProductMeta } from "./models/product-meta";
import { SHCProductMeta, shcProductMetaSchema } from "@shc/types";

class ShcProductMetaModuleService extends MedusaService({ ProductMeta }) {
  async upsertProductMeta(data: Partial<SHCProductMeta>): Promise<SHCProductMeta> {
    const validated = shcProductMetaSchema.partial().parse(data);
    // Simple upsert logic via list/update/create
    const existing = await this.listProductMetas({ filters: { product_id: validated.product_id } });
    if (existing.length) {
      const [updated] = await this.updateProductMetas({
        selector: { product_id: validated.product_id },
        data: { ...validated, updated_at: new Date() } as any,
      });
      return updated as unknown as SHCProductMeta;
    }
    const [created] = await this.createProductMetas([validated as any]);
    return created as unknown as SHCProductMeta;
  }

  async getMetaForProduct(productId: string): Promise<SHCProductMeta | null> {
    const [metas] = await this.listAndCountProductMetas({ product_id: productId } as any, { take: 1 }).catch(() => [[]]);
    return ((metas as any[])?.[0] as unknown as SHCProductMeta) || null;
  }
}

export default ShcProductMetaModuleService;
