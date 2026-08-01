// hooks/useProducts.ts
// Discovery, cook profile, product detail. Uses TanStack Query + mock client with rule data.
// Exports: useProducts (alias for discovery), useOrders (via companion), useCart, useChat (in useOrder)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Alert } from 'react-native';
import { useRouter } from 'expo-router';
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
  isAuthenticated,
  hydrateSession,
  ensureGuestSession,
} from '../lib/api-client';
import type { SHCErrorCode } from '@shc/types';
import { useAuth } from './useAuth';

export function useProducts(query = '', filters?: { occasion?: string; halal?: boolean; maxCal?: number; cuisine?: string; minPrice?: number }) {
  // Primary useProducts hook per Integration spec (wraps search + filters including calorie)
  // Observability stub: perf + console for hooks (later pino + Railway metrics)
  if (typeof performance !== 'undefined' && (performance as any).mark) (performance as any).mark('shc_useProducts_query_start');
  console.debug?.('[OBS] useProducts query', { query, filters });
  return useQuery({
    queryKey: ['products', query, filters],
    queryFn: () => searchProducts(query, filters),
    staleTime: 1000 * 30,
  });
}

// Backward compat alias for existing screens
export const useDiscovery = useProducts;

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

export function useCollectionSlots(productId: string) {
  return useQuery({ queryKey: ['slots', productId], queryFn: () => getSlots(productId) });
}

export function useAddToCart(options?: { silent?: boolean }) {
  const qc = useQueryClient();
  const router = useRouter();
  const silent = options?.silent ?? false;

  return useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      await hydrateSession();
      return addToCart(productId, qty);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      if (silent) return;
      const count = (cart?.items || []).reduce((s: number, i: any) => s + Number(i.qty || 0), 0);
      Alert.alert(
        'Added to cart',
        count > 0 ? `${count} item${count === 1 ? '' : 's'} in your cart.` : 'Item added to cart.',
        [
          { text: 'Continue', style: 'cancel' },
          { text: 'View cart', onPress: () => router.push('/(customer)/cart' as any) },
        ]
      );
    },
    onError: (err: any) => {
      const message = err?.message || 'Could not add to cart. Try again.';
      if (!silent) {
        Alert.alert('Could not add', message);
      }
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

export function useCart() {
  const { loading } = useAuth();
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      await hydrateSession();
      await ensureGuestSession();
      return getCart();
    },
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: !loading,
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

export function useUpdateCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      await hydrateSession();
      return updateCartItem(productId, qty);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      const message = err?.message || 'Could not update cart.';
      Alert.alert('Could not update', message);
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

export function useRemoveCartItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (productId: string) => {
      await hydrateSession();
      return removeCartItem(productId);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      const message = err?.message || 'Could not remove item.';
      Alert.alert('Could not remove', message);
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, message);
    },
  });
}

export function useAICalorieEstimate() {
  return useMutation({
    mutationFn: async (ingredients: any[]) => { const { estimateCaloriesAI } = await import('../lib/api-client'); return estimateCaloriesAI(ingredients); },
  });
}
export async function getPhotoTips() { const { getPhotoTips } = await import('../lib/api-client'); return getPhotoTips(); }

// Growth hooks live in hooks/useOrder.ts — import from there to avoid stub regressions.
