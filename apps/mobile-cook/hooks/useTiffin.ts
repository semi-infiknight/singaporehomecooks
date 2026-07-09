import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTiffinCookConfig,
  updateTiffinCookConfig,
  kitchenCancelTiffinDay,
  publishTiffinDayMenu,
} from '../lib/api-client';

export function useTiffinCookConfig() {
  return useQuery({
    queryKey: ['tiffin', 'cook-config'],
    queryFn: getTiffinCookConfig,
    staleTime: 10_000,
  });
}

export function useUpdateTiffinCookConfig() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: updateTiffinCookConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tiffin'] });
    },
  });
}

export function useKitchenCancelTiffinDay() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ collectionDate, reason }: { collectionDate: string; reason?: string }) =>
      kitchenCancelTiffinDay(collectionDate, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}

export function usePublishTiffinDayMenu() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      collectionDate,
      productIds,
      note,
    }: {
      collectionDate: string;
      productIds: string[];
      note?: string;
    }) => publishTiffinDayMenu(collectionDate, productIds, note),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['tiffin'] }),
  });
}
