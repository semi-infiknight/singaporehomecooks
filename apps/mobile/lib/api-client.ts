// apps/mobile/lib/api-client.ts
// TanStack Query ready API client. Currently wired to sophisticated local mock-service.
// Enforces all marketplace rules client-side + shows SHCErrorCode.
// Supports toggle to real Medusa (http://localhost:9000) for supported endpoints with Zod fallback to mock if offline/error.
// Production: always real + auth + rate on server.

import { api, mockFetch, MockAPI } from './mock-service';
import { SHCError, SHCErrorCode, createSHCError } from '@shc/types';
import { z } from 'zod';

// Toggle for full local host mixed mode (dev switch / env). Set EXPO_PUBLIC_USE_REAL_MEDUSA=true or call setUseRealMedusa(true)
let USE_REAL_MEDUSA = (typeof process !== 'undefined' && (process as any).env?.EXPO_PUBLIC_USE_REAL_MEDUSA === 'true') || false;
export function setUseRealMedusa(enabled: boolean) { USE_REAL_MEDUSA = !!enabled; console.info('[api-client] real Medusa mode:', USE_REAL_MEDUSA); }
export function getUseRealMedusa() { return USE_REAL_MEDUSA; }

const MEDUSA_BASE = process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000';
// Set via apps/mobile/.env.local after `pnpm bootstrap:medusa`
const STORE_PUB_KEY = process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '';

// Simple Zod for response validation on real (subset of contracts)
const CooksResponseSchema = z.object({ cooks: z.array(z.any()), count: z.number().optional() });
const ProductsResponseSchema = z.object({ products: z.array(z.any()), count: z.number().optional() });
const OrderResponseSchema = z.object({ order: z.any().optional(), orders: z.array(z.any()).optional() });

async function tryReal<T>(path: string, init?: RequestInit, schema?: z.ZodType<T>): Promise<T | null> {
  if (!USE_REAL_MEDUSA) return null;
  try {
    const res = await fetch(`${MEDUSA_BASE}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(STORE_PUB_KEY ? { 'x-publishable-api-key': STORE_PUB_KEY } : {}),
        ...init?.headers,
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    if (schema) {
      const parsed = schema.safeParse(json);
      if (!parsed.success) {
        console.warn('[api-client] real zod parse fail, fallback mock', parsed.error);
        return null;
      }
      return parsed.data;
    }
    return json;
  } catch (e) {
    console.info('[api-client] real Medusa fetch failed/offline, falling back to mock:', (e as Error).message);
    return null;
  }
}

export const shcApi: MockAPI = api;

// Convenience typed callers (use in hooks) - with real Medusa fallback for supported endpoints
export async function getCooks() {
  const real = await tryReal('/store/shc/cooks', { method: 'GET' }, CooksResponseSchema as any);
  if (real) return (real as any).cooks || [];
  return mockFetch(() => shcApi.listCooks());
}
export async function searchProducts(q: string, f?: any) {
  const qs = q ? `?q=${encodeURIComponent(q)}` : '';
  const real = await tryReal(`/store/shc/products${qs}`, { method: 'GET' }, ProductsResponseSchema as any);
  if (real) return (real as any).products || [];
  return mockFetch(() => shcApi.searchProducts(q, f));
}
export async function getCookBySlug(slug: string) { return mockFetch(() => shcApi.getCook(slug)); }
export async function getProduct(id: string) { return mockFetch(() => shcApi.getProduct(id)); }
export async function getSlots(productId: string) { return mockFetch(() => shcApi.getAvailableSlots(productId)); }

export async function addToCart(productId: string, qty: number) {
  return mockFetch(() => shcApi.addToCart(productId, qty));
}
export async function getCart() { return mockFetch(() => shcApi.getCart()); }
export async function clearCart() { return mockFetch(() => shcApi.clearCart()); }

export async function checkout(allergenAck: boolean, collection: { date: string; slot: string }, pdpaConsent = true) {
  // Real path: would require cartId from prior cart create; for mixed demo use /store/shc/carts/demo/complete or fallback always mock for full rule (real complete is complex)
  const realAttempt = await tryReal('/store/shc/carts/demo-complete', {
    method: 'POST',
    body: JSON.stringify({ collection_date: collection.date, collection_slot: collection.slot, allergen_acked: allergenAck, pdpa_consent: pdpaConsent }),
  });
  if (realAttempt) return realAttempt;
  return mockFetch(() => shcApi.checkout(allergenAck, collection, pdpaConsent));
}

export async function transitionOrder(orderId: string, to: any) {
  return mockFetch(() => shcApi.transitionOrder(orderId, to));
}

export async function getOrder(id: string) { return mockFetch(() => shcApi.getOrder(id)); }
export async function getMyOrders(role: 'customer' | 'cook') {
  const real = await tryReal(`/store/shc/orders?${role}_id=demo`, { method: 'GET' }, z.any() as any);
  if (real && (real as any).orders) return (real as any).orders;
  return mockFetch(() => role === 'cook' ? shcApi.listOrdersForCook() : shcApi.listOrdersForCustomer());
}

export async function getMessages(orderId: string) { return mockFetch(() => shcApi.getMessages(orderId)); }
export async function sendMessage(orderId: string, body: string, from: 'customer' | 'cook') {
  return mockFetch(() => shcApi.sendMessage(orderId, body, from));
}

export async function createCookListing(input: any) { return mockFetch(() => shcApi.createListing(input)); }

export async function getEarnings() { return mockFetch(() => shcApi.getEarnings()); }

// Phase 7-9 new: credits, requests, bids, heritage, ai, notifs, corporate. All primary mock (enrich), optional real base wiring prep.
export async function getCredits() { return mockFetch(() => shcApi.getCredits()); }
export async function redeemCredits(amount: number) { return mockFetch(() => shcApi.redeemCredits(amount)); }
export async function createRequest(input: any) { return mockFetch(() => shcApi.createRequest(input)); }
export async function listOpenRequests() { return mockFetch(() => shcApi.listOpenRequests()); }
export async function createBid(requestId: string, priceCents: number, message?: string) { return mockFetch(() => shcApi.createBid(requestId, priceCents, message)); }
export async function getBids(requestId?: string) { return mockFetch(() => shcApi.getBids(requestId)); }
export async function acceptBid(bidId: string) { return mockFetch(() => shcApi.acceptBid(bidId)); }
export async function getHeritageArchive(cookId: string) { return mockFetch(() => shcApi.getHeritageArchive(cookId)); }
export async function addHeritageEntry(cookId: string, entry: any) { return mockFetch(() => shcApi.addHeritageEntry(cookId, entry)); }
export async function getNotifications() { return mockFetch(() => shcApi.getNotifications()); }
export async function estimateCaloriesAI(ingredients: any[]) { return mockFetch(() => shcApi.estimateCaloriesAI(ingredients)); }
export async function getPhotoTips() { return mockFetch(() => shcApi.getPhotoTips()); }
export async function flagCorporateOrder(note: string) { return mockFetch(() => shcApi.flagCorporateOrder(note)); }

export async function registerPushToken(cookId: string, token: string) {
  // Expo push token registration (wired to shc_cook.expo_push_token). Call after getting token via expo-notifications (add dep for prod: npx expo install expo-notifications expo-device).
  // Production: secure store token, register on cook login/onboarding/profile mount.
  const realAttempt = await tryReal('/store/shc/push-token', {
    method: 'POST',
    body: JSON.stringify({ cook_id: cookId, expo_push_token: token }),
  });
  if (realAttempt) return realAttempt;
  return mockFetch(() => (shcApi as any).registerPushToken(cookId, token));
}

export async function checkoutWithCredits(allergenAck: boolean, collection: { date: string; slot: string }, creditsToApply = 0, isCorporate = false) {
  // Supports credits redeem + corporate flag (Phase 9/8)
  const realAttempt = await tryReal('/store/shc/checkout-credits', { method: 'POST', body: JSON.stringify({ allergenAck, collection, creditsToApply, isCorporate }) });
  if (realAttempt) return realAttempt;
  return mockFetch(() => (shcApi as any).checkoutWithCredits(allergenAck, collection, creditsToApply, isCorporate));
}

export function loginAs(role: 'customer' | 'cook', name?: string, pdpaConsent?: { at?: string; version?: string }) { return shcApi.loginAs(role, name, pdpaConsent); }
export function getCurrentUser() { return shcApi.getCurrentUser(); }

// Payment confirm sim for real medusa (ops/admin path, for local host demo)
export async function simulatePaymentConfirm(orderId: string, paynowRef: string) {
  const real = await tryReal('/admin/shc/payment-confirm', {
    method: 'POST',
    body: JSON.stringify({ order_id: orderId, paynow_reference: paynowRef }),
  }, z.any() as any);
  if (real) return real;
  // fallback local
  return { success: true, note: 'simulated locally' };
}

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';