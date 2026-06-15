import { z } from "zod";

export type ShcUser = {
  role: "customer" | "cook";
  id: string;
  email?: string;
  name?: string;
};

export type ShcApiClientConfig = {
  medusaBase: string;
  publishableKey: string;
  appRole: "customer" | "cook";
  getAccessToken: () => string | null;
  setAccessToken?: (token: string | null) => void;
  logPrefix?: string;
};

const CooksSchema = z.object({ cooks: z.array(z.any()) });
const ProductsSchema = z.object({ products: z.array(z.any()) });

export function createShcApiClient(config: ShcApiClientConfig) {
  const log = config.logPrefix || "[shc-api]";
  let cachedUser: ShcUser | null = null;

  async function request<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T> {
    const token = config.getAccessToken();
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      ...(config.publishableKey ? { "x-publishable-api-key": config.publishableKey } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers as Record<string, string>),
    };

    const res = await fetch(`${config.medusaBase}${path}`, { ...init, headers });
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      const msg = (errBody as any)?.error?.message || (errBody as any)?.message || `HTTP ${res.status}`;
      throw new Error(msg);
    }
    const json = await res.json();
    if (schema) {
      const p = schema.safeParse(json);
      if (!p.success) throw new Error(`${log} invalid response shape`);
      return p.data;
    }
    return json as T;
  }

  const api = {
    async loginCustomer(email: string, password: string) {
      const data = await request<{ token: string; user: ShcUser }>("/store/shc/auth/customer/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      config.setAccessToken?.(data.token);
      cachedUser = data.user;
      return data;
    },

    async registerCustomer(email: string, password: string, first_name?: string, last_name?: string) {
      const data = await request<{ token: string; user: ShcUser }>("/store/shc/auth/customer/register", {
        method: "POST",
        body: JSON.stringify({ email, password, first_name, last_name }),
      });
      config.setAccessToken?.(data.token);
      cachedUser = data.user;
      return data;
    },

    async loginCook(email: string, password: string) {
      const data = await request<{ token: string; user: ShcUser }>("/store/shc/auth/cook/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      config.setAccessToken?.(data.token);
      cachedUser = data.user;
      return data;
    },

    async getMe() {
      const data = await request<{ user: ShcUser }>("/store/shc/auth/me", { method: "GET" });
      cachedUser = data.user;
      return data.user;
    },

    logout() {
      config.setAccessToken?.(null);
      cachedUser = null;
    },

    getCurrentUser() {
      return cachedUser;
    },

    setCurrentUser(user: ShcUser | null) {
      cachedUser = user;
    },

    async getCooks() {
      const r = await request("/store/shc/cooks", { method: "GET" }, CooksSchema as any);
      return (r as any).cooks || [];
    },

    async searchProducts(q = "", _f?: unknown) {
      const qs = q ? `?q=${encodeURIComponent(q)}` : "";
      const r = await request(`/store/shc/products${qs}`, { method: "GET" }, ProductsSchema as any);
      return (r as any).products || [];
    },

    async getCookBySlug(slug: string) {
      const r = await request(`/store/shc/cooks/${encodeURIComponent(slug)}`, { method: "GET" });
      return (r as any).cook;
    },

    async getProduct(id: string) {
      const r = await request(`/store/shc/products/${encodeURIComponent(id)}`, { method: "GET" });
      return (r as any).product;
    },

    async getSlots(productId: string) {
      const r = await request(`/store/shc/products/${encodeURIComponent(productId)}/slots`, { method: "GET" });
      return (r as any).slots || [];
    },

    async addToCart(productId: string, qty: number) {
      const r = await request("/store/shc/cart", {
        method: "POST",
        body: JSON.stringify({ product_id: productId, qty }),
      });
      return (r as any).cart;
    },

    async getCart() {
      const r = await request("/store/shc/cart", { method: "GET" });
      return (r as any).cart;
    },

    async clearCart() {
      const r = await request("/store/shc/cart", { method: "DELETE" });
      return (r as any).cart;
    },

    async checkout(allergenAck: boolean, collection: { date: string; slot: string }, pdpaConsent = true) {
      return request("/store/shc/carts/demo-complete", {
        method: "POST",
        body: JSON.stringify({
          allergen_acked: allergenAck,
          collection_date: collection.date,
          collection_slot: collection.slot,
          pdpa_consent: pdpaConsent,
        }),
      });
    },

    async checkoutWithCredits(
      allergenAck: boolean,
      collection: { date: string; slot: string },
      creditsToApply = 0,
      isCorporate = false
    ) {
      return request("/store/shc/checkout-credits", {
        method: "POST",
        body: JSON.stringify({ allergenAck, collection, creditsToApply, isCorporate }),
      });
    },

    async transitionOrder(orderId: string, to: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/transition`, {
        method: "POST",
        body: JSON.stringify({ to }),
      });
      return (r as any).order;
    },

    async getOrder(id: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(id)}`, { method: "GET" });
      return (r as any).order;
    },

    async getMyOrders(role?: "customer" | "cook") {
      const r = role || config.appRole;
      const r2 = await request(`/store/shc/orders?role=${r}`, { method: "GET" });
      return (r2 as any).orders || [];
    },

    async getMessages(orderId: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/messages`, { method: "GET" });
      return (r as any).messages || [];
    },

    async sendMessage(orderId: string, body: string, from: "customer" | "cook") {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/messages`, {
        method: "POST",
        body: JSON.stringify({ body, from }),
      });
      return (r as any).messages;
    },

    async createCookListing(input: Record<string, unknown>) {
      const r = await request("/store/shc/listings", { method: "POST", body: JSON.stringify(input) });
      return (r as any).listing || (r as any).product;
    },

    async getEarnings() {
      return request("/store/shc/earnings", { method: "GET" });
    },

    async getCredits() {
      return request("/store/shc/credits", { method: "GET" });
    },

    async redeemCredits(amount: number) {
      return request("/store/shc/credits", { method: "POST", body: JSON.stringify({ amount }) });
    },

    async createRequest(input: Record<string, unknown>) {
      const r = await request("/store/shc/requests", { method: "POST", body: JSON.stringify(input) });
      return (r as any).request;
    },

    async listOpenRequests() {
      const r = await request("/store/shc/requests", { method: "GET" });
      return (r as any).requests || [];
    },

    async createBid(requestId: string, priceCents: number, message?: string) {
      const r = await request("/store/shc/bids", {
        method: "POST",
        body: JSON.stringify({ request_id: requestId, price_cents: priceCents, message }),
      });
      return (r as any).bid;
    },

    async getBids(requestId?: string) {
      const qs = requestId ? `?request_id=${encodeURIComponent(requestId)}` : "";
      const r = await request(`/store/shc/bids${qs}`, { method: "GET" });
      return (r as any).bids || [];
    },

    async acceptBid(bidId: string) {
      return request(`/store/shc/bids/${encodeURIComponent(bidId)}/accept`, { method: "POST", body: "{}" });
    },

    async getHeritageArchive(cookId: string) {
      const r = await request(`/store/shc/heritage?cook_id=${encodeURIComponent(cookId)}`, { method: "GET" });
      return (r as any).archive || [];
    },

    async addHeritageEntry(cookId: string, entry: Record<string, unknown>) {
      const r = await request("/store/shc/heritage", {
        method: "POST",
        body: JSON.stringify({ cook_id: cookId, ...entry }),
      });
      return (r as any).entry;
    },

    async getNotifications() {
      const r = await request("/store/shc/notifications", { method: "GET" });
      return (r as any).notifications || [];
    },

    async estimateCaloriesAI(ingredients: unknown[]) {
      return request("/store/shc/ai", { method: "POST", body: JSON.stringify({ ingredients }) });
    },

    async getPhotoTips() {
      const r = await request("/store/shc/ai", { method: "GET" });
      return (r as any).tips ? r : { tips: (r as any).tips };
    },

    async registerPushToken(cookId: string, token: string) {
      return request("/store/shc/push-token", {
        method: "POST",
        body: JSON.stringify({ cook_id: cookId, expo_push_token: token }),
      });
    },
  };

  return api;
}

export type ShcApiClient = ReturnType<typeof createShcApiClient>;