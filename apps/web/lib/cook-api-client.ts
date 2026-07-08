/** AGENT: Web cook-portal client — separate session from customer. Railway only. blueprint/agent/build-protocol.md */
import { createShcApiClient } from '@shc/api-client';
import type { SHCOrderStatus } from '@shc/types';
import { resolveRailwayMedusaBase, resolveRailwayPublishableKey } from '@shc/utils';

export const COOK_TOKEN_KEY = 'shc_cook_token';
export const COOK_USER_KEY = 'shc_cook_user';

let cookAccessToken: string | null = null;

function readCookToken() {
  if (typeof window === 'undefined') return null;
  return cookAccessToken || localStorage.getItem(COOK_TOKEN_KEY);
}

export const cookClient = createShcApiClient({
  medusaBase: resolveRailwayMedusaBase(process.env.NEXT_PUBLIC_SHC_API_BASE),
  publishableKey: resolveRailwayPublishableKey(process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
  appRole: 'cook',
  getAccessToken: readCookToken,
  setAccessToken: (token) => {
    cookAccessToken = token;
    if (typeof window !== 'undefined') {
      if (token) localStorage.setItem(COOK_TOKEN_KEY, token);
      else localStorage.removeItem(COOK_TOKEN_KEY);
    }
  },
  logPrefix: '[web-cook-api]',
});

export async function hydrateCookSession() {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(COOK_TOKEN_KEY);
  const userRaw = localStorage.getItem(COOK_USER_KEY);
  if (!token) return null;
  cookAccessToken = token;
  if (userRaw) {
    try {
      cookClient.setCurrentUser(JSON.parse(userRaw));
    } catch {
      /* refresh */
    }
  }
  try {
    const user = await cookClient.getMe();
    localStorage.setItem(COOK_USER_KEY, JSON.stringify(user));
    return user;
  } catch {
    await clearCookSession();
    return null;
  }
}

export async function persistCookSession(token: string, user: ReturnType<typeof cookClient.getCurrentUser>) {
  cookAccessToken = token;
  if (typeof window !== 'undefined') {
    localStorage.setItem(COOK_TOKEN_KEY, token);
    if (user) localStorage.setItem(COOK_USER_KEY, JSON.stringify(user));
  }
}

export async function clearCookSession() {
  cookAccessToken = null;
  cookClient.logout();
  if (typeof window !== 'undefined') {
    localStorage.removeItem(COOK_TOKEN_KEY);
    localStorage.removeItem(COOK_USER_KEY);
  }
}

export const loginCook = (email: string, password: string) => cookClient.loginCook(email, password);
export const isCookAuthenticated = () => Boolean(readCookToken());
export const getCookUser = () => cookClient.getCurrentUser();
export const getCookOrders = () => cookClient.getMyOrders('cook');
export const transitionCookOrder = (orderId: string, to: SHCOrderStatus) =>
  cookClient.transitionOrder(orderId, to);
export const getCookOrder = (id: string) => cookClient.getOrder(id);
export const getCookListings = () => cookClient.getCookListings();
export const createCookListing = (input: Record<string, unknown>) => cookClient.createCookListing(input);
export const updateCookListing = (id: string, input: Record<string, unknown>) => cookClient.updateCookListing(id, input);
export const deleteCookListing = (id: string) => cookClient.deleteCookListing(id);
export const getComplianceDocs = () => cookClient.getComplianceDocs();
export const submitComplianceDoc = (input: { type: 'sfa' | 'wsq'; file_key: string; expiry_date?: string }) =>
  cookClient.submitComplianceDoc(input);
export const getCookEarnings = () => cookClient.getEarnings();
export const listCookExpenses = () => cookClient.listCookExpenses();
export const createCookExpense = (input: {
  amount_cents: number;
  category: string;
  receipt_key?: string;
  date: string;
}) => cookClient.createCookExpense(input);
export const listOpenRequests = () => cookClient.listOpenRequests();
export const createBid = (requestId: string, priceCents: number, message?: string) =>
  cookClient.createBid(requestId, priceCents, message);