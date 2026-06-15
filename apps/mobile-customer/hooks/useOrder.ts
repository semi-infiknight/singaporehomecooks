// hooks/useOrder.ts
// Full order flows: checkout, status transitions (enforce state machine), chat polling, customer/cook lists.
// All via typed contracts + business-rules. useOrders / useChat per spec.
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { checkout, transitionOrder, getOrder, getMyOrders, getMessages, sendMessage, getCart, clearCart, createSHCError } from '../lib/api-client.js';
import { SHCOrderStatus } from '@shc/types';
import type { SHCErrorCode } from '@shc/types';

// useOrders (customer or cook) - primary export per Integration task
export function useOrders(role: 'customer' | 'cook' = 'customer') {
  return useQuery({ queryKey: ['orders', role], queryFn: () => getMyOrders() });
}

// Alias for compat
export const useMyOrders = useOrders;

export function useCheckout() {
  const qc = useQueryClient();
  // Observability stub
  if (typeof performance !== 'undefined' && (performance as any).mark) (performance as any).mark('shc_checkout_mut_start');
  console.debug?.('[OBS] useCheckout mutation');
  return useMutation({
    mutationFn: ({ allergenAck, collection, pdpaConsent }: { allergenAck: boolean; collection: { date: string; slot: string }; pdpaConsent?: boolean }) => checkout(allergenAck, collection, pdpaConsent ?? true),
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['cart'] });
      if (data?.order?.id) qc.setQueryData(['order', data.order.id], data.order);
    },
    onError: (err: any) => {
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message || 'Checkout rule violation');
    },
  });
}

export function useTransitionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: SHCOrderStatus }) => transitionOrder(orderId, to),
    onSuccess: (res, vars) => {
      if (res?.error) return; // caller handles SHCErrorCode display (e.g. invalid transition)
      qc.invalidateQueries({ queryKey: ['order', vars.orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
    onError: (err: any) => {
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message || 'Order state transition blocked by rules');
    },
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => getOrder(id), enabled: !!id });
}

// useChat per task spec (order-scoped chat)
export function useChat(orderId: string) {
  const qc = useQueryClient();
  const messagesQ = useQuery({
    queryKey: ['chat', orderId],
    queryFn: () => getMessages(orderId),
    refetchInterval: 4500, // polling per 10-mobile.md + phase-5 (real ws later)
  });

  const send = useMutation({
    mutationFn: ({ body, from }: { body: string; from: 'customer' | 'cook' }) => sendMessage(orderId, body, from),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', orderId] }),
    onError: (err: any) => {
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message);
    },
  });

  return { messages: messagesQ.data || [], send: send.mutate, isLoading: messagesQ.isLoading, refetch: messagesQ.refetch };
}

// Alias for compat with existing chat screen
export const useOrderChat = useChat;

export function useClearCart() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: clearCart, onSuccess: () => qc.invalidateQueries({ queryKey: ['cart'] }) });
}

// Phase 7-9: useRequests/useBids/useAcceptBid (collab board + request dish E2E Phase8), useNotifications (in-app bell from order/credit/req states Phase7). Appended to existing (no new files). Hooks use TanStack + SHCError ready.
export function useRequests() {
  return useQuery({ queryKey: ['requests'], queryFn: async () => { const { listOpenRequests } = await import('../lib/api-client.js'); return listOpenRequests(); } });
}
export function useCreateRequest() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: any) => { const { createRequest } = await import('../lib/api-client.js'); return createRequest(input); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['requests'] }),
  });
}
export function useBids(requestId?: string) {
  return useQuery({ queryKey: ['bids', requestId], queryFn: async () => { const { getBids } = await import('../lib/api-client.js'); return getBids(requestId); } });
}
export function useCreateBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, priceCents, message }: { requestId: string; priceCents: number; message?: string }) => { const { createBid } = await import('../lib/api-client.js'); return createBid(requestId, priceCents, message); },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bids'] }),
  });
}
export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => { const { acceptBid } = await import('../lib/api-client.js'); return acceptBid(bidId); },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['bids'] }); qc.invalidateQueries({ queryKey: ['orders'] }); qc.invalidateQueries({ queryKey: ['requests'] }); },
  });
}
export function useNotifications() {
  return useQuery({ queryKey: ['notifications'], queryFn: async () => { const { getNotifications } = await import('../lib/api-client.js'); return getNotifications(); }, refetchInterval: 8000 });
}
