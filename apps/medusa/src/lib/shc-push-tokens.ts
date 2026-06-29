/** In-memory customer Expo push tokens (keyed by customer_id). Persist to DB in production (via customer.metadata + cook table). */
const customerTokens = new Map<string, string>();

export function registerCustomerPushToken(customerId: string, token: string) {
  customerTokens.set(customerId, token);
}

export function getCustomerPushToken(customerId: string): string | undefined {
  return customerTokens.get(customerId);
}

/** Optional async lookup that can hydrate from customer metadata (used in notify when mem cold) */
export async function getCustomerPushTokenAsync(customerId: string, container?: any): Promise<string | undefined> {
  const mem = customerTokens.get(customerId);
  if (mem) return mem;
  if (!container || !customerId) return undefined;
  try {
    const customerModule: any = container.resolve?.("customer");
    if (customerModule?.retrieveCustomer) {
      const cust = await customerModule.retrieveCustomer(customerId).catch(() => null);
      const token = cust?.metadata?.expo_push_token;
      if (token) {
        customerTokens.set(customerId, token); // hydrate mem
        return token;
      }
    }
  } catch {}
  return undefined;
}

export async function getCustomerWebPushSubscriptionAsync(
  customerId: string,
  container?: any
): Promise<Record<string, unknown> | undefined> {
  if (!container || !customerId) return undefined;
  try {
    const customerModule: any = container.resolve?.("customer");
    if (customerModule?.retrieveCustomer) {
      const cust = await customerModule.retrieveCustomer(customerId).catch(() => null);
      const sub = cust?.metadata?.web_push_subscription;
      if (sub && typeof sub === "object") return sub as Record<string, unknown>;
    }
  } catch {}
  return undefined;
}