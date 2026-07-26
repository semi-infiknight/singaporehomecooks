import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { z } from "zod";
import { createSHCError } from "@shc/types";
import { dropCanOrder, dropClampOrderQty } from "@shc/business-rules";
import { getCustomerId, unauthorized } from "../../../../lib/shc-actors";
import ShcCartModuleService from "../../../../modules/shc-cart/service";
import ShcProductMetaModuleService from "../../../../modules/shc-product-meta/service";
import ShcDropModuleService from "../../../../modules/shc-drop/service";
import { shapeProduct } from "../../../../lib/shc-product-shape";
import { loadBusinessRulesConfigFromScope } from "../../../../lib/shc-business-rules-config";

/** GET /store/shc/cart */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
    res.json({ cart: await cartService.getCart(customerId) });
  } catch {
    return unauthorized(res, "Customer login required");
  }
}

/** DELETE /store/shc/cart */
export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
    res.json({ cart: await cartService.clearCart(customerId) });
  } catch {
    return unauthorized(res, "Customer login required");
  }
}

const AddSchema = z
  .object({
    product_id: z.string().optional(),
    drop_id: z.string().optional(),
    qty: z.number().int().positive(),
  })
  .strict()
  .refine((d) => Boolean(d.product_id || d.drop_id), { message: "product_id or drop_id required" });

/** POST /store/shc/cart — add product OR Cooking soon drop (one-cook cart) */
export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parse = AddSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid cart item", parse.error.format() as any) });
  }
  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
  const rules = await loadBusinessRulesConfigFromScope(req.scope);

  // ── Cooking soon batch → cart ──────────────────────────────────────────
  if (parse.data.drop_id) {
    try {
      const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;
      const drop = await dropService.getDrop(parse.data.drop_id);
      if (!drop) {
        return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Batch not found") });
      }
      const check = dropCanOrder(
        drop.status,
        Number(drop.max_qty),
        Number(drop.ordered_qty),
        String(drop.order_by)
      );
      if (!check.ok) {
        return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", check.reason || "Cannot order batch") });
      }
      const qty = dropClampOrderQty(parse.data.qty, check.remaining);
      if (qty < 1) {
        return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Invalid quantity") });
      }
      const cart = await cartService.addToCart(customerId, {
        product_id: drop.product_id || `drop_${drop.id}`,
        name: drop.title,
        qty,
        price: Number(drop.price_cents) / 100,
        cook_id: drop.cook_id,
        drop_id: drop.id,
        collection_date: drop.cook_date,
        collection_slot: drop.collection_slot,
      }, { oneCookEnforced: rules.cart.one_cook_enforced });
      return res.json({
        cart,
        drop: {
          id: drop.id,
          title: drop.title,
          remaining_qty: drop.remaining_qty,
          cook_date: drop.cook_date,
          collection_slot: drop.collection_slot,
        },
      });
    } catch (e: any) {
      if (e?.code) return res.status(400).json({ error: e });
      return res.status(400).json({ error: createSHCError("SHC-CART-002", e.message || "Add drop failed") });
    }
  }

  // ── Evergreen product ──────────────────────────────────────────────────
  const productId = String(parse.data.product_id);
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const meta = await metaService.getMetaForProduct(productId);
  if (!meta) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Product not found") });
  }
  const shaped = await shapeProduct(meta, req.scope);
  try {
    const cart = await cartService.addToCart(customerId, {
      product_id: productId,
      name: shaped.name,
      qty: parse.data.qty,
      price: shaped.price,
      cook_id: meta.cook_id,
    }, { oneCookEnforced: rules.cart.one_cook_enforced });
    res.json({ cart });
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-CART-002", e.message) });
  }
}
