'use client';

import { useCallback, useEffect, useState } from 'react';
import { toggleFavorite, isFavorite, type FavoriteDish } from '@shc/utils';

const FAVORITES_KEY = 'shc_web_favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteDish[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(FAVORITES_KEY);
      if (raw) setFavorites(JSON.parse(raw));
    } catch {
      /* empty */
    } finally {
      setLoading(false);
    }
  }, []);

  const persist = useCallback((next: FavoriteDish[]) => {
    setFavorites(next);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    (dish: Omit<FavoriteDish, 'savedAt'>) => {
      const next = toggleFavorite(favorites, dish);
      persist(next);
      return !isFavorite(favorites, dish.id);
    },
    [favorites, persist]
  );

  const check = useCallback((id: string) => isFavorite(favorites, id), [favorites]);

  return { favorites, loading, toggle, isFavorite: check };
}