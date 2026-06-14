'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { searchProducts, getCookBySlug, getProduct, getSlots, addToCart, getCart, clearCart, createSHCError, getCredits, redeemCredits, estimateCaloriesAI, getPhotoTips } from './api-client';
import type { SHCErrorCode } from '@shc/types';

export function useProducts(query='', filters?: {occasion?:string; halal?:boolean; maxCal?:number; cuisine?:string}) {
  return useQuery({ queryKey:['products',query,filters], queryFn:()=>searchProducts(query,filters), staleTime:30000 });
}
export function useCook(slug:string) { return useQuery({queryKey:['cook',slug], queryFn:()=>getCookBySlug(slug)}); }
export function useProduct(id:string) { return useQuery({queryKey:['product',id], queryFn:()=>getProduct(id)}); }
export function useCollectionSlots(pid:string) { return useQuery({queryKey:['slots',pid], queryFn:()=>getSlots(pid)}); }

export function useAddToCart() {
  const qc=useQueryClient();
  return useMutation({ mutationFn:({productId,qty}:{productId:string;qty:number})=>addToCart(productId,qty),
    onSuccess:()=>qc.invalidateQueries({queryKey:['cart']}),
    onError:(e:any)=>{ if(e?.code) throw createSHCError(e.code as SHCErrorCode, e.message); } });
}
export function useCart() { return useQuery({queryKey:['cart'], queryFn:getCart, staleTime:5000}); }
export function useClearCart() {
  const qc=useQueryClient();
  return useMutation({mutationFn:clearCart, onSuccess:()=>qc.invalidateQueries({queryKey:['cart']})});
}

// Growth parity
export function useCredits() { return useQuery({queryKey:['credits'], queryFn:getCredits, staleTime:10000}); }
export function useRedeemCredits() {
  const qc=useQueryClient();
  return useMutation({ mutationFn:(amt:number)=>redeemCredits(amt), onSuccess:()=>{qc.invalidateQueries({queryKey:['credits']}); qc.invalidateQueries({queryKey:['cart']});} });
}
export function useAICalorieEstimate() { return useMutation({mutationFn:(ings:any[])=>estimateCaloriesAI(ings)}); }
export async function getPhotoTipsHook() { return getPhotoTips(); }

// Stubs for profile requests + notifications (parity)
export function useCreateRequest() { const qc=useQueryClient(); return useMutation({mutationFn: async (d:any)=>{const {createRequest}=await import('./api-client'); return createRequest(d);}, onSuccess:()=>qc.invalidateQueries({queryKey:['requests']})}); }
export function useNotifications() { return useQuery({queryKey:['notifs'], queryFn: async () => { const {getNotifications}=await import('./api-client'); return getNotifications(); }}); }

