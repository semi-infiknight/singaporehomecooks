// hooks/useProducts.ts
// Discovery, cook profile, product detail. Uses TanStack Query + mock client with rule data.
// Exports: useProducts (alias for discovery), useOrders (via companion), useCart, useChat (in useOrder)
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchProducts, getCookBySlug, getProduct, getSlots, addToCart, getCart, clearCart, createSHCError } from '../lib/api-client.js';
import type { SHCErrorCode } from '@shc/types';

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
    mutationFn: ({ productId, qty }: { productId: string; qty: number }) => addToCart(productId, qty),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cart'] });
    },
    onError: (err: any) => {
      // Surface SHCErrorCode for callers (e.g. one-cook, min-qty, allergen)
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message);
    },
  });
}

export function useCart() {
  return useQuery({ queryKey: ['cart'], queryFn: getCart, staleTime: 5000 });
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
  return useQuery({ queryKey: ['credits'], queryFn: async () => { const { getCredits } = await import('../lib/api-client.js'); return getCredits(); }, staleTime: 10000 });
}
export function useRedeemCredits() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (amount: number) => { const { redeemCredits } = await import('../lib/api-client.js'); return redeemCredits(amount); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['credits'] }); qc.invalidateQueries({ queryKey: ['cart'] }); },
  });
}
export function useAICalorieEstimate() {
  return useMutation({
    mutationFn: async (ingredients: any[]) => { const { estimateCaloriesAI } = await import('../lib/api-client.js'); return estimateCaloriesAI(ingredients); },
  });
}
export async function getPhotoTips() { const { getPhotoTips } = await import('../lib/api-client.js'); return getPhotoTips(); }

// Additional stubs for profile (prevents TS import error for growth hooks not yet in api-client; mock safe)
export function useCreateRequest() { const qc = useQueryClient(); return useMutation({ mutationFn: async (d: any) => d, onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }) }); }
export function useNotifications() { return useQuery({ queryKey: ['notifs'], queryFn: async () => [] }); }
