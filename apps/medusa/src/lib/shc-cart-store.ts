import { Redis } from "ioredis";

/**
 * @deprecated Use shc-cart module (Postgres-backed) via cart routes. Kept for unit tests / legacy imports.
 * Server cart — Redis-backed with in-memory fallback.
 */
export type ShcCartItem = { product_id: string; name: string; qty: number; price: number; cook_id: string };
export type ShcCart = { items: ShcCartItem[]; cookId: string | null };

const TTL_SEC = 60 * 60 * 24 * 7;
const KEY_PREFIX = "shc:cart:";
const memory = new Map<string, ShcCart>();

let redis: Redis | null | undefined;

async function getRedis(): Promise<Redis | null> {
  if (redis !== undefined) return redis;
  const url = process.env.REDIS_URL;
  if (!url) {
    redis = null;
    return null;
  }
  try {
    const client = new Redis(url, { maxRetriesPerRequest: 1, lazyConnect: true });
    await client.connect();
    redis = client;
    return redis;
  } catch {
    redis = null;
    return null;
  }
}

function emptyCart(): ShcCart {
  return { items: [], cookId: null };
}

async function readCart(customerId: string): Promise<ShcCart> {
  const r = await getRedis();
  if (r) {
    const raw = await r.get(KEY_PREFIX + customerId);
    if (raw) {
      try {
        return JSON.parse(raw) as ShcCart;
      } catch {
        /* fall through */
      }
    }
    return emptyCart();
  }
  if (!memory.has(customerId)) memory.set(customerId, emptyCart());
  return memory.get(customerId)!;
}

async function writeCart(customerId: string, cart: ShcCart): Promise<void> {
  const r = await getRedis();
  if (r) {
    await r.set(KEY_PREFIX + customerId, JSON.stringify(cart), "EX", TTL_SEC);
    return;
  }
  memory.set(customerId, cart);
}

export async function getCart(customerId: string): Promise<ShcCart> {
  return readCart(customerId);
}

export async function clearCart(customerId: string): Promise<ShcCart> {
  const empty = emptyCart();
  const r = await getRedis();
  if (r) await r.del(KEY_PREFIX + customerId);
  else memory.set(customerId, empty);
  return empty;
}

export async function addToCart(
  customerId: string,
  item: ShcCartItem,
  opts?: { enforceOneCook?: boolean }
): Promise<ShcCart> {
  const cart = await readCart(customerId);
  if (opts?.enforceOneCook !== false) {
    if (cart.cookId && cart.cookId !== item.cook_id) {
      throw new Error("SHC-CART-002: One cook per cart — clear cart before adding from another cook");
    }
    if (!cart.cookId) cart.cookId = item.cook_id;
  }
  const existing = cart.items.find((i) => i.product_id === item.product_id);
  if (existing) existing.qty += item.qty;
  else cart.items.push({ ...item });
  await writeCart(customerId, cart);
  return cart;
}