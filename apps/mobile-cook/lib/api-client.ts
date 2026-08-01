/** AGENT: Cook runtime client — Railway only. appRole cook. blueprint/agent/build-protocol.md */
import { createShcApiClient } from '@shc/api-client';
import { resolveRailwayMedusaBase, resolveRailwayPublishableKey } from '@shc/utils';
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'shc_cook_token';
const USER_KEY = 'shc_cook_user';

let accessToken: string | null = null;

export const client = createShcApiClient({
  medusaBase: resolveRailwayMedusaBase(process.env.EXPO_PUBLIC_MEDUSA_BASE),
  publishableKey: resolveRailwayPublishableKey(process.env.EXPO_PUBLIC_MEDUSA_PUBLISHABLE_KEY),
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
  if (!token) return null;

  accessToken = token;
  let cached: ReturnType<typeof client.getCurrentUser> = null;
  if (userRaw) {
    try {
      cached = JSON.parse(userRaw);
      if (cached) client.setCurrentUser(cached);
    } catch {
      cached = null;
    }
  }

  try {
    const user = await client.getMe();
    await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
    return user;
  } catch (e: any) {
    const status = e?.status ?? e?.statusCode;
    const msg = String(e?.message || e || '');
    // Only wipe session on real auth failure — keep cached user on network blips
    // (clearing here caused login↔dashboard refresh loops when getMe timed out).
    const unauthorized =
      status === 401 ||
      status === 403 ||
      /unauthorized|invalid token|jwt|not authenticated/i.test(msg);
    if (unauthorized) {
      await clearSession();
      return null;
    }
    if (cached) return cached;
    return null;
  }
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
export const sendCookRegisterWhatsappOtp = (mobile: string) => client.sendCookRegisterWhatsappOtp(mobile);
export const getCookRegisterWhatsappVerifyStatus = (mobile: string) =>
  client.getCookRegisterWhatsappVerifyStatus(mobile);
export const register = (
  email: string,
  password: string,
  mobile: string,
  whatsapp_otp: string,
  display_name?: string,
  area?: string,
  story?: string
) => client.registerCook(email, password, mobile, whatsapp_otp, display_name, area, story);
export const updateCookProfile = (input: {
  display_name?: string;
  area?: string;
  story?: string;
  collection_address?: string;
  collection_instructions?: string;
  collection_time_slots?: string[];
  availability_paused?: boolean;
  avatar_url?: string;
  hero_image_url?: string;
  pdpa_consent?: boolean;
  terms_consent?: boolean;
  paynow_mobile?: string;
  paynow_uen?: string;
  payout_legal_name?: string;
  contact_mobile?: string;
  whatsapp_number?: string;
  responsible_person_name?: string;
  nric_fin_last4?: string;
  alternate_contact?: string;
  kitchen_halal_certified?: boolean | null;
  onboarding_completed_at?: string;
}) => client.updateCookProfile(input);
export const sendCookEmailVerify = () => client.sendCookEmailVerify();
export const confirmCookEmail = (code: string) => client.confirmCookEmail(code);
export const sendCookMobileVerify = (mobile: string) => client.sendCookMobileVerify(mobile);
export const confirmCookMobile = (code: string, mobile?: string) => client.confirmCookMobile(code, mobile);
export const getCookProfile = () => client.getCookProfile();
export const getMe = () => client.getMe();
export const getCurrentUser = () => client.getCurrentUser();
export const logout = () => clearSession();

export const getMyOrders = () => client.getMyOrders('cook');
export const getOrder = (id: string) => client.getOrder(id);
export const getOrderInvoiceDownloadUrl = (id: string) => client.getOrderInvoiceDownloadUrl(id);
export const transitionOrder = (orderId: string, to: string) => client.transitionOrder(orderId, to);
export const getOrderDisputes = (orderId: string) => client.getOrderDisputes(orderId);
export const submitOrderDispute = (orderId: string, input: { type?: string; notes: string }) =>
  client.submitOrderDispute(orderId, input);
export const getMessages = (orderId: string) => client.getMessages(orderId);
export const sendMessage = (orderId: string, body: string, from: 'customer' | 'cook') =>
  client.sendMessage(orderId, body, from);
export const getCookListings = () => client.getCookListings();
export const createCookListing = (input: Record<string, unknown>) => client.createCookListing(input);
export const updateCookListing = (id: string, input: Record<string, unknown>) => client.updateCookListing(id, input);
export const deleteCookListing = (id: string) => client.deleteCookListing(id);
export const getComplianceDocs = () => client.getComplianceDocs();
export const submitComplianceDoc = (input: { type: 'sfa' | 'wsq' | 'halal'; file_key: string; expiry_date?: string }) =>
  client.submitComplianceDoc(input);
export const getEarnings = () => client.getEarnings();
export const getCookPayoutHistory = () => client.getCookPayoutHistory();
export const getNotifications = (role: 'cook' | 'customer' = 'cook') => client.getNotifications({ role });
export const markNotificationsRead = (ids?: string[], all = false, role: 'cook' | 'customer' = 'cook') =>
  client.markNotificationsRead?.(ids, all, role) || Promise.resolve({ success: true });
export const estimateCaloriesAI = (ingredients: unknown[]) => client.estimateCaloriesAI(ingredients);
export const getPhotoTips = () => client.getPhotoTips();
export const generateListingImage = (input: {
  mode: 'generate' | 'enhance';
  dish_name: string;
  cuisine?: string;
  image_base64?: string;
  ai_restyle?: boolean;
  enhance_style?: 'polish' | 'restyle';
}) => client.generateListingImage(input);
export const getAiImageStatus = () => client.getAiImageStatus();
export const registerPushToken = (cookId: string, token: string) =>
  client.registerPushToken(token, { cookId, role: 'cook' });
export const listOpenRequests = () => client.listOpenRequests();
export const createBid = (
  requestId: string,
  priceCents: number,
  message?: string,
  lineItems?: Array<{ request_line_id: string; included: boolean; servings?: number; price_cents: number }>
) => client.createBid(requestId, priceCents, message, lineItems);
export const listMyDrops = () => client.listDrops({ mine: true });
export const createDrop = (input: Record<string, unknown>) => client.createDrop(input);
export const patchDrop = (id: string, input: Record<string, unknown>) => client.patchDrop(id, input);
export const getBids = (requestId?: string) => client.getBids(requestId);
export const listMyBids = () => client.listMyBids();
export const acceptBid = (
  bidId: string,
  opts?: { collection_date?: string; collection_slot?: string; accepted_line_ids?: string[] }
) => client.acceptBid(bidId, opts);
export const getUploadUrl = (objectName: string, resourceOwner?: string, options?: any) => client.getUploadUrl(objectName, resourceOwner, options);
export const listCookExpenses = () => client.listCookExpenses();
export const createCookExpense = (input: { amount_cents: number; category: string; receipt_key?: string; date: string }) =>
  client.createCookExpense(input);

export const getTiffinCookConfig = () => client.getTiffinCookConfig();
export const updateTiffinCookConfig = (input: Parameters<typeof client.updateTiffinCookConfig>[0]) =>
  client.updateTiffinCookConfig(input);
export const kitchenCancelTiffinDay = (collectionDate: string, reason?: string) =>
  client.kitchenCancelTiffinDay(collectionDate, reason);
export const publishTiffinDayMenu = (collectionDate: string, productIds: string[], note?: string) =>
  client.publishTiffinDayMenu(collectionDate, productIds, note);
export const getTiffinDayMenu = (date: string) => client.getTiffinDayMenu(date);
export const getCookConfig = () => client.getCookConfig();

// Full server upload helper (sends base64 for server to upload to MinIO)
export async function uploadImageToServer(imageBase64: string, objectName: string, cookId: string, contentType = 'image/jpeg') {
  return client.getUploadUrl(objectName, cookId, {
    mode: 'server',
    fileData: imageBase64,
    contentType,
  });
}

export { createSHCError } from '@shc/types';
export type { SHCError, SHCErrorCode } from '@shc/types';