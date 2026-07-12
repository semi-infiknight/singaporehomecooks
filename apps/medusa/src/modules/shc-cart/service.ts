import { MedusaService } from "@medusajs/framework/utils";
import { Cart } from "./models/cart";
import { createSHCError } from "@shc/types";
import { enforceOneCookOnAdd } from "@shc/business-rules";

export type ShcCartItem = {
  product_id: string;
  name: string;
  qty: number;
  price: number;
  cook_id: string;
  /** Cooking soon batch — capacity reserved at checkout complete */
  drop_id?: string;
  collection_date?: string;
  collection_slot?: string;
};

export type ShcCart = {
  items: ShcCartItem[];
  cookId: string | null;
  /** Present when cart is a single Cooking soon batch line */
  drop_id?: string | null;
  collection_date?: string | null;
  collection_slot?: string | null;
};

function emptyCart(): ShcCart {
  return { items: [], cookId: null, drop_id: null, collection_date: null, collection_slot: null };
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

function enrichCart(items: ShcCartItem[], cookId: string | null): ShcCart {
  const dropLine = items.find((i) => i.drop_id);
  return {
    items,
    cookId,
    drop_id: dropLine?.drop_id || null,
    collection_date: dropLine?.collection_date || null,
    collection_slot: dropLine?.collection_slot || null,
  };
}

class ShcCartModuleService extends MedusaService({ Cart }) {
  private async getRow(customerId: string) {
    const [rows] = await this.listAndCountCarts({ customer_id: customerId } as any, { take: 1 }).catch(() => [[]]);
    return (rows as any[])?.[0] || null;
  }

  async getCart(customerId: string): Promise<ShcCart> {
    const row = await this.getRow(customerId);
    if (!row) return emptyCart();
    return enrichCart(parseItems(row.items_json), row.cook_id || null);
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

  private async persist(customerId: string, cart: ShcCart, row: any | null): Promise<ShcCart> {
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
    return enrichCart(cart.items, cart.cookId);
  }

  async addToCart(customerId: string, item: ShcCartItem): Promise<ShcCart> {
    const row = await this.getRow(customerId);
    let cart = row ? enrichCart(parseItems(row.items_json), row.cook_id || null) : emptyCart();

    // Drop carts are exclusive: replace any existing cart content for this drop
    if (item.drop_id) {
      if (cart.cookId && cart.cookId !== item.cook_id) {
        throw createSHCError("SHC-CART-002", "One cook per cart — clear cart before ordering another kitchen’s batch");
      }
      // Replace with single drop line (fixed collection; no mix with evergreen dishes)
      cart = {
        items: [
          {
            product_id: item.product_id || `drop_${item.drop_id}`,
            name: item.name,
            qty: item.qty,
            price: item.price,
            cook_id: item.cook_id,
            drop_id: item.drop_id,
            collection_date: item.collection_date,
            collection_slot: item.collection_slot,
          },
        ],
        cookId: item.cook_id,
        drop_id: item.drop_id,
        collection_date: item.collection_date || null,
        collection_slot: item.collection_slot || null,
      };
      return this.persist(customerId, cart, row);
    }

    // Evergreen product: cannot mix with a drop line
    if (cart.items.some((i) => i.drop_id)) {
      throw createSHCError(
        "SHC-CART-002",
        "Cart has a Cooking soon batch — complete or clear it before adding regular dishes"
      );
    }

    const conflict = enforceOneCookOnAdd(cart.cookId, item.cook_id);
    if (!conflict.valid) {
      throw createSHCError("SHC-CART-002", conflict.error || "One cook per cart");
    }
    if (!cart.cookId) cart.cookId = item.cook_id;

    const existing = cart.items.find((i) => i.product_id === item.product_id);
    if (existing) existing.qty += item.qty;
    else cart.items.push({ ...item });

    return this.persist(customerId, cart, row);
  }
}

export default ShcCartModuleService;
