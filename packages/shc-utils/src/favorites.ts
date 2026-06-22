/** Saved dishes for personalization (dev.to: favorites + tailored recommendations). */

export type FavoriteDish = {
  id: string;
  name: string;
  cook_name?: string;
  price?: number;
  cuisine?: string;
  savedAt: string;
};

export function toggleFavorite(list: FavoriteDish[], dish: Omit<FavoriteDish, 'savedAt'>): FavoriteDish[] {
  const exists = list.find((f) => f.id === dish.id);
  if (exists) return list.filter((f) => f.id !== dish.id);
  return [{ ...dish, savedAt: new Date().toISOString() }, ...list].slice(0, 24);
}

export function isFavorite(list: FavoriteDish[], id: string): boolean {
  return list.some((f) => f.id === id);
}

export function favoritesToReorderDishes(list: FavoriteDish[]) {
  return list.map((f) => ({
    id: f.id,
    name: f.name,
    cook_name: f.cook_name || '',
    price: f.price || 0,
    cuisine: f.cuisine,
  }));
}