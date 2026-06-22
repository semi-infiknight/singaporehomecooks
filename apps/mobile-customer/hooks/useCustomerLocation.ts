import { useCallback, useEffect, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { SHCCustomerLocationPrefs, SHCSavedAddress } from '@shc/types';
import { shcCustomerLocationPrefsSchema, shcSavedAddressSchema } from '@shc/types';
import { createSavedAddress, formatLocationShort } from '@shc/utils';

const STORAGE_KEY = 'shc_customer_location_v1';

const DEFAULT: SHCCustomerLocationPrefs = { saved: [] };

async function loadPrefs(): Promise<SHCCustomerLocationPrefs> {
  try {
    const raw = await SecureStore.getItemAsync(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = shcCustomerLocationPrefsSchema.safeParse(JSON.parse(raw));
    return parsed.success ? parsed.data : DEFAULT;
  } catch {
    return DEFAULT;
  }
}

async function savePrefs(prefs: SHCCustomerLocationPrefs) {
  await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(prefs));
}

export function useCustomerLocation() {
  const [prefs, setPrefs] = useState<SHCCustomerLocationPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const p = await loadPrefs();
      if (!cancelled) {
        setPrefs(p);
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const active = prefs.saved.find((s) => s.id === prefs.active_id) ?? prefs.saved[0] ?? null;

  const persist = useCallback(async (next: SHCCustomerLocationPrefs) => {
    setPrefs(next);
    try {
      await savePrefs(next);
    } catch {
      /* non-fatal */
    }
  }, []);

  const setActive = useCallback(
    async (addr: SHCSavedAddress) => {
      const parsed = shcSavedAddressSchema.safeParse(addr);
      if (!parsed.success) throw new Error('Invalid address');
      const exists = prefs.saved.some((s) => s.id === addr.id);
      const saved = exists
        ? prefs.saved.map((s) => (s.id === addr.id ? parsed.data : s))
        : [parsed.data, ...prefs.saved].slice(0, 10);
      await persist({ active_id: parsed.data.id, saved });
    },
    [persist, prefs.saved]
  );

  const saveNew = useCallback(
    async (partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }) => {
      const addr = createSavedAddress(partial);
      const parsed = shcSavedAddressSchema.safeParse(addr);
      if (!parsed.success) throw new Error('Invalid address');
      const saved = [parsed.data, ...prefs.saved.filter((s) => s.id !== parsed.data.id)].slice(0, 10);
      await persist({ active_id: parsed.data.id, saved });
      return parsed.data;
    },
    [persist, prefs.saved]
  );

  const removeSaved = useCallback(
    async (id: string) => {
      const saved = prefs.saved.filter((s) => s.id !== id);
      const active_id = prefs.active_id === id ? saved[0]?.id : prefs.active_id;
      await persist({ active_id, saved });
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