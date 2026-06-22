import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import { toggleFavorite, isFavorite, type FavoriteDish } from '@shc/utils';

const FAVORITES_KEY = 'shc_customer_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(FAVORITES_KEY);
        if (raw) setFavorites(JSON.parse(raw));
      } catch {
        /* empty */
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const persist = useCallback(async (next: FavoriteDish[]) => {
    setFavorites(next);
    await SecureStore.setItemAsync(FAVORITES_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    async (dish: Omit<FavoriteDish, 'savedAt'>) => {
      const next = toggleFavorite(favorites, dish);
      await persist(next);
      return !isFavorite(favorites, dish.id);
    },
    [favorites, persist]
  );

  const check = useCallback((id: string) => isFavorite(favorites, id), [favorites]);

  return { favorites, loading, toggle, isFavorite: check };
}