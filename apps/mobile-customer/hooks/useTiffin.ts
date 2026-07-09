import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTiffinKitchens,
  getTiffinKitchen,
  getTiffinSubscription,
  subscribeTiffin,
  cancelTiffinSubscription,
  cancelTiffinSubscriptionWithReason,
  pauseTiffinSubscription,
  resumeTiffinSubscription,
  rechargeTiffinSubscription,
  getTiffinMealOrders,
  skipTiffinMeal,
  customizeTiffinMeal,
  updateTiffinSubscriptionNotes,
  saveTiffinWeeklyPlan,
  saveTiffinNextWeekPlan,
  hydrateSession,
  isAuthenticated,
} from '../lib/api-client';
import { useAuth } from './useAuth';

export function useTiffinKitchens() {
  return useQuery({
    queryKey: ['tiffin', 'kitchens'],
    queryFn: getTiffinKitchens,
    staleTime: 30_000,
  });
}

export function useTiffinKitchen(cookId: string) {
  return useQuery({
    queryKey: ['tiffin', 'kitchen', cookId],
    queryFn: () => getTiffinKitchen(cookId),
    enabled: !!cookId,
  });
}

export function useTiffinSubscription() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['tiffin', 'subscription'],
    queryFn: async () => {
      await hydrateSession();
      return getTiffinSubscription();
    },
    enabled: (!!user || isAuthenticated()) && !loading,
  });
}

export function useTiffinMealOrders(from?: string, to?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['tiffin', 'meals', from, to],
    queryFn: async () => {
      await hydrateSession();
      return getTiffinMealOrders(from, to);
    },
    enabled: (!!user || isAuthenticated()) && !loading,
  });
}

export function useSubscribeTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      cookId,
      mealsPerWeek,
      weeks,
    }: {
      cookId: string;
      mealsPerWeek: 2 | 3 | 4;
      weeks?: number;
    }) => {
      await hydrateSession();
      return subscribeTiffin(cookId, mealsPerWeek, weeks);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useCancelTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      await hydrateSession();
      if (reason) return cancelTiffinSubscriptionWithReason(reason);
      return cancelTiffinSubscription();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function usePauseTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number) => {
      await hydrateSession();
      return pauseTiffinSubscription(days);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useResumeTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await hydrateSession();
      return resumeTiffinSubscription();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useRechargeTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: number | { weeks: number; paynowRef?: string }) => {
      await hydrateSession();
      const weeks = typeof input === 'number' ? input : input.weeks;
      const paynowRef = typeof input === 'number' ? undefined : input.paynowRef;
      return rechargeTiffinSubscription(weeks, paynowRef);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useSkipTiffinMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      collectionDate,
      collectionSlot,
    }: {
      collectionDate: string;
      collectionSlot?: string;
    }) => {
      await hydrateSession();
      return skipTiffinMeal(collectionDate, collectionSlot);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useCustomizeTiffinMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      collectionDate: string;
      collectionSlot?: string;
      extraLines: string[];
      amountCents?: number;
      paynowRef?: string | null;
    }) => {
      await hydrateSession();
      return customizeTiffinMeal(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useUpdateTiffinNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cooking_notes?: string | null; collection_notes?: string | null }) => {
      await hydrateSession();
      return updateTiffinSubscriptionNotes(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useSaveTiffinPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      slots: { day_of_week: number; product_id: string; collection_slot?: string }[];
      as_recurring_template?: boolean;
      week_start?: string | null;
    }) => {
      await hydrateSession();
      return saveTiffinWeeklyPlan(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useSaveTiffinNextWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slots: { day_of_week: number; product_id: string; collection_slot?: string }[]) => {
      await hydrateSession();
      return saveTiffinNextWeekPlan(slots);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}
