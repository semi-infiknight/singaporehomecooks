import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTiffinKitchens,
  getTiffinKitchen,
  getTiffinSubscription,
  subscribeTiffin,
  cancelTiffinSubscription,
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

export function useSubscribeTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cookId, mealsPerWeek }: { cookId: string; mealsPerWeek: 2 | 3 | 4 }) => {
      await hydrateSession();
      return subscribeTiffin(cookId, mealsPerWeek);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useCancelTiffin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await hydrateSession();
      return cancelTiffinSubscription();
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