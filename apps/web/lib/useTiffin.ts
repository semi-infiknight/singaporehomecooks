'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { client, hydrateSession, isAuthenticated } from './api-client';
import { cookClient } from './cook-api-client';
import { useAuth } from './useAuth';
import { isCookAuthenticated } from './cook-api-client';

export type TiffinPlanSlot = {
  day_of_week: number;
  product_id: string;
  collection_slot?: string;
};

export function tiffinPricePerServing(mealsPerWeek: number): number {
  if (mealsPerWeek >= 4) return 10;
  if (mealsPerWeek >= 3) return 11;
  return 12;
}

export function tiffinWeeklySubtotal(mealsPerWeek: number, servings = 1): number {
  return mealsPerWeek * servings * tiffinPricePerServing(mealsPerWeek);
}

export const TIFFIN_DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const;

export function useTiffinKitchens() {
  return useQuery({
    queryKey: ['tiffin', 'kitchens'],
    queryFn: () => client.getTiffinKitchens(),
    staleTime: 30_000,
  });
}

export function useTiffinKitchen(cookId: string) {
  return useQuery({
    queryKey: ['tiffin', 'kitchen', cookId],
    queryFn: () => client.getTiffinKitchen(cookId),
    enabled: Boolean(cookId),
  });
}

export function useTiffinSubscription() {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['tiffin', 'subscription'],
    queryFn: async () => {
      await hydrateSession();
      return client.getTiffinSubscription();
    },
    enabled: Boolean(user || isAuthenticated()) && !loading,
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
      return client.subscribeTiffin(cookId, mealsPerWeek, weeks);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
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
      return client.customizeTiffinMeal(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useUpdateTiffinNotes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { cooking_notes?: string | null; collection_notes?: string | null }) => {
      await hydrateSession();
      return client.updateTiffinSubscriptionNotes(input);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useCancelTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reason?: string) => {
      await hydrateSession();
      if (reason) return client.cancelTiffinSubscriptionWithReason(reason);
      return client.cancelTiffinSubscription();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useSaveTiffinPlan() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      slots: TiffinPlanSlot[];
      as_recurring_template?: boolean;
      week_start?: string | null;
    }) => {
      await hydrateSession();
      return client.saveTiffinWeeklyPlan(input);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useSaveTiffinNextWeek() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (slots: TiffinPlanSlot[]) => {
      await hydrateSession();
      return client.saveTiffinNextWeekPlan(slots);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useTiffinCookConfig() {
  return useQuery({
    queryKey: ['tiffin', 'cook-config'],
    queryFn: () => cookClient.getTiffinCookConfig(),
    enabled: isCookAuthenticated(),
  });
}

export function useUpdateTiffinCookConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: {
      enabled?: boolean;
      tagline?: string;
      eligible_product_ids?: string[];
      meals_per_week_options?: (2 | 3 | 4)[];
      collection_days?: number[];
      default_collection_slot?: string;
    }) => cookClient.updateTiffinCookConfig(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin', 'cook-config'] });
      qc.invalidateQueries({ queryKey: ['tiffin', 'kitchens'] });
    },
  });
}

export function useTiffinMealOrders(from?: string, to?: string) {
  const { user, loading } = useAuth();
  return useQuery({
    queryKey: ['tiffin', 'meals', from, to],
    queryFn: async () => {
      await hydrateSession();
      return client.getTiffinMealOrders(from, to);
    },
    enabled: Boolean(user || isAuthenticated()) && !loading,
  });
}

export function usePauseTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (days: number) => {
      await hydrateSession();
      return client.pauseTiffinSubscription(days);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useResumeTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await hydrateSession();
      return client.resumeTiffinSubscription();
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
      return client.rechargeTiffinSubscription(weeks, paynowRef);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useSkipTiffinMeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { collectionDate: string; collectionSlot?: string }) => {
      await hydrateSession();
      return client.skipTiffinMeal(input.collectionDate, input.collectionSlot);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function useKitchenCancelTiffinDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { collectionDate: string; reason?: string }) =>
      cookClient.kitchenCancelTiffinDay(input.collectionDate, input.reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function usePublishTiffinDayMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: { collectionDate: string; productIds: string[]; note?: string }) =>
      cookClient.publishTiffinDayMenu(input.collectionDate, input.productIds, input.note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}
