import { MedusaService } from "@medusajs/framework/utils";
import { Cart } from "./models/cart";
import { createSHCError } from "@shc/types";
import { enforceOneCookOnAdd } from "@shc/business-rules";

export type ShcCartItem = { product_id: string; name: string; qty: number; price: number; cook_id: string };
export type ShcCart = { items: ShcCartItem[]; cookId: string | null };

function emptyCart(): ShcCart {
  return { items: [], cookId: null };
}

function parseItems(raw: string | null | undefined): ShcCartItem[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

class ShcCartModuleService extends MedusaService({ Cart }) {
  private async getRow(customerId: string) {
    const [rows] = await this.listAndCountCarts({ customer_id: customerId } as any, { take: 1 }).catch(() => [[]]);
    return (rows as any[])?.[0] || null;
  }

  async getCart(customerId: string): Promise<ShcCart> {
    const row = await this.getRow(customerId);
    if (!row) return emptyCart();
    return { items: parseItems(row.items_json), cookId: row.cook_id || null };
  }

  async clearCart(customerId: string): Promise<ShcCart> {
    const row = await this.getRow(customerId);
    if (row) {
      await this.updateCarts({
        selector: { customer_id: customerId },
        data: { cook_id: null, items_json: "[]", updated_at: new Date() } as any,
      });
    }
    return emptyCart();
  }

  async addToCart(customerId: string, item: ShcCartItem): Promise<ShcCart> {
    const row = await this.getRow(customerId);
    const cart = row ? { items: parseItems(row.items_json), cookId: row.cook_id || null } : emptyCart();

    const conflict = enforceOneCookOnAdd(cart.cookId, item.cook_id);
    if (!conflict.valid) {
      throw createSHCError("SHC-CART-002", conflict.error || "One cook per cart");
    }
    if (!cart.cookId) cart.cookId = item.cook_id;

    const existing = cart.items.find((i) => i.product_id === item.product_id);
    if (existing) existing.qty += item.qty;
    else cart.items.push({ ...item });

    const payload = {
      customer_id: customerId,
      cook_id: cart.cookId,
      items_json: JSON.stringify(cart.items),
      updated_at: new Date(),
    };

    if (row) {
      await this.updateCarts({ selector: { customer_id: customerId }, data: payload as any });
    } else {
      await this.createCarts([payload as any]);
    }

    return cart;
  }
}

export default ShcCartModuleService;