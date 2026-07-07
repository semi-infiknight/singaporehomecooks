'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { SHCOrderStatus } from '@shc/types';
import {
  createBid,
  createCookExpense,
  createCookListing,
  updateCookListing,
  deleteCookListing,
  getComplianceDocs,
  getCookEarnings,
  getCookListings,
  getCookOrder,
  getCookOrders,
  getCookOrderDisputes,
  getCookMessages,
  sendCookMessage,
  submitCookOrderDispute,
  isCookAuthenticated,
  listCookExpenses,
  listOpenRequests,
  submitComplianceDoc,
  transitionCookOrder,
} from './cook-api-client';
import { isActiveOrderStatus } from '@shc/utils';

export function useCookOrders() {
  return useQuery({
    queryKey: ['cook-orders'],
    queryFn: getCookOrders,
    enabled: isCookAuthenticated(),
    placeholderData: [],
    refetchInterval: (query) => {
      const list = (query.state.data as Array<{ shc_status?: string }>) || [];
      return list.some((o) => isActiveOrderStatus(String(o.shc_status || ''))) ? 8000 : false;
    },
  });
}

export function useCookOrder(id: string) {
  return useQuery({
    queryKey: ['cook-order', id],
    queryFn: () => getCookOrder(id),
    enabled: Boolean(id) && isCookAuthenticated(),
  });
}

export function useCookTransitionOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ orderId, to }: { orderId: string; to: SHCOrderStatus }) =>
      transitionCookOrder(orderId, to),
    onSuccess: (_, v) => {
      qc.invalidateQueries({ queryKey: ['cook-order', v.orderId] });
      qc.invalidateQueries({ queryKey: ['cook-orders'] });
    },
  });
}

export function useCookListings() {
  return useQuery({
    queryKey: ['cook-listings'],
    queryFn: getCookListings,
    enabled: isCookAuthenticated(),
    placeholderData: [],
  });
}

export function useCreateCookListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: createCookListing,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-listings'] }),
  });
}

export function useUpdateCookListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: Record<string, unknown> }) => updateCookListing(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-listings'] }),
  });
}

export function useDeleteCookListing() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteCookListing(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-listings'] }),
  });
}

export function useComplianceDocs() {
  return useQuery({
    queryKey: ['cook-compliance'],
    queryFn: getComplianceDocs,
    enabled: isCookAuthenticated(),
    placeholderData: [],
  });
}

export function useSubmitComplianceDoc() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: submitComplianceDoc,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-compliance'] }),
  });
}

export function useCookEarnings() {
  return useQuery({
    queryKey: ['cook-earnings'],
    queryFn: getCookEarnings,
    enabled: isCookAuthenticated(),
  });
}

export function useCookExpenses() {
  return useQuery({
    queryKey: ['cook-expenses'],
    queryFn: listCookExpenses,
    enabled: isCookAuthenticated(),
  });
}

export function useCreateCookExpense() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { amount_cents: number; category: string; receipt_key?: string; date: string }) =>
      createCookExpense(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-expenses'] }),
  });
}

export function useOpenRequests() {
  return useQuery({
    queryKey: ['cook-open-requests'],
    queryFn: listOpenRequests,
    enabled: isCookAuthenticated(),
    placeholderData: [],
  });
}

export function useCreateBid() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, priceCents, message }: { requestId: string; priceCents: number; message?: string }) =>
      createBid(requestId, priceCents, message),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-open-requests'] }),
  });
}

export function useCookOrderDisputes(orderId: string) {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['cook-order-disputes', orderId],
    queryFn: () => getCookOrderDisputes(orderId),
    enabled: Boolean(orderId) && isCookAuthenticated(),
    placeholderData: [],
  });
  const submit = useMutation({
    mutationFn: (notes: string) => submitCookOrderDispute(orderId, { type: 'other', notes }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-order-disputes', orderId] }),
  });
  return { disputes: query.data || [], submit, isLoading: query.isLoading };
}

export function useCookOrderChat(orderId: string) {
  const qc = useQueryClient();
  const msgs = useQuery({
    queryKey: ['cook-chat', orderId],
    queryFn: () => getCookMessages(orderId),
    enabled: Boolean(orderId) && isCookAuthenticated(),
    refetchInterval: 4500,
  });
  const send = useMutation({
    mutationFn: ({ body }: { body: string }) => sendCookMessage(orderId, body, 'cook'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['cook-chat', orderId] }),
  });
  return { messages: msgs.data || [], send: send.mutate, isLoading: msgs.isLoading };
}