import { z } from "zod";
import type { SHCErrorCode } from "@shc/types";

export class ShcRequestError extends Error {
  code?: SHCErrorCode;

  constructor(message: string, code?: SHCErrorCode) {
    super(message);
    this.name = "ShcRequestError";
    this.code = code;
  }
}

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
      const apiError = (errBody as { error?: { code?: SHCErrorCode; message?: string } }).error;
      const msg = apiError?.message || (errBody as { message?: string }).message || `HTTP ${res.status}`;
      const code = apiError?.code;
      if (code) throw new ShcRequestError(msg, code);
      throw new ShcRequestError(msg);
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

    async registerCook(
      email: string,
      password: string,
      display_name: string,
      area: string,
      story?: string
    ) {
      const data = await request<{ token: string; user: ShcUser }>("/store/shc/auth/cook/register", {
        method: "POST",
        body: JSON.stringify({ email, password, display_name, area, story }),
      });
      config.setAccessToken?.(data.token);
      cachedUser = data.user;
      return data;
    },

    async updateCookProfile(input: {
      display_name?: string;
      area?: string;
      story?: string;
      collection_instructions?: string;
      pdpa_consent?: boolean;
    }) {
      return request<{ cook: Record<string, unknown> }>("/store/shc/auth/cook/profile", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
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

    /** Cooking soon — add batch to cart (capacity reserved at checkout complete) */
    async addDropToCart(dropId: string, qty: number) {
      const r = await request("/store/shc/cart", {
        method: "POST",
        body: JSON.stringify({ drop_id: dropId, qty }),
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

    async flagCorporateOrder(orderId: string, note: string) {
      return request(`/store/shc/orders/${encodeURIComponent(orderId)}/corporate`, {
        method: "POST",
        body: JSON.stringify({ note }),
      });
    },

    async getOrder(id: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(id)}`, { method: "GET" });
      return (r as any).order;
    },

    /** SG tax invoice / cook settlement — JSON + PDF base64 (web download). */
    async getOrderInvoice(id: string) {
      return request(`/store/shc/orders/${encodeURIComponent(id)}/invoice`, { method: "GET" }) as Promise<{
        invoice: Record<string, unknown>;
        html: string;
        pdf_base64: string;
        filename: string;
        mime: string;
      }>;
    },

    /** Short-lived signed PDF URL for mobile Linking.openURL. */
    async getOrderInvoiceDownloadUrl(id: string) {
      return request(`/store/shc/orders/${encodeURIComponent(id)}/invoice?issue_url=1`, {
        method: "GET",
      }) as Promise<{
        download_url: string;
        expires_at?: string;
        expires_in?: number;
        filename?: string;
        mime?: string;
      }>;
    },

    /**
     * Create HitPay PayNow QR (or manual UEN fallback) for an order.
     * POST /store/shc/orders/:id/paynow
     */
    async createOrderPayNow(id: string) {
      return request(`/store/shc/orders/${encodeURIComponent(id)}/paynow`, {
        method: "POST",
      }) as Promise<{
        provider: "hitpay" | "already_paid" | "hitpay_error" | "hitpay_unconfigured" | string;
        order_id: string;
        amount?: number;
        currency?: string;
        reference?: string;
        uen?: string;
        display_name?: string;
        payment_request_id?: string | null;
        checkout_url?: string | null;
        qr_payload?: string | null;
        qr_image_data_url?: string | null;
        status?: string;
        shc_status?: string;
        paynow_reference?: string | null;
        hint?: string;
      }>;
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

    async getCookListings() {
      const r = await request("/store/shc/listings", { method: "GET" });
      return (r as any).listings || (r as any).products || [];
    },

    async createCookListing(input: Record<string, unknown>) {
      const r = await request("/store/shc/listings", { method: "POST", body: JSON.stringify(input) });
      return (r as any).listing || (r as any).product;
    },

    async updateCookListing(id: string, input: Record<string, unknown>) {
      const r = await request(`/store/shc/listings/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return (r as any).listing || (r as any).product;
    },

    async deleteCookListing(id: string) {
      return request(`/store/shc/listings/${encodeURIComponent(id)}`, { method: "DELETE" });
    },

    async getComplianceDocs() {
      const r = await request("/store/shc/compliance", { method: "GET" });
      return (r as any).docs || [];
    },

    async submitComplianceDoc(input: { type: "sfa" | "wsq"; file_key: string; expiry_date?: string }) {
      const r = await request("/store/shc/compliance", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return (r as any).doc;
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

    async listMyRequests() {
      const r = await request("/store/shc/requests?mine=true", { method: "GET" });
      return (r as any).requests || [];
    },

    /** Cooking soon — marketplace open batches */
    async listDrops(opts?: { cook_id?: string; mine?: boolean }) {
      const qs = new URLSearchParams();
      if (opts?.cook_id) qs.set("cook_id", opts.cook_id);
      if (opts?.mine) qs.set("mine", "true");
      const q = qs.toString();
      const r = await request(`/store/shc/drops${q ? `?${q}` : ""}`, { method: "GET" });
      return (r as any).drops || [];
    },

    async getDrop(id: string) {
      const r = await request(`/store/shc/drops/${encodeURIComponent(id)}`, { method: "GET" });
      return (r as any).drop;
    },

    async createDrop(input: Record<string, unknown>) {
      const r = await request("/store/shc/drops", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return (r as any).drop;
    },

    async patchDrop(id: string, input: Record<string, unknown>) {
      const r = await request(`/store/shc/drops/${encodeURIComponent(id)}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return (r as any).drop;
    },

    /**
     * @deprecated Prefer addDropToCart + checkout (one-cook cart path).
     * Kept for admin/smoke; customer UIs must not call this.
     */
    async orderDrop(id: string, qty: number, opts?: { allergen_acked?: boolean; pdpa_consent?: boolean }) {
      return request(`/store/shc/drops/${encodeURIComponent(id)}/order`, {
        method: "POST",
        body: JSON.stringify({
          qty,
          allergen_acked: opts?.allergen_acked !== false,
          pdpa_consent: opts?.pdpa_consent !== false,
        }),
      });
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

    async isFeatureEnabled(key: string) {
      const r = await request(`/store/shc/feature-flags?key=${encodeURIComponent(key)}`, { method: "GET" });
      return Boolean((r as any).enabled);
    },

    async markNotificationsRead(ids?: string[], all = false) {
      return request("/store/shc/notifications", {
        method: "POST",
        body: JSON.stringify({ ids, all }),
      });
    },

    async getUploadUrl(objectName: string, resourceOwner?: string, options?: { mode?: 'presigned' | 'server'; fileData?: string; contentType?: string }) {
      const body: any = { object_name: objectName, resource_owner: resourceOwner };
      if (options?.mode) body.mode = options.mode;
      if (options?.fileData) body.fileData = options.fileData;
      if (options?.contentType) body.content_type = options.contentType;
      return request("/store/shc/upload", {
        method: "POST",
        body: JSON.stringify(body),
      });
    },

    async listCookExpenses() {
      const r = await request("/store/shc/cook-expenses", { method: "GET" });
      return r as { expenses: any[]; count: number; total_cents: number };
    },

    async createCookExpense(input: { amount_cents: number; category: string; receipt_key?: string; date: string }) {
      const r = await request("/store/shc/cook-expenses", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return (r as any).expense;
    },

    async estimateCaloriesAI(ingredients: unknown[]) {
      return request("/store/shc/ai", { method: "POST", body: JSON.stringify({ ingredients }) });
    },

    async getPhotoTips() {
      const r = await request("/store/shc/ai", { method: "GET" });
      return (r as any).tips ? r : { tips: (r as any).tips };
    },

    /** AI listing photo: generate (FLUX) or enhance (polish = sharp / restyle = FLUX) */
    async generateListingImage(input: {
      mode: "generate" | "enhance";
      dish_name: string;
      cuisine?: string;
      heritage_note?: string;
      image_base64?: string;
      /** @deprecated use enhance_style */
      ai_restyle?: boolean;
      enhance_style?: "polish" | "restyle";
    }) {
      return request("/store/shc/ai/image", {
        method: "POST",
        body: JSON.stringify(input),
      }) as Promise<{
        image_url?: string;
        webp_url?: string;
        jpeg_url?: string;
        key?: string;
        source?: string;
        enhance_style?: "polish" | "restyle";
        disclaimer?: string;
        width?: number;
        height?: number;
        bytes?: number;
        model?: string;
      }>;
    },

    async getAiImageStatus() {
      return request("/store/shc/ai/image", { method: "GET" }) as Promise<{
        configured?: boolean;
        generate_available?: boolean;
        generate_unavailable_reason?: string | null;
        modes?: string[];
        model?: string;
        max_px?: number;
        cuisine_presets?: string[];
        enhance_styles?: Record<string, string>;
        note?: string;
      }>;
    },

    async registerPushToken(
      token: string,
      opts?: { cookId?: string; role?: "cook" | "customer" }
    ) {
      return request("/store/shc/push-token", {
        method: "POST",
        body: JSON.stringify({
          cook_id: opts?.cookId,
          expo_push_token: token,
          role: opts?.role,
        }),
      });
    },

    async registerWebPushSubscription(subscription: Record<string, unknown>) {
      return request("/store/shc/push-token", {
        method: "POST",
        body: JSON.stringify({
          web_push_subscription: subscription,
          role: "customer",
        }),
      });
    },

    async getReview(orderId: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/review`, { method: "GET" });
      return (r as any).review;
    },

    async submitReview(orderId: string, rating: number, body?: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/review`, {
        method: "POST",
        body: JSON.stringify({ rating, body }),
      });
      return (r as any).review;
    },

    async getOrderDisputes(orderId: string) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/dispute`, { method: "GET" });
      return (r as any).disputes || [];
    },

    async submitOrderDispute(orderId: string, input: { type?: string; notes: string }) {
      const r = await request(`/store/shc/orders/${encodeURIComponent(orderId)}/dispute`, {
        method: "POST",
        body: JSON.stringify(input),
      });
      return (r as any).dispute;
    },

    // --- Tiffin subscription ---
    async getCatalogCategories() {
      const r = await request("/store/shc/categories", { method: "GET" });
      return (r as any).categories || [];
    },

    async getTiffinKitchens() {
      const r = await request("/store/shc/tiffin/kitchens", { method: "GET" });
      return (r as any).kitchens || [];
    },

    async getTiffinKitchen(cookId: string) {
      const r = await request(`/store/shc/tiffin/kitchens/${encodeURIComponent(cookId)}`, { method: "GET" });
      return (r as any).kitchen;
    },

    async getTiffinSubscription() {
      return request("/store/shc/tiffin/subscription", { method: "GET" });
    },

    async subscribeTiffin(cookId: string, mealsPerWeek: 2 | 3 | 4, weeks?: number) {
      return request("/store/shc/tiffin/subscription", {
        method: "POST",
        body: JSON.stringify({
          cook_id: cookId,
          meals_per_week: mealsPerWeek,
          ...(weeks != null ? { weeks } : {}),
        }),
      });
    },

    async cancelTiffinSubscription() {
      return request("/store/shc/tiffin/subscription", { method: "DELETE" });
    },

    async getTiffinWeeklyPlan(weekStart?: string) {
      const qs = weekStart ? `?week_start=${encodeURIComponent(weekStart)}` : "";
      return request(`/store/shc/tiffin/weekly-plan${qs}`, { method: "GET" });
    },

    async saveTiffinWeeklyPlan(input: {
      slots: { day_of_week: number; product_id: string; collection_slot?: string }[];
      week_start?: string | null;
      as_recurring_template?: boolean;
    }) {
      return request("/store/shc/tiffin/weekly-plan", {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },

    async saveTiffinNextWeekPlan(slots: { day_of_week: number; product_id: string; collection_slot?: string }[]) {
      return request("/store/shc/tiffin/weekly-plan/next-week", {
        method: "PUT",
        body: JSON.stringify({ slots }),
      });
    },

    async getTiffinCookConfig() {
      return request("/store/shc/tiffin/cook/config", { method: "GET" });
    },

    async updateTiffinCookConfig(input: {
      enabled?: boolean;
      tagline?: string;
      eligible_product_ids?: string[];
      meals_per_week_options?: (2 | 3 | 4)[];
      collection_days?: number[];
      default_collection_slot?: string;
    }) {
      return request("/store/shc/tiffin/cook/config", {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },

    async pauseTiffinSubscription(days = 1) {
      return request("/store/shc/tiffin/subscription/pause", {
        method: "POST",
        body: JSON.stringify({ days }),
      });
    },

    async resumeTiffinSubscription() {
      return request("/store/shc/tiffin/subscription/resume", { method: "POST", body: "{}" });
    },

    async rechargeTiffinSubscription(weeks = 4, paynowRef?: string) {
      return request("/store/shc/tiffin/subscription/recharge", {
        method: "POST",
        body: JSON.stringify({ weeks, paynow_ref: paynowRef }),
      });
    },

    async cancelTiffinSubscriptionWithReason(reason?: string) {
      return request("/store/shc/tiffin/subscription", {
        method: "DELETE",
        body: JSON.stringify({ reason }),
      });
    },

    async getTiffinMealOrders(from?: string, to?: string) {
      const qs = new URLSearchParams();
      if (from) qs.set("from", from);
      if (to) qs.set("to", to);
      const q = qs.toString();
      return request(`/store/shc/tiffin/orders${q ? `?${q}` : ""}`, { method: "GET" });
    },

    async skipTiffinMeal(collectionDate: string, collectionSlot?: string) {
      return request("/store/shc/tiffin/orders/skip", {
        method: "POST",
        body: JSON.stringify({ collection_date: collectionDate, collection_slot: collectionSlot }),
      });
    },

    /** HomelyEats add extras / customize meal (≥8h). amount_cents debits wallet when > 0. */
    async customizeTiffinMeal(input: {
      collectionDate: string;
      collectionSlot?: string;
      extraLines: string[];
      amountCents?: number;
      paynowRef?: string | null;
    }) {
      return request("/store/shc/tiffin/orders/customize", {
        method: "POST",
        body: JSON.stringify({
          collection_date: input.collectionDate,
          collection_slot: input.collectionSlot,
          extra_lines: input.extraLines,
          amount_cents: input.amountCents ?? 0,
          paynow_ref: input.paynowRef ?? null,
        }),
      });
    },

    async updateTiffinSubscriptionNotes(input: {
      cooking_notes?: string | null;
      collection_notes?: string | null;
    }) {
      return request("/store/shc/tiffin/subscription/notes", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },

    async kitchenCancelTiffinDay(collectionDate: string, reason?: string) {
      return request("/store/shc/tiffin/orders/kitchen-cancel", {
        method: "POST",
        body: JSON.stringify({ collection_date: collectionDate, reason }),
      });
    },

    async publishTiffinDayMenu(collectionDate: string, productIds: string[], note?: string) {
      return request("/store/shc/tiffin/cook/menu", {
        method: "PUT",
        body: JSON.stringify({ collection_date: collectionDate, product_ids: productIds, note }),
      });
    },

    async getTiffinDayMenu(date: string) {
      return request(`/store/shc/tiffin/cook/menu?date=${encodeURIComponent(date)}`, { method: "GET" });
    },
  };

  return api;
}

export type ShcApiClient = ReturnType<typeof createShcApiClient>;