'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkout, transitionOrder, getOrder, getMyOrders, getMessages, sendMessage, checkoutWithCredits, createSHCError } from './api-client';
import type { SHCErrorCode } from '@shc/types';
import { SHCOrderStatus } from '@shc/types';

export function useOrders() { return useQuery({queryKey:['orders','customer'], queryFn:()=>getMyOrders()}); }
export const useMyOrders = useOrders;

export function useCheckout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({allergenAck, collection, pdpaConsent, creditsToApply=0, isCorporate=false}: any) => 
      creditsToApply || isCorporate ? checkoutWithCredits(allergenAck, collection, creditsToApply, isCorporate) : checkout(allergenAck, collection, pdpaConsent ?? true),
    onSuccess: (data:any) => { qc.invalidateQueries({queryKey:['orders']}); qc.invalidateQueries({queryKey:['cart']}); if(data?.order?.id) qc.setQueryData(['order',data.order.id], data.order); },
    onError:(err:any)=>{ if(err?.code) throw createSHCError(err.code as SHCErrorCode, err.message||'Checkout violation'); }
  });
}
export function useTransitionOrder() {
  const qc=useQueryClient();
  return useMutation({ mutationFn:({orderId,to}:{orderId:string;to:SHCOrderStatus})=>transitionOrder(orderId,to),
    onSuccess:(_ ,v)=> { qc.invalidateQueries({queryKey:['order',v.orderId]}); qc.invalidateQueries({queryKey:['orders']}); },
    onError:(e:any)=>{if(e?.code) throw createSHCError(e.code as SHCErrorCode,e.message||'Transition blocked');}
  });
}
export function useOrder(id:string) { return useQuery({queryKey:['order',id], queryFn:()=>getOrder(id), enabled:!!id}); }

export function useChat(orderId:string) {
  const qc=useQueryClient();
  const msgs = useQuery({queryKey:['chat',orderId], queryFn:()=>getMessages(orderId), refetchInterval:4500});
  const send = useMutation({ mutationFn:({body,from}:{body:string;from:'customer'|'cook'})=>sendMessage(orderId,body,from), onSuccess:()=>qc.invalidateQueries({queryKey:['chat',orderId]}), onError:(e:any)=>{if(e?.code)throw createSHCError(e.code as SHCErrorCode,e.message);} });
  return { messages: msgs.data||[], send: send.mutate, isLoading:msgs.isLoading };
}
export const useOrderChat = useChat;

// Stubs for collab/requests (parity with mobile hooks)
export function useRequests() { return useQuery({queryKey:['requests'], queryFn: async () => { const {listOpenRequests} = await import('./api-client'); return listOpenRequests(); }}); }
export function useBids(reqId?:string) { return useQuery({queryKey:['bids',reqId], queryFn: async () => { const {getBids} = await import('./api-client'); return getBids(reqId); }}); }
export function useCreateBid() { const qc=useQueryClient(); return useMutation({mutationFn: async (d:any)=>{const {createBid}=await import('./api-client'); return createBid(d.requestId,d.priceCents,d.message);}, onSuccess:()=>qc.invalidateQueries({queryKey:['bids']})}); }
export function useAcceptBid() { const qc=useQueryClient(); return useMutation({mutationFn: async (bidId:string)=>{const {acceptBid}=await import('./api-client'); return acceptBid(bidId);}, onSuccess:()=> {qc.invalidateQueries({queryKey:['bids']}); qc.invalidateQueries({queryKey:['orders']}); }}); }
export function useNotifications() { return useQuery({queryKey:['notifs'], queryFn: async () => { const {getNotifications}=await import('./api-client'); return getNotifications(); }}); }

