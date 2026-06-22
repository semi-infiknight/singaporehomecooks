'use client';

import { useCallback, useEffect, useState } from 'react';
import type { SHCCustomerLocationPrefs, SHCSavedAddress } from '@shc/types';
import { shcCustomerLocationPrefsSchema, shcSavedAddressSchema } from '@shc/types';
import { createSavedAddress, formatLocationShort } from '@shc/utils';

const STORAGE_KEY = 'shc_customer_location_v1';

const DEFAULT: SHCCustomerLocationPrefs = { saved: [] };

function loadPrefs(): SHCCustomerLocationPrefs {
  if (typeof window === 'undefined') return DEFAULT;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = shcCustomerLocationPrefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

export function useCustomerLocation() {
  const [prefs, setPrefs] = useState<SHCCustomerLocationPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setPrefs(loadPrefs());
    setReady(true);
  }, []);

  const active = prefs.saved.find((s) => s.id === prefs.active_id) ?? prefs.saved[0] ?? null;

  const persist = useCallback((next: SHCCustomerLocationPrefs) => {
    setPrefs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      /* non-fatal */
    }
  }, []);

  const setActive = useCallback(
    (addr: SHCSavedAddress) => {
      const parsed = shcSavedAddressSchema.safeParse(addr);
      if (!parsed.success) throw new Error('Invalid address');
      const exists = prefs.saved.some((s) => s.id === addr.id);
      const saved = exists
        ? prefs.saved.map((s) => (s.id === addr.id ? parsed.data : s))
        : [parsed.data, ...prefs.saved].slice(0, 10);
      persist({ active_id: parsed.data.id, saved });
    },
    [persist, prefs.saved]
  );

  const saveNew = useCallback(
    (partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }) => {
      const addr = createSavedAddress(partial);
      const parsed = shcSavedAddressSchema.safeParse(addr);
      if (!parsed.success) throw new Error('Invalid address');
      const saved = [parsed.data, ...prefs.saved.filter((s) => s.id !== parsed.data.id)].slice(0, 10);
      persist({ active_id: parsed.data.id, saved });
      return parsed.data;
    },
    [persist, prefs.saved]
  );

  const removeSaved = useCallback(
    (id: string) => {
      const saved = prefs.saved.filter((s) => s.id !== id);
      const active_id = prefs.active_id === id ? saved[0]?.id : prefs.active_id;
      persist({ active_id, saved });
    },
    [persist, prefs.active_id, prefs.saved]
  );

  const locationLabel = active ? formatLocationShort(active) : 'Set collection location';

  return {
    ready,
    active,
    saved: prefs.saved,
    activeId: prefs.active_id,
    locationLabel,
    setActive,
    saveNew,
    removeSaved,
  };
}