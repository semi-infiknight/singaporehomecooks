/**
 * Group discover search hits Swiggy-style:
 * - kitchens that serve matching dishes
 * - dish rows with “available in N kitchens”
 */

export type SearchDishInput = {
  id: string;
  name: string;
  cook_name?: string;
  cook_id?: string;
  cook_slug?: string;
  price?: number;
  cuisine?: string;
  area?: string;
  image_url?: string;
  rating?: number;
};

export type SearchKitchenGroup = {
  key: string;
  cook_name: string;
  cook_id?: string;
  cook_slug?: string;
  area?: string;
  /** Route segment for cook profile */
  routeKey: string;
  matchingDishCount: number;
  sampleDishNames: string[];
  image_url?: string;
  rating?: number;
};

export type SearchDishRow = SearchDishInput & {
  /** How many kitchens offer a dish with this normalized name */
  kitchenCount: number;
  kitchenLabel: string;
};

function normalizeDishName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cookKey(p: SearchDishInput): string {
  return String(p.cook_slug || p.cook_id || p.cook_name || 'unknown')
    .toLowerCase()
    .trim();
}

function cookRouteKey(p: SearchDishInput): string {
  return String(p.cook_slug || p.cook_id || '').trim();
}

/** Group filtered search products for the predictive search panel. */
export function buildSearchResultGroups(
  products: SearchDishInput[],
  query: string
): {
  kitchens: SearchKitchenGroup[];
  dishes: SearchDishRow[];
  query: string;
} {
  const q = query.trim().toLowerCase();
  const list = products.filter((p) => p.id && p.name);

  // Kitchens that match by name OR have a matching dish
  const byCook = new Map<string, SearchDishInput[]>();
  for (const p of list) {
    const k = cookKey(p);
    const arr = byCook.get(k) || [];
    arr.push(p);
    byCook.set(k, arr);
  }

  const kitchens: SearchKitchenGroup[] = [];
  for (const [key, dishes] of byCook) {
    const head = dishes[0];
    if (!head) continue;
    const cookName = String(head.cook_name || 'Home kitchen');
    const cookMatches = q ? cookName.toLowerCase().includes(q) : false;
    const dishHits = q
      ? dishes.filter((d) => d.name.toLowerCase().includes(q) || String(d.cuisine || '').toLowerCase().includes(q))
      : dishes;
    if (!cookMatches && dishHits.length === 0) continue;

    const matching = dishHits.length > 0 ? dishHits : dishes;
    const routeKey = cookRouteKey(head);
    if (!routeKey) continue;

    kitchens.push({
      key,
      cook_name: cookName,
      cook_id: head.cook_id,
      cook_slug: head.cook_slug,
      area: head.area,
      routeKey,
      matchingDishCount: matching.length,
      sampleDishNames: matching.slice(0, 3).map((d) => d.name),
      image_url: matching[0]?.image_url || head.image_url,
      rating: head.rating,
    });
  }

  // Prefer kitchens that match the query name first, then by dish count
  kitchens.sort((a, b) => {
    const aName = q && a.cook_name.toLowerCase().includes(q) ? 1 : 0;
    const bName = q && b.cook_name.toLowerCase().includes(q) ? 1 : 0;
    if (bName !== aName) return bName - aName;
    return b.matchingDishCount - a.matchingDishCount;
  });

  // Kitchen count per normalized dish name (across full product list, not just filtered)
  const nameToKitchens = new Map<string, Set<string>>();
  for (const p of list) {
    const nn = normalizeDishName(p.name);
    if (!nn) continue;
    const set = nameToKitchens.get(nn) || new Set();
    set.add(cookKey(p));
    nameToKitchens.set(nn, set);
  }

  const dishes: SearchDishRow[] = list.map((p) => {
    const nn = normalizeDishName(p.name);
    const kitchenCount = nameToKitchens.get(nn)?.size ?? 1;
    const kitchenLabel =
      kitchenCount > 1
        ? `Available from ${kitchenCount} kitchens`
        : p.cook_name
          ? `Kitchen · ${p.cook_name}`
          : 'Dish';
    return { ...p, kitchenCount, kitchenLabel };
  });

  // Dish rows: name matches first
  dishes.sort((a, b) => {
    const aHit = q && a.name.toLowerCase().includes(q) ? 1 : 0;
    const bHit = q && b.name.toLowerCase().includes(q) ? 1 : 0;
    if (bHit !== aHit) return bHit - aHit;
    return a.name.localeCompare(b.name);
  });

  return {
    kitchens: kitchens.slice(0, 8),
    dishes: dishes.slice(0, 24),
    query: query.trim(),
  };
}

export function kitchenAvailabilityCopy(count: number): string {
  if (count <= 1) return '1 kitchen';
  return `${count} kitchens`;
}
