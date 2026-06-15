// apps/mobile/lib/api-client.ts — wired to Medusa via @shc/api-client (real-first, mock fallback)
import { createShcApiClient, resolveActorFromUser } from '@shc/api-client';
import { api, mockFetch, MockAPI } from './mock-service';

const client = createShcApiClient({
  medusaBase: process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000',
  publishableKey: process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  useReal: process.env.EXPO_PUBLIC_USE_REAL_MEDUSA !== 'false',
  getActor: () => resolveActorFromUser(api.getCurrentUser()),
  mockApi: api,
  wrapMock: async <T>(fn: () => T | Promise<T>) => mockFetch(() => fn()) as Promise<T>,
  logPrefix: '[api-client]',
});

export const shcApi: MockAPI = api;
export const setUseRealMedusa = (enabled: boolean) => client.setUseRealMedusa(enabled);
export const getUseRealMedusa = () => client.getUseRealMedusa();

export const getCooks = () => client.getCooks();
export const searchProducts = (q: string, f?: any) => client.searchProducts(q, f);
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
export const transitionOrder = (orderId: string, to: any) => client.transitionOrder(orderId, to);
export const getOrder = (id: string) => client.getOrder(id);
export const getMyOrders = (role: 'customer' | 'cook') => client.getMyOrders(role);
export const getMessages = (orderId: string) => client.getMessages(orderId);
export const sendMessage = (orderId: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(orderId, body, from);
export const createCookListing = (input: any) => client.createCookListing(input);
export const getEarnings = () => client.getEarnings();
export const getCredits = () => client.getCredits();
export const redeemCredits = (amount: number) => client.redeemCredits(amount);
export const createRequest = (input: any) => client.createRequest(input);
export const listOpenRequests = () => client.listOpenRequests();
export const createBid = (requestId: string, priceCents: number, message?: string) =>
  client.createBid(requestId, priceCents, message);
export const getBids = (requestId?: string) => client.getBids(requestId);
export const acceptBid = (bidId: string) => client.acceptBid(bidId);
export const getHeritageArchive = (cookId: string) => client.getHeritageArchive(cookId);
export const addHeritageEntry = (cookId: string, entry: any) => client.addHeritageEntry(cookId, entry);
export const getNotifications = () => client.getNotifications();
export const estimateCaloriesAI = (ingredients: any[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();
export const flagCorporateOrder = (note: string) => client.flagCorporateOrder(note);
export const registerPushToken = (cookId: string, token: string) => client.registerPushToken(cookId, token);
export const loginAs = (role: 'customer' | 'cook', name?: string, pdpaConsent?: { at?: string; version?: string }) =>
  client.loginAs(role, name, pdpaConsent);
export const getCurrentUser = () => client.getCurrentUser();
export const simulatePaymentConfirm = (orderId: string, paynowRef: string) =>
  client.simulatePaymentConfirm(orderId, paynowRef);

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';