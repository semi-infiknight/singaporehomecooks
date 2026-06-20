import { createShcApiClient } from '@shc/api-client';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'shc_customer_token';
const USER_KEY = 'shc_customer_user';

let accessToken: string | null = null;

export const client = createShcApiClient({
  medusaBase: process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000',
  publishableKey: process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  appRole: 'customer',
  getAccessToken: () => accessToken,
  setAccessToken: (token) => {
    accessToken = token;
  },
  logPrefix: '[customer-api]',
});

export async function hydrateSession() {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const userRaw = await SecureStore.getItemAsync(USER_KEY);
  if (token) {
    accessToken = token;
    if (userRaw) {
      try {
        client.setCurrentUser(JSON.parse(userRaw));
      } catch {
        /* refresh below */
      }
    }
    try {
      const user = await client.getMe();
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
      return user;
    } catch {
      await clearSession();
      return null;
    }
  }
  return null;
}

export async function persistSession(token: string, user: ReturnType<typeof client.getCurrentUser>) {
  accessToken = token;
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  if (user) await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  accessToken = null;
  client.logout();
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}

export const login = (email: string, password: string) => client.loginCustomer(email, password);
export const register = (email: string, password: string, first_name?: string, last_name?: string) =>
  client.registerCustomer(email, password, first_name, last_name);
export const getMe = () => client.getMe();
export const getCurrentUser = () => client.getCurrentUser();
export const isAuthenticated = () => Boolean(accessToken);
export const logout = () => clearSession();

export const getCooks = () => client.getCooks();
export const searchProducts = (q: string, f?: unknown) => client.searchProducts(q, f);
export const getCookBySlug = (slug: string) => client.getCookBySlug(slug);
export const getProduct = (id: string) => client.getProduct(id);
export const getSlots = (productId: string) => client.getSlots(productId);
export const addToCart = (productId: string, qty: number) => client.addToCart(productId, qty);
export const getCart = () => client.getCart();
export const clearCart = () => client.clearCart();
export const checkout = (allergenAck: boolean, collection: { date: string; slot: string }, pdpaConsent = true) =>
  client.checkout(allergenAck, collection, pdpaConsent);
export const checkoutWithCredits = (
  allergenAck: boolean,
  collection: { date: string; slot: string },
  creditsToApply = 0,
  isCorporate = false
) => client.checkoutWithCredits(allergenAck, collection, creditsToApply, isCorporate);
export const transitionOrder = (orderId: string, to: string) => client.transitionOrder(orderId, to);
export const getOrder = (id: string) => client.getOrder(id);
export const getMyOrders = () => client.getMyOrders('customer');
export const getMessages = (orderId: string) => client.getMessages(orderId);
export const sendMessage = (orderId: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(orderId, body, from);
export const getCredits = () => client.getCredits();
export const redeemCredits = (amount: number) => client.redeemCredits(amount);
export const createRequest = (input: Record<string, unknown>) => client.createRequest(input);
export const listOpenRequests = () => client.listOpenRequests();
export const getNotifications = () => client.getNotifications();
export const getHeritageArchive = (cookId: string) => client.getHeritageArchive(cookId);
export const createBid = (requestId: string, priceCents: number, message?: string) =>
  client.createBid(requestId, priceCents, message);
export const getBids = (requestId?: string) => client.getBids(requestId);
export const acceptBid = (bidId: string) => client.acceptBid(bidId);
export const estimateCaloriesAI = (ingredients: unknown[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();
export const flagCorporateOrder = async (_note: string) => ({ ok: true });
export const getReview = (orderId: string) => client.getReview(orderId);
export const submitReview = (orderId: string, rating: number, body?: string) =>
  client.submitReview(orderId, rating, body);
export const registerPushToken = (token: string, opts?: { cookId?: string; role?: 'cook' | 'customer' }) =>
  client.registerPushToken(token, opts);

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';