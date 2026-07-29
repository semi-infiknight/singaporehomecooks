import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { transitionOrder, getOrder, getMyOrders, getMessages, sendMessage, createSHCError } from '../lib/api-client';
import { SHCOrderStatus } from '@shc/types';
import type { SHCErrorCode } from '@shc/types';

export function useOrders() {
  return useQuery({ queryKey: ['orders', 'cook'], queryFn: () => getMyOrders() });
}

export const useMyOrders = useOrders;

export function useTransitionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: SHCOrderStatus }) => transitionOrder(orderId, to),
    onSuccess: (_res, vars) => {
      qc.invalidateQueries({ queryKey: ['order', vars.orderId] });
      qc.invalidateQueries({ queryKey: ['orders'] });
      qc.invalidateQueries({ queryKey: ['cook-earnings'] });
    },
    onError: (err: { code?: string; message?: string }) => {
      if (err?.code) throw createSHCError(err.code as SHCErrorCode, err.message || 'Transition blocked');
    },
  });
}

export function useOrder(id: string) {
  return useQuery({ queryKey: ['order', id], queryFn: () => getOrder(id), enabled: !!id });
}

export function useChat(orderId: string) {
  const qc = useQueryClient();
  const messagesQ = useQuery({
    queryKey: ['chat', orderId],
    queryFn: () => getMessages(orderId),
    refetchInterval: 4500,
  });

  const send = useMutation({
    mutationFn: ({ body, from }: { body: string; from: 'customer' | 'cook' }) => sendMessage(orderId, body, from),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['chat', orderId] }),
  });

  return { messages: messagesQ.data || [], send: send.mutate, isLoading: messagesQ.isLoading, refetch: messagesQ.refetch };
}

export const useOrderChat = useChat;

export function useRequests() {
  return useQuery({
    queryKey: ['requests'],
    queryFn: async () => {
      const { listOpenRequests } = await import('../lib/api-client');
      return listOpenRequests();
    },
  });
}

export function useBids(requestId?: string) {
  return useQuery({
    queryKey: ['bids', requestId],
    queryFn: async () => {
      const { getBids } = await import('../lib/api-client');
      return getBids(requestId);
    },
  });
}

export function useCreateBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ requestId, priceCents, message }: { requestId: string; priceCents: number; message?: string }) => {
      const { createBid } = await import('../lib/api-client');
      return createBid(requestId, priceCents, message);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['requests'] });
    },
  });
}

export function useAcceptBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (bidId: string) => {
      const { acceptBid } = await import('../lib/api-client');
      return acceptBid(bidId);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['bids'] });
      qc.invalidateQueries({ queryKey: ['orders'] });
    },
  });
}

export function useComplianceDocs() {
  return useQuery({
    queryKey: ['cook-compliance'],
    queryFn: async () => {
      const { getComplianceDocs } = await import('../lib/api-client');
      return getComplianceDocs();
    },
  });
}

export function useCookNotifications() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['notifications', 'cook'],
    queryFn: async () => {
      const { getNotifications } = await import('../lib/api-client');
      return getNotifications('cook');
    },
    refetchInterval: 8000,
  });
  const markRead = useMutation({
    mutationFn: async (opts: { ids?: string[]; all?: boolean } = {}) => {
      const { markNotificationsRead } = await import('../lib/api-client');
      await markNotificationsRead(opts.ids, !!opts.all, 'cook');
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'cook'] }),
  });
  return { ...query, markRead: markRead.mutate, markReadAsync: markRead.mutateAsync };
}

/** @deprecated use useCookNotifications */
export const useNotifications = useCookNotifications;