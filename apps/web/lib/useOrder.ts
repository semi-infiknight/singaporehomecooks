'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  checkout,
  transitionOrder,
  getOrder,
  getMyOrders,
  getMessages,
  sendMessage,
  checkoutWithCredits,
  getReview,
  getOrderDisputes,
  submitReview,
  submitOrderDispute,
  createSHCError,
  isAuthenticated,
} from './api-client';
import type { SHCErrorCode } from '@shc/types';
import { SHCOrderStatus } from '@shc/types';
import { isActiveOrderStatus } from '@shc/utils';

export function useOrders() {
  return useQuery({
    queryKey: ['orders', 'customer'],
    queryFn: () => getMyOrders(),
    enabled: isAuthenticated(),
    placeholderData: [],
    refetchInterval: (query) => {
      const list = (query.state.data as Array<{ shc_status?: string }>) || [];
      return list.some((o) => isActiveOrderStatus(String(o.shc_status || ''))) ? 8000 : false;
    },
  });
}
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
export function useOrder(id: string) {
  return useQuery({
    queryKey: ['order', id],
    queryFn: () => getOrder(id),
    enabled: !!id,
    refetchInterval: (query) => {
      const status = String((query.state.data as { shc_status?: string })?.shc_status || '');
      return isActiveOrderStatus(status) ? 5000 : false;
    },
  });
}

export function useChat(orderId:string) {
  const qc=useQueryClient();
  const msgs = useQuery({queryKey:['chat',orderId], queryFn:()=>getMessages(orderId), refetchInterval:4500});
  const send = useMutation({ mutationFn:({body,from}:{body:string;from:'customer'|'cook'})=>sendMessage(orderId,body,from), onSuccess:()=>qc.invalidateQueries({queryKey:['chat',orderId]}), onError:(e:any)=>{if(e?.code)throw createSHCError(e.code as SHCErrorCode,e.message);} });
  return { messages: msgs.data||[], send: send.mutate, isLoading:msgs.isLoading };
}
export const useOrderChat = useChat;

// Collab / requests (parity with mobile hooks)
export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { listOpenRequests } = await import('./api-client');
      return listOpenRequests();
    },
  });
}
export function useMyRequests() {
  return useQuery({
    queryKey: ['my-requests'],
    queryFn: async () => {
      const { listMyRequests } = await import('./api-client');
      return listMyRequests();
    },
    enabled: isAuthenticated(),
    placeholderData: [],
  });
}
export function useBids(reqId?: string) {
  return useQuery({
    queryKey: ['bids', reqId],
    queryFn: async () => {
      const { getBids } = await import('./api-client');
      return getBids(reqId);
    },
    enabled: Boolean(reqId),
  });
}
export function useCreateBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: { requestId: string; priceCents: number; message?: string }) => {
      const { createBid } = await import('./api-client');
      return createBid(d.requestId, d.priceCents, d.message);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bids'] }),
  });
}
export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const { acceptBid } = await import('./api-client');
      return acceptBid(bidId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['my-requests'] });
    },
  });
}
export function useNotifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const { getNotifications } = await import('./api-client');
      return getNotifications();
    },
    enabled: isAuthenticated(),
    placeholderData: [],
    refetchInterval: isAuthenticated() ? 8000 : false,
  });
  const markRead = useMutation({
    mutationFn: async (opts: { ids?: string[]; all?: boolean } = {}) => {
      const { markNotificationsRead } = await import('./api-client');
      await markNotificationsRead(opts.ids, !!opts.all);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
  return { ...query, markRead: markRead.mutate, markReadAsync: markRead.mutateAsync };
}

export function useReview(orderId: string) {
  const qc = useQueryClient();
  const reviewQ = useQuery({
    queryKey: ['review', orderId],
    queryFn: () => getReview(orderId),
    enabled: !!orderId,
  });
  const submit = useMutation({
    mutationFn: ({ rating, body }: { rating: number; body?: string }) => submitReview(orderId, rating, body),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['review', orderId] }),
  });
  return { review: reviewQ.data, submit, isLoading: reviewQ.isLoading };
}

export function useOrderDisputes(orderId: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['order-disputes', orderId],
    queryFn: () => getOrderDisputes(orderId),
    enabled: !!orderId && isAuthenticated(),
    placeholderData: [],
  });
  const submit = useMutation({
    mutationFn: ({ type = 'other', notes }: { type?: string; notes: string }) =>
      submitOrderDispute(orderId, { type, notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['order-disputes', orderId] }),
  });
  return { disputes: query.data || [], submit, isLoading: query.isLoading };
}

