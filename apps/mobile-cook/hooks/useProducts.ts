import { useQuery, useMutation } from '@tanstack/react-query';
import { estimateCaloriesAI, getPhotoTips, getCookListings } from '../lib/api-client';

export function useCookListings() {
  return useQuery({ queryKey: ['cook-listings'], queryFn: () => getCookListings() });
}

export function usePhotoTips() {
  return useQuery({ queryKey: ['photo-tips'], queryFn: () => getPhotoTips() });
}

export function useAICalorieEstimate() {
  return useMutation({
    mutationFn: (ingredients: unknown[]) => estimateCaloriesAI(ingredients),
  });
}