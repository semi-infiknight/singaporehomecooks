// hooks/useProducts.ts
// Discovery, cook profile, product detail. Uses TanStack Query + mock client with rule data.
// Exports: useProducts (alias for discovery), useOrders (via companion), useCart, useChat (in useOrder)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  searchProducts,
  getCookBySlug,
  getProduct,
  getSlots,
  addToCart,
  getCart,
  clearCart,
  createSHCError,
  isAuthenticated,
  hydrateSession,
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

export function useProduct(id: string) {
  return useQuery({ queryKey: ['product', id], queryFn: () => getProduct(id) });
}

export function useCollectionSlots(productId: string) {
  return useQuery({ queryKey: ['slots', productId], queryFn: () => getSlots(productId) });
}

export function useAddToCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, qty }: { productId: string; qty: number }) => {
      await hydrateSession();
      return addToCart(productId, qty);
    },
    onSuccess: (cart) => {
      qc.setQueryData(['cart'], cart);
    },
    onError: (err: any) => {
      // Surface SHCErrorCode for callers (e.g. one-cook, min-qty, allergen)
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message);
    },
  });
}

export function useCart() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      await hydrateSession();
      return getCart();
    },
    staleTime: 0,
    refetchOnMount: 'always',
    enabled: (!!user || isAuthenticated()) && !loading,
  });
}

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: clearCart,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }),
  });
}

// Phase 7-9 hooks (appended to existing per ownership/no-new-file + TanStack): useCredits (wallet/earn/redeem), useAICalorieEstimate for wizard, photo tips. Growth features delightful & SG-specific (Raya credits, HDB feasts).
export function useCredits() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['credits'],
    queryFn: async () => {
      const { getCredits } = await import('../lib/api-client');
      return getCredits();
    },
    staleTime: 10000,
    enabled: (!!user || isAuthenticated()) && !loading,
    placeholderData: { balance: 0, tier: 'Bronze' },
  });
}
export function useRedeemCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => { const { redeemCredits } = await import('../lib/api-client'); return redeemCredits(amount); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['cart'] }); },
  });
}
export function useAICalorieEstimate() {
  return useMutation({
    mutationFn: async (ingredients: any[]) => { const { estimateCaloriesAI } = await import('../lib/api-client'); return estimateCaloriesAI(ingredients); },
  });
}
export async function getPhotoTips() { const { getPhotoTips } = await import('../lib/api-client'); return getPhotoTips(); }

// Growth hooks live in hooks/useOrder.ts — import from there to avoid stub regressions.
