import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import * as SecureStore from 'expo-secure-store';
import type { SHCBrowseProximity, SHCCustomerLocationPrefs, SHCSavedAddress } from '@shc/types';
import { shcCustomerLocationPrefsSchema, shcSavedAddressSchema } from '@shc/types';
import {
  createSavedAddress,
  formatLocationShort,
  isWithinSingapore,
  reverseGeocodeSingapore,
} from '@shc/utils';
import { getCurrentGpsCoords } from '../lib/gps-location';

const STORAGE_KEY = 'shc_customer_location_v1';
const GPS_PROMPTED_KEY = 'shc_customer_gps_prompted_v1';

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

type CustomerLocationContextValue = {
  ready: boolean;
  /** Explicit collection HDB address for checkout — never auto GPS. */
  active: SHCSavedAddress | null;
  saved: SHCSavedAddress[];
  activeId: string | undefined;
  /** Label for collection point (cart / checkout). */
  locationLabel: string;
  /**
   * Coords for discover proximity sort only.
   * Prefers browse_proximity (GPS); does not invent a collection address.
   */
  proximity: { lat: number; lng: number } | null;
  /** Soft “Near Tampines” style label for discover header. */
  proximityLabel: string | null;
  setActive: (addr: SHCSavedAddress) => Promise<void>;
  saveNew: (
    partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }
  ) => Promise<SHCSavedAddress>;
  updateSaved: (
    id: string,
    patch: Partial<Omit<SHCSavedAddress, 'id' | 'created_at'>>
  ) => Promise<void>;
  removeSaved: (id: string) => Promise<void>;
};

const CustomerLocationContext = createContext<CustomerLocationContextValue | null>(null);

/** Shared location state — collection addresses + separate browse proximity. */
export function CustomerLocationProvider({ children }: { children: React.ReactNode }) {
  const [prefs, setPrefs] = useState<SHCCustomerLocationPrefs>(DEFAULT);
  const [ready, setReady] = useState(false);
  const autoGpsTried = useRef(false);

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
      // Saved areas drive nearby kitchens (not kitchen pickup precision).
      const browse_proximity: SHCBrowseProximity = {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        area_label: formatLocationShort(parsed.data).slice(0, 80),
        updated_at: new Date().toISOString(),
      };
      await persist({ ...prefs, active_id: parsed.data.id, saved, browse_proximity });
    },
    [persist, prefs]
  );

  const saveNew = useCallback(
    async (partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }) => {
      const postal =
        partial.postal_code && /^\d{6}$/.test(String(partial.postal_code).trim())
          ? String(partial.postal_code).trim()
          : undefined;
      const cleaned = {
        ...partial,
        label: String(partial.label || '📍').trim() || '📍',
        line1: String(partial.line1 || '').trim(),
        postal_code: postal,
        lat: Number(partial.lat),
        lng: Number(partial.lng),
      };
      const addr = createSavedAddress(cleaned);
      const parsed = shcSavedAddressSchema.safeParse(addr);
      if (!parsed.success) {
        const detail = parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ');
        throw new Error(detail || 'Invalid address');
      }
      const saved = [parsed.data, ...prefs.saved.filter((s) => s.id !== parsed.data.id)].slice(0, 10);
      const browse_proximity: SHCBrowseProximity = {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        area_label: formatLocationShort(parsed.data).slice(0, 80),
        updated_at: new Date().toISOString(),
      };
      await persist({ ...prefs, active_id: parsed.data.id, saved, browse_proximity });
      return parsed.data;
    },
    [persist, prefs]
  );

  /**
   * Auto GPS → browse_proximity only (nearby kitchens).
   * Does NOT create a collection address — user picks that at checkout/location UI.
   */
  useEffect(() => {
    if (!ready || autoGpsTried.current) return;
    if (prefs.browse_proximity) {
      autoGpsTried.current = true;
      return;
    }
    autoGpsTried.current = true;

    let cancelled = false;
    (async () => {
      try {
        await SecureStore.setItemAsync(GPS_PROMPTED_KEY, '1');
        const gps = await getCurrentGpsCoords();
        if (cancelled || !gps.ok) return;
        const { lat, lng } = gps.coords;
        if (!isWithinSingapore(lat, lng)) return;

        let area_label: string | undefined;
        try {
          const rev = await reverseGeocodeSingapore(lat, lng);
          const title = (rev.title || rev.line1 || '').trim();
          if (title) area_label = title.split(',')[0]?.trim().slice(0, 80) || undefined;
        } catch {
          /* coords alone are enough for sort */
        }
        if (cancelled) return;

        const browse_proximity: SHCBrowseProximity = {
          lat,
          lng,
          area_label,
          updated_at: new Date().toISOString(),
        };
        await persist({ ...prefs, browse_proximity });
      } catch {
        /* permission denied / offline */
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [ready, prefs, persist]);

  const updateSaved = useCallback(
    async (id: string, patch: Partial<Omit<SHCSavedAddress, 'id' | 'created_at'>>) => {
      const current = prefs.saved.find((s) => s.id === id);
      if (!current) return;
      const next = { ...current, ...patch, id: current.id };
      const parsed = shcSavedAddressSchema.safeParse(next);
      if (!parsed.success) throw new Error('Invalid address');
      const saved = prefs.saved.map((s) => (s.id === id ? parsed.data : s));
      const browse_proximity: SHCBrowseProximity | undefined =
        prefs.active_id === id
          ? {
              lat: parsed.data.lat,
              lng: parsed.data.lng,
              area_label: formatLocationShort(parsed.data).slice(0, 80),
              updated_at: new Date().toISOString(),
            }
          : prefs.browse_proximity;
      await persist({ ...prefs, saved, browse_proximity });
    },
    [persist, prefs]
  );

  const removeSaved = useCallback(
    async (id: string) => {
      const saved = prefs.saved.filter((s) => s.id !== id);
      const active_id = prefs.active_id === id ? saved[0]?.id : prefs.active_id;
      await persist({ ...prefs, active_id, saved });
    },
    [persist, prefs]
  );

  const proximity = useMemo(() => {
    if (prefs.browse_proximity) {
      return { lat: prefs.browse_proximity.lat, lng: prefs.browse_proximity.lng };
    }
    return null;
  }, [prefs.browse_proximity]);

  const proximityLabel = prefs.browse_proximity?.area_label
    ? `Near ${prefs.browse_proximity.area_label}`
    : proximity
      ? 'Near you'
      : null;

  const locationLabel = active ? formatLocationShort(active) : 'Set collection location';

  const value = useMemo(
    () => ({
      ready,
      active,
      saved: prefs.saved,
      activeId: prefs.active_id,
      locationLabel,
      proximity,
      proximityLabel,
      setActive,
      saveNew,
      updateSaved,
      removeSaved,
    }),
    [
      ready,
      active,
      prefs.saved,
      prefs.active_id,
      locationLabel,
      proximity,
      proximityLabel,
      setActive,
      saveNew,
      updateSaved,
      removeSaved,
    ]
  );

  return React.createElement(CustomerLocationContext.Provider, { value }, children);
}

export function useCustomerLocation(): CustomerLocationContextValue {
  const ctx = useContext(CustomerLocationContext);
  if (!ctx) {
    throw new Error('useCustomerLocation must be used within CustomerLocationProvider');
  }
  return ctx;
}
