import { useQuery, useMutation } from '@tanstack/react-query';
import { estimateCaloriesAI, getPhotoTips } from '../lib/api-client.js';

export function usePhotoTips() {
  return useQuery({ queryKey: ['photo-tips'], queryFn: () => getPhotoTips() });
}

export function useAICalorieEstimate() {
  return useMutation({
    mutationFn: (ingredients: unknown[]) => estimateCaloriesAI(ingredients),
  });
}