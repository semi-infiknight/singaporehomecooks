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

async function enrichCartMinQty(cart: Awaited<ReturnType<ShcCartModuleService["getCart"]>>, scope: any) {
  const metaService: ShcProductMetaModuleService = scope.resolve("shcProductMeta") as any;
  const dropService: ShcDropModuleService = scope.resolve("shcDrop") as any;
  const items = await Promise.all(
    cart.items.map(async (item) => {
      if (item.min_qty != null && item.min_qty > 0) return item;
      if (item.drop_id) {
        const drop = await dropService.getDrop(item.drop_id).catch(() => null);
        if (drop) return { ...item, min_qty: Math.max(1, Number(drop.min_qty) || 1) };
      }
      const meta = await metaService.getMetaForProduct(item.product_id).catch(() => null);
      if (meta) return { ...item, min_qty: Math.max(1, Number(meta.min_qty) || 1) };
      return { ...item, min_qty: item.min_qty ?? 1 };
    })
  );
  return { ...cart, items };
}

/** GET /store/shc/cart */
export async function GET(req: MedusaRequest, res: MedusaResponse) {
  try {
    const customerId = getCustomerId(req);
    const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
    const cart = await cartService.getCart(customerId);
    res.json({ cart: await enrichCartMinQty(cart, req.scope) });
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
        min_qty: Math.max(1, Number(drop.min_qty) || 1),
        drop_id: drop.id,
        collection_date: drop.cook_date,
        collection_slot: drop.collection_slot,
      }, { oneCookEnforced: rules.cart.one_cook_enforced });
      return res.json({
        cart: await enrichCartMinQty(cart, req.scope),
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
      min_qty: Math.max(1, Number(shaped.min_qty) || 1),
    }, { oneCookEnforced: rules.cart.one_cook_enforced });
    res.json({ cart: await enrichCartMinQty(cart, req.scope) });
  } catch (e: any) {
    return res.status(400).json({ error: createSHCError("SHC-CART-002", e.message) });
  }
}

const UpdateSchema = z
  .object({
    product_id: z.string(),
    qty: z.number().int().nonnegative(),
  })
  .strict();

/** PATCH /store/shc/cart — set line qty (0 removes line) */
export async function PATCH(req: MedusaRequest, res: MedusaResponse) {
  const parse = UpdateSchema.safeParse(req.body || {});
  if (!parse.success) {
    return res
      .status(400)
      .json({ error: createSHCError("SHC-GENERIC-001", "Invalid cart update", parse.error.format() as any) });
  }
  let customerId: string;
  try {
    customerId = getCustomerId(req);
  } catch {
    return unauthorized(res, "Customer login required");
  }

  const cartService: ShcCartModuleService = req.scope.resolve("shcCart") as any;
  const metaService: ShcProductMetaModuleService = req.scope.resolve("shcProductMeta") as any;
  const dropService: ShcDropModuleService = req.scope.resolve("shcDrop") as any;

  const cart = await cartService.getCart(customerId);
  const line = cart.items.find((i) => i.product_id === parse.data.product_id);
  if (!line) {
    return res.status(404).json({ error: createSHCError("SHC-GENERIC-001", "Item not in cart") });
  }

  let qty = parse.data.qty;
  if (qty > 0) {
    if (line.drop_id) {
      const drop = await dropService.getDrop(line.drop_id);
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
        return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", check.reason || "Cannot update batch") });
      }
      const minQty = Math.max(1, Number(drop.min_qty) || 1);
      if (qty < minQty) {
        return res
          .status(400)
          .json({ error: createSHCError("SHC-GENERIC-001", `Minimum order is ${minQty} portions`) });
      }
      qty = dropClampOrderQty(qty, check.remaining);
      if (qty < minQty) {
        return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", "Not enough portions left") });
      }
    } else {
      const meta = await metaService.getMetaForProduct(line.product_id);
      const minQty = Math.max(1, Number(meta?.min_qty) || Number(line.min_qty) || 1);
      if (qty < minQty) {
        return res
          .status(400)
          .json({ error: createSHCError("SHC-GENERIC-001", `Minimum order is ${minQty} portions`) });
      }
    }
  }

  try {
    const updated = await cartService.setItemQty(customerId, parse.data.product_id, qty);
    res.json({ cart: await enrichCartMinQty(updated, req.scope) });
  } catch (e: any) {
    if (e?.code) return res.status(400).json({ error: e });
    return res.status(400).json({ error: createSHCError("SHC-GENERIC-001", e.message || "Update failed") });
  }
}
