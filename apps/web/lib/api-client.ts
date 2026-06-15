import { createShcApiClient } from '@shc/api-client';

const TOKEN_KEY = 'shc_web_token';
const USER_KEY = 'shc_web_user';

let accessToken: string | null = null;

function readToken() {
  if (typeof window === 'undefined') return null;
  return accessToken || localStorage.getItem(TOKEN_KEY);
}

export const client = createShcApiClient({
  medusaBase: process.env.NEXT_PUBLIC_SHC_API_BASE || 'http://localhost:9000',
  publishableKey: process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  appRole: 'customer',
  getAccessToken: readToken,
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
  if (!token) return null;
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
export const logout = () => clearSession();

export const getCooks = () => client.getCooks();
export const searchProducts = (q?: string, f?: unknown) => client.searchProducts(q || '', f);
export const getCookBySlug = (slug: string) => client.getCookBySlug(slug);
export const getProduct = (id: string) => client.getProduct(id);
export const getSlots = (pid: string) => client.getSlots(pid);
export const addToCart = (pid: string, qty: number) => client.addToCart(pid, qty);
export const getCart = () => client.getCart();
export const clearCart = () => client.clearCart();
export const checkout = (ack: boolean, coll: { date: string; slot: string }, pdpa = true) =>
  client.checkout(ack, coll, pdpa);
export const checkoutWithCredits = (
  ack: boolean,
  coll: { date: string; slot: string },
  credits = 0,
  corporate = false
) => client.checkoutWithCredits(ack, coll, credits, corporate);
export const transitionOrder = (oid: string, to: string) => client.transitionOrder(oid, to);
export const getOrder = (id: string) => client.getOrder(id);
export const getMyOrders = () => client.getMyOrders('customer');
export const getMessages = (oid: string) => client.getMessages(oid);
export const sendMessage = (oid: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(oid, body, from);
export const getCredits = () => client.getCredits();
export const redeemCredits = (a: number) => client.redeemCredits(a);
export const createRequest = (i: Record<string, unknown>) => client.createRequest(i);
export const listOpenRequests = () => client.listOpenRequests();
export const getNotifications = () => client.getNotifications();
export const getHeritageArchive = (cookId: string) => client.getHeritageArchive(cookId);
export const getBids = (requestId?: string) => client.getBids(requestId);
export const createBid = (requestId: string, priceCents: number, message?: string) =>
  client.createBid(requestId, priceCents, message);
export const acceptBid = (bidId: string) => client.acceptBid(bidId);
export const estimateCaloriesAI = (ingredients: unknown[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';