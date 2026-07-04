import { MedusaService } from "@medusajs/framework/utils";
import { ProductMeta } from "./models/product-meta";
import { SHCProductMeta, shcProductMetaSchema } from "@shc/types";
import { getProductMetaFromDb } from "../../lib/shc-product-meta-pg";

class ShcProductMetaModuleService extends MedusaService({ ProductMeta }) {
  async upsertProductMeta(data: Partial<SHCProductMeta>): Promise<SHCProductMeta> {
    const validated = shcProductMetaSchema.partial().parse(data);
    const [existing] = await this.listAndCountProductMetas(
      { product_id: validated.product_id } as any,
      { take: 1 }
    ).catch(() => [[]]);
    if ((existing as any[])?.length) {
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
    const [all] = await this.listAndCountProductMetas({} as any, { take: 200 }).catch(() => [[]]);
    let meta = (all as any[])?.find((m) => m.product_id === productId) || null;
    if (!meta) {
      meta = await getProductMetaFromDb(productId);
    }
    return (meta as unknown as SHCProductMeta) || null;
  }
}

export default ShcProductMetaModuleService;
