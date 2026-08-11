'use client';

import { useCallback, useEffect, useState } from 'react';

const PREFS_KEY = 'shc_discover_prefs';

type DiscoverPrefs = {
  halalOnly: boolean;
  vegetarianOnly: boolean;
  veganOnly: boolean;
  /** When true, filter includeIngredient = 'chicken' */
  chickenOnly: boolean;
  excludeNuts: boolean;
  maxCal?: number;
};

const DEFAULT: DiscoverPrefs = {
  halalOnly: false,
  vegetarianOnly: false,
  veganOnly: false,
  chickenOnly: false,
  excludeNuts: false,
  maxCal: undefined,
};

function readPrefs(): DiscoverPrefs {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (!raw) return DEFAULT;
    return { ...DEFAULT, ...JSON.parse(raw) };
  } catch {
    return DEFAULT;
  }
}

export function useDiscoverPrefs() {
  const [prefs, setPrefs] = useState<DiscoverPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(readPrefs());
    setReady(true);
  }, []);

  const patch = useCallback((fn: (prev: DiscoverPrefs) => DiscoverPrefs) => {
    setPrefs((prev) => {
      const next = fn(prev);
      try {
        localStorage.setItem(PREFS_KEY, JSON.stringify(next));
      } catch {
        /* non-fatal */
      }
      return next;
    });
  }, []);

  const toggleHalalOnly = useCallback(
    () => patch((p) => ({ ...p, halalOnly: !p.halalOnly })),
    [patch]
  );

  const toggleLight = useCallback(
    () => patch((p) => ({ ...p, maxCal: p.maxCal === 500 ? undefined : 500 })),
    [patch]
  );

  const setMaxCal = useCallback(
    (maxCal: number | undefined) => patch((p) => ({ ...p, maxCal })),
    [patch]
  );

  const toggleVegetarianOnly = useCallback(
    () => patch((p) => ({ ...p, vegetarianOnly: !p.vegetarianOnly })),
    [patch]
  );

  const toggleVeganOnly = useCallback(
    () => patch((p) => ({ ...p, veganOnly: !p.veganOnly })),
    [patch]
  );

  const toggleChickenOnly = useCallback(
    () => patch((p) => ({ ...p, chickenOnly: !p.chickenOnly })),
    [patch]
  );

  const toggleExcludeNuts = useCallback(
    () => patch((p) => ({ ...p, excludeNuts: !p.excludeNuts })),
    [patch]
  );

  return {
    ...prefs,
    ready,
    toggleHalalOnly,
    toggleLight,
    setMaxCal,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
  };
}
