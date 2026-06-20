import { createShcApiClient } from '@shc/api-client';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'shc_cook_token';
const USER_KEY = 'shc_cook_user';

let accessToken: string | null = null;

export const client = createShcApiClient({
  medusaBase: process.env.EXPO_PUBLIC_MEDUSA_BASE || 'http://localhost:9000',
  publishableKey: process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY || '',
  appRole: 'cook',
  getAccessToken: () => accessToken,
  setAccessToken: (token) => {
    accessToken = token;
  },
  logPrefix: '[cook-api]',
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

export const login = (email: string, password: string) => client.loginCook(email, password);
export const getMe = () => client.getMe();
export const getCurrentUser = () => client.getCurrentUser();
export const logout = () => clearSession();

export const getMyOrders = () => client.getMyOrders('cook');
export const getOrder = (id: string) => client.getOrder(id);
export const transitionOrder = (orderId: string, to: string) => client.transitionOrder(orderId, to);
export const getMessages = (orderId: string) => client.getMessages(orderId);
export const sendMessage = (orderId: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(orderId, body, from);
export const getCookListings = () => client.getCookListings();
export const createCookListing = (input: Record<string, unknown>) => client.createCookListing(input);
export const getEarnings = () => client.getEarnings();
export const getNotifications = () => client.getNotifications();
export const estimateCaloriesAI = (ingredients: unknown[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();
export const registerPushToken = (cookId: string, token: string) =>
  client.registerPushToken(token, { cookId, role: 'cook' });
export const getHeritageArchive = (cookId: string) => client.getHeritageArchive(cookId);
export const addHeritageEntry = (cookId: string, entry: Record<string, unknown>) =>
  client.addHeritageEntry(cookId, entry);
export const listOpenRequests = () => client.listOpenRequests();
export const createBid = (requestId: string, priceCents: number, message?: string) =>
  client.createBid(requestId, priceCents, message);
export const getBids = (requestId?: string) => client.getBids(requestId);
export const acceptBid = (bidId: string) => client.acceptBid(bidId);

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';