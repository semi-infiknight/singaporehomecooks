import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { getCustomerId } from "../../../../lib/shc-actors";
import { addToCart, clearCart, getCart } from "../../../../lib/shc-cart-store";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import { shapeProduct } from "../../../../lib/shc-product-shape";

function unauthorized(res: MedusaResponse) {
  return res.status(401).json({ error: createSHCError("SHC-GENERIC-001", "Customer login required") });
}

/** GET /store/shc/cart */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    res.json({ cart: getCart(customerId) });
  } catch {
    return unauthorized(res);
  }
}

/** DELETE /store/shc/cart */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    res.json({ cart: clearCart(customerId) });
  } catch {
    return unauthorized(res);
  }
}

const AddSchema = z.object({
  product_id: z.string(),
  qty: z.number().int().positive(),
}).strict();

/** POST /store/shc/cart — add item */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = AddSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid cart item", parse.error.format() as any) });
  }
  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res);
  }
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const meta = await metaService.getMetaForProduct(parse.data.product_id);
  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Product not found") });
  }
  const shaped = await shapeProduct(meta, req.scope);
  try {
    const cart = addToCart(customerId, {
      product_id: parse.data.product_id,
      name: shaped.name,
      qty: parse.data.qty,
      price: shaped.price,
      cook_id: meta.cook_id,
    });
    res.json({ cart });
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-CART-002", e.message) });
  }
}