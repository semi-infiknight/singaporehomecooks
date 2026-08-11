'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { SHCBrowseProximity, SHCCustomerLocationPrefs, SHCSavedAddress } from '@shc/types';
import { shcCustomerLocationPrefsSchema, shcSavedAddressSchema } from '@shc/types';
import {
  createSavedAddress,
  formatLocationShort,
  isWithinSingapore,
  reverseGeocodeSingapore,
} from '@shc/utils';

const STORAGE_KEY = 'shc_customer_location_v1';
const GPS_PROMPTED_KEY = 'shc_customer_gps_prompted_v1';

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
  const autoGpsTried = useRef(false);

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
      const browse_proximity: SHCBrowseProximity = {
        lat: parsed.data.lat,
        lng: parsed.data.lng,
        area_label: formatLocationShort(parsed.data).slice(0, 80),
        updated_at: new Date().toISOString(),
      };
      persist({ ...prefs, active_id: parsed.data.id, saved, browse_proximity });
    },
    [persist, prefs]
  );

  const saveNew = useCallback(
    (partial: Omit<SHCSavedAddress, 'id' | 'created_at'> & { id?: string }) => {
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
      persist({ ...prefs, active_id: parsed.data.id, saved, browse_proximity });
      return parsed.data;
    },
    [persist, prefs]
  );

  /** Browser GPS → browse_proximity only (not a collection address). */
  useEffect(() => {
    if (!ready || autoGpsTried.current) return;
    if (prefs.browse_proximity) {
      autoGpsTried.current = true;
      return;
    }
    if (typeof navigator === 'undefined' || !navigator.geolocation) return;
    autoGpsTried.current = true;

    try {
      localStorage.setItem(GPS_PROMPTED_KEY, '1');
    } catch {
      /* ignore */
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (!isWithinSingapore(lat, lng)) return;

            let area_label: string | undefined;
            try {
              const rev = await reverseGeocodeSingapore(lat, lng);
              const title = (rev.title || rev.line1 || '').trim();
              if (title) area_label = title.split(',')[0]?.trim().slice(0, 80) || undefined;
            } catch {
              /* coords alone ok */
            }

            const browse_proximity: SHCBrowseProximity = {
              lat,
              lng,
              area_label,
              updated_at: new Date().toISOString(),
            };
            persist({ ...prefs, browse_proximity });
          } catch {
            /* ignore */
          }
        })();
      },
      () => {
        /* denied / timeout */
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 }
    );
  }, [ready, prefs, persist]);

  const updateSaved = useCallback(
    (id: string, patch: Partial<Omit<SHCSavedAddress, 'id' | 'created_at'>>) => {
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
      persist({ ...prefs, saved, browse_proximity });
    },
    [persist, prefs]
  );

  const removeSaved = useCallback(
    (id: string) => {
      const saved = prefs.saved.filter((s) => s.id !== id);
      const active_id = prefs.active_id === id ? saved[0]?.id : prefs.active_id;
      persist({ ...prefs, active_id, saved });
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

  return {
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
  };
}
