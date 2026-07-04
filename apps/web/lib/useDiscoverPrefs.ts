'use client';

import { useCallback, useEffect, useState } from 'react';

const PREFS_KEY = 'shc_discover_prefs';

type DiscoverPrefs = {
  halalOnly: boolean;
  maxCal?: number;
};

const DEFAULT: DiscoverPrefs = { halalOnly: false, maxCal: undefined };

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

  const persist = useCallback((next: DiscoverPrefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(PREFS_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const toggleHalalOnly = useCallback(
    () => persist({ ...prefs, halalOnly: !prefs.halalOnly }),
    [persist, prefs]
  );

  const toggleLight = useCallback(
    () => persist({ ...prefs, maxCal: prefs.maxCal === 500 ? undefined : 500 }),
    [persist, prefs]
  );

  return { ...prefs, ready, toggleHalalOnly, toggleLight };
}