import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTiffinCookConfig, updateTiffinCookConfig } from '../lib/api-client';

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