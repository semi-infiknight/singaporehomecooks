/** AGENT: Web customer client — auth-gate checkout/PDP. CORS via pnpm railway:wire. blueprint/agent/build-protocol.md */
import { createShcApiClient } from '@shc/api-client';
import { resolveRailwayMedusaBase, resolveRailwayPublishableKey } from '@shc/utils';
import { ensureGuestId, getGuestId } from './guest-session';

const TOKEN_KEY = 'shc_web_token';
const USER_KEY = 'shc_web_user';

let accessToken: string | null = null;

function readToken() {
  if (typeof window === 'undefined') return null;
  return accessToken || localStorage.getItem(TOKEN_KEY);
}

export const client = createShcApiClient({
  medusaBase: resolveRailwayMedusaBase(process.env.NEXT_PUBLIC_SHC_API_BASE),
  publishableKey: resolveRailwayPublishableKey(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
  appRole: 'customer',
  getAccessToken: readToken,
  getGuestId: () => getGuestId(),
  setAccessToken: (token) => {
    accessToken = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(TOKEN_KEY, token);
      else localStorage.removeItem(TOKEN_KEY);
    }
  },
  logPrefix: '[web-api]',
});

export async function hydrateSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const userRaw = localStorage.getItem(USER_KEY);
  if (!token) {
    ensureGuestId();
    return null;
  }
  accessToken = token;
  if (userRaw) {
    try {
      client.setCurrentUser(JSON.parse(userRaw));
    } catch {
      /* refresh */
    }
  }
  try {
    const user = await client.getMe();
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    await clearSession();
    return null;
  }
}

export async function persistSession(token: string, user: ReturnType<typeof client.getCurrentUser>) {
  accessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(TOKEN_KEY, token);
    if (user) localStorage.setItem(USER_KEY, JSON.stringify(user));
  }
}

export async function clearSession() {
  accessToken = null;
  client.logout();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }
}

export const login = (email: string, password: string) => client.loginCustomer(email, password);
export const register = (email: string, password: string, first_name?: string, last_name?: string) =>
  client.registerCustomer(email, password, first_name, last_name);
export const getCurrentUser = () => client.getCurrentUser();
export const isAuthenticated = () => Boolean(readToken());
export const logout = () => clearSession();

export const getCooks = () => client.getCooks();
export const getDiscoverPromos = () => client.getDiscoverPromos();
export const getCustomerConfig = () => client.getCustomerConfig();
export const getCookConfig = () => client.getCookConfig();
export const searchProducts = (q?: string, f?: unknown) => client.searchProducts(q || '', f);
export const getCookBySlug = (slug: string) => client.getCookBySlug(slug);
export const getCookReviews = (slug: string, opts?: { limit?: number; offset?: number }) =>
  client.getCookReviews(slug, opts);
export const getProduct = (id: string) => client.getProduct(id);
export const getSlots = (pid: string) => client.getSlots(pid);
export const addToCart = (pid: string, qty: number) => client.addToCart(pid, qty);
export const addDropToCart = (dropId: string, qty: number) => client.addDropToCart(dropId, qty);
export const getCart = () => client.getCart();
export const clearCart = () => client.clearCart();
export const updateCartItem = (productId: string, qty: number) => client.updateCartItem(productId, qty);
export const removeCartItem = (productId: string) => client.removeCartItem(productId);
export const checkout = (
  ack: boolean,
  coll: { date: string; slot: string },
  pdpa = true,
  notes?: {
    cooking_notes?: string | null;
    collection_notes?: string | null;
    customer_collection_lat?: number | null;
    customer_collection_lng?: number | null;
    customer_collection_postal_code?: string | null;
    customer_collection_line1?: string | null;
    guest_contact?: { name: string; email: string; phone: string } | null;
  }
) => client.checkout(ack, coll, pdpa, notes);
export const transitionOrder = (oid: string, to: string) => client.transitionOrder(oid, to);
export const flagCorporateOrder = (orderId: string, note: string) => client.flagCorporateOrder(orderId, note);
export const getOrder = (id: string) => client.getOrder(id);
export const getOrderInvoice = (id: string) => client.getOrderInvoice(id);
export const getOrderInvoiceDownloadUrl = (id: string) => client.getOrderInvoiceDownloadUrl(id);
export const downloadCorporateInvoicesZip = (opts?: { from?: string; to?: string }) =>
  client.downloadCorporateInvoicesZip(opts);
export const createOrderPayNow = (id: string) => client.createOrderPayNow(id);
export const createTiffinRechargePayNow = (weeks: number) => client.createTiffinRechargePayNow(weeks);
export const getMyOrders = () => client.getMyOrders('customer');

/** Signed-in: server list. Guest: hydrate from device-local order ids recorded at checkout. */
export async function getCustomerOrders(): Promise<unknown[]> {
  if (isAuthenticated()) {
    return getMyOrders();
  }
  const { listGuestOrderIds } = await import('./guest-session');
  const ids = listGuestOrderIds();
  if (!ids.length) return [];
  const rows = await Promise.all(
    ids.map(async (id) => {
      try {
        return await getOrder(id);
      } catch {
        return null;
      }
    })
  );
  return rows.filter(Boolean);
}

export const getMessages = (oid: string) => client.getMessages(oid);
export const sendMessage = (oid: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(oid, body, from);
export const createRequest = (i: Record<string, unknown>) => client.createRequest(i);
export const listOpenRequests = () => client.listOpenRequests();
export const listMyRequests = () => client.listMyRequests();
export const getRequest = (id: string) => client.getRequest(id);
export const listDrops = (opts?: { cook_id?: string; mine?: boolean }) => client.listDrops(opts);
export const getDrop = (id: string) => client.getDrop(id);
export const orderDrop = (id: string, qty: number, opts?: { allergen_acked?: boolean; pdpa_consent?: boolean }) =>
  client.orderDrop(id, qty, opts);
export const getNotifications = () => client.getNotifications();
export const isFeatureEnabled = (key: string) => client.isFeatureEnabled(key);
export const markNotificationsRead = (ids?: string[], all = false) =>
  client.markNotificationsRead(ids, all);
export const generateListingImage = (input: {
  mode: 'generate' | 'enhance';
  dish_name: string;
  cuisine?: string;
  image_base64?: string;
  ai_restyle?: boolean;
  enhance_style?: 'polish' | 'restyle';
}) => client.generateListingImage(input);
export const getAiImageStatus = () => client.getAiImageStatus();
export const getBids = (requestId?: string) => client.getBids(requestId);
export const createBid = (
  requestId: string,
  priceCents: number,
  message?: string,
  lineItems?: Array<{ request_line_id: string; included: boolean; servings?: number; price_cents: number }>
) => client.createBid(requestId, priceCents, message, lineItems);
export const acceptBid = (
  bidId: string,
  opts?: { collection_date?: string; collection_slot?: string; accepted_line_ids?: string[] }
) => client.acceptBid(bidId, opts);
export const estimateCaloriesAI = (ingredients: unknown[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();
export const getReview = (orderId: string) => client.getReview(orderId);
export const submitReview = (orderId: string, rating: number, body?: string) =>
  client.submitReview(orderId, rating, body);
export const getOrderDisputes = (orderId: string) => client.getOrderDisputes(orderId);
export const submitOrderDispute = (orderId: string, input: { type?: string; notes: string }) =>
  client.submitOrderDispute(orderId, input);

export const getUploadUrl = (objectName: string, resourceOwner?: string, options?: any) =>
  client.getUploadUrl(objectName, resourceOwner, options);

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';