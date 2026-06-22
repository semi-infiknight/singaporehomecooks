import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';

const PREFS_KEY = 'shc_discover_prefs';

type DiscoverPrefs = {
  halalOnly: boolean;
  maxCal?: number;
};

const DEFAULT: DiscoverPrefs = { halalOnly: false, maxCal: undefined };

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

  const persist = useCallback(async (next: DiscoverPrefs) => {
    setPrefs(next);
    try {
      await SecureStore.setItemAsync(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const setHalalOnly = useCallback(
    (halalOnly: boolean) => persist({ ...prefs, halalOnly }),
    [persist, prefs]
  );

  const toggleHalalOnly = useCallback(() => persist({ ...prefs, halalOnly: !prefs.halalOnly }), [persist, prefs]);

  const setMaxCal = useCallback(
    (maxCal: number | undefined) => persist({ ...prefs, maxCal }),
    [persist, prefs]
  );

  const toggleLight = useCallback(
    () => persist({ ...prefs, maxCal: prefs.maxCal === 500 ? undefined : 500 }),
    [persist, prefs]
  );

  return { ...prefs, ready, setHalalOnly, toggleHalalOnly, setMaxCal, toggleLight };
}