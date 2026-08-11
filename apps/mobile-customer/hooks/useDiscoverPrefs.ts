import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'shc_discover_prefs';

type DiscoverPrefs = {
  halalOnly: boolean;
  vegetarianOnly: boolean;
  veganOnly: boolean;
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

export function useDiscoverPrefs() {
  const [prefs, setPrefs] = useState<DiscoverPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await SecureStore.getItemAsync(PREFS_KEY);
        if (raw && !cancelled) setPrefs({ ...DEFAULT, ...JSON.parse(raw) });
      } catch {
        /* use defaults */
      } finally {
        if (!cancelled) setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  /** Functional updates so rapid slider moves never clobber with a stale prefs snapshot. */
  const patch = useCallback(
    (fn: (prev: DiscoverPrefs) => DiscoverPrefs) => {
      setPrefs((prev) => {
        const next = fn(prev);
        void SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next)).catch(() => {});
        return next;
      });
    },
    []
  );

  const setHalalOnly = useCallback(
    (halalOnly: boolean) => patch((p) => ({ ...p, halalOnly })),
    [patch]
  );

  const toggleHalalOnly = useCallback(() => patch((p) => ({ ...p, halalOnly: !p.halalOnly })), [patch]);

  const setMaxCal = useCallback(
    (maxCal: number | undefined) => patch((p) => ({ ...p, maxCal })),
    [patch]
  );

  const toggleLight = useCallback(
    () => patch((p) => ({ ...p, maxCal: p.maxCal === 500 ? undefined : 500 })),
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
    setHalalOnly,
    toggleHalalOnly,
    setMaxCal,
    toggleLight,
    toggleVegetarianOnly,
    toggleVeganOnly,
    toggleChickenOnly,
    toggleExcludeNuts,
  };
}
