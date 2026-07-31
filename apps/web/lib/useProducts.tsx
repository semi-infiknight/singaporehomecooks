'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import {
  searchProducts,
  getCookBySlug,
  getCookReviews,
  getProduct,
  getSlots,
  addToCart,
  getCart,
  clearCart,
  updateCartItem,
  removeCartItem,
  createSHCError,
  estimateCaloriesAI,
  getPhotoTips,
  isAuthenticated,
  hydrateSession,
} from './api-client';
import type { SHCErrorCode } from '@shc/types';
import { SHCTrayActionWeb, useSHCTrayWeb } from '../app/components/SHCWebComponents';

export function useProducts(query = '', filters?: { occasion?: string; halal?: boolean; maxCal?: number; cuisine?: string }) {
  return useQuery({ queryKey: ['products', query, filters], queryFn: () => searchProducts(query, filters), staleTime: 30000 });
}
export function useCook(slug: string) {
  return useQuery({ queryKey: ['cook', slug], queryFn: () => getCookBySlug(slug) });
}
export function useCookReviews(slug: string, opts?: { limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['cook-reviews', slug, opts?.limit, opts?.offset],
    queryFn: () => getCookReviews(slug, opts),
    enabled: Boolean(slug),
    staleTime: 60_000,
  });
}
export function useProduct(id: string) {
  return useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id) });
}
export function useCollectionSlots(pid: string) {
  return useQuery({ queryKey: ['slots', pid], queryFn: () => getSlots(pid) });
}

export function useAddToCart(options?: { silent?: boolean }) {
  const qc = useQueryClient();
  const router = useRouter();
  const { openTray, dismiss } = useSHCTrayWeb();
  const silent = options?.silent ?? false;

  return useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      await hydrateSession();
      return addToCart(productId, qty);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['cart'] });
      if (silent) return;
      const count = (cart?.items || []).reduce((s: number, i: { qty?: number }) => s + Number(i.qty || 0), 0);
      openTray(
        { id: 'add-to-cart', title: 'Added to cart', height: 'compact' },
        <SHCTrayActionWeb
          message={count > 0 ? `${count} item${count === 1 ? '' : 's'} in your cart.` : 'Item added to cart.'}
          primaryLabel="View cart"
          onPrimary={() => {
            dismiss();
            router.push('/cart');
          }}
          secondaryLabel="Continue"
          onSecondary={dismiss}
          testID="add-to-cart-tray-web"
        />
      );
    },
    onError: (err: { message?: string; code?: string }) => {
      const message = err?.message || 'Could not add to cart. Try again.';
      if (!silent) {
        openTray(
          { id: 'add-to-cart-error', title: 'Could not add', height: 'compact' },
          <SHCTrayActionWeb
            message={message}
            primaryLabel="OK"
            onPrimary={dismiss}
            testID="add-to-cart-error-tray-web"
          />
        );
      }
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

const EMPTY_CART = { items: [] as { qty: number; price: number }[], cookId: null as string | null };

export function useCart() {
  return useQuery({
    queryKey: ['cart'],
    queryFn: getCart,
    staleTime: 5000,
    enabled: isAuthenticated(),
    placeholderData: EMPTY_CART,
  });
}
export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: clearCart, onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }) });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  const { openTray, dismiss } = useSHCTrayWeb();
  return useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      await hydrateSession();
      return updateCartItem(productId, qty);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: { message?: string; code?: string }) => {
      const message = err?.message || 'Could not update cart.';
      openTray(
        { id: 'cart-update-error', title: 'Could not update', height: 'compact' },
        <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="cart-update-error-tray" />
      );
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  const { openTray, dismiss } = useSHCTrayWeb();
  return useMutation({
    mutationFn: async (productId: string) => {
      await hydrateSession();
      return removeCartItem(productId);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: { message?: string; code?: string }) => {
      const message = err?.message || 'Could not remove item.';
      openTray(
        { id: 'cart-remove-error', title: 'Could not remove', height: 'compact' },
        <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="cart-remove-error-tray" />
      );
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

export function useAICalorieEstimate() {
  return useMutation({ mutationFn: (ings: unknown[]) => estimateCaloriesAI(ings) });
}
export async function getPhotoTipsHook() {
  return getPhotoTips();
}

export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Record<string, unknown>) => {
      const { createRequest } = await import('./api-client');
      return createRequest(d);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}
export function useNotifications() {
  return useQuery({
    queryKey: ['notifs'],
    queryFn: async () => {
      const { getNotifications } = await import('./api-client');
      return getNotifications();
    },
  });
}
