import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import type { SHCSavedAddress } from '@shc/types';
import {
  formatLocationLabel,
  nudgeCoordinates,
  reverseGeocodeSingapore,
  savedAddressFromSgArea,
  searchSingaporeAddresses,
  SG_ONLY_LOCATION_MESSAGE,
  SG_QUICK_PICK_AREAS,
  isWithinSingapore,
  type AddressSearchResult,
} from '@shc/utils';
import { getCurrentGpsCoords } from './gps-location';

export function useSingaporeAddressPicker(initialAddress?: string) {
  const [step, setStep] = useState<1 | 2>(initialAddress?.trim() ? 2 : 1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Partial<SHCSavedAddress> | null>(
    initialAddress?.trim()
      ? { line1: initialAddress.trim(), label: 'home', lat: 1.3521, lng: 103.8198, source: 'manual' }
      : null
  );
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const searchNotice = useMemo(() => {
    if (searching || query.trim().length < 2) return null;
    if (results.length > 0) return null;
    return 'No matches in Singapore — try a street name, building, or 6-digit postal code.';
  }, [searching, query, results.length]);

  const runSearch = useCallback(async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await searchSingaporeAddresses(query.trim()));
    } finally {
      setSearching(false);
    }
  }, [query]);

  useEffect(() => {
    const q = query.trim();
    const t = setTimeout(() => {
      if (/^\d{6}$/.test(q) || q.length >= 3) void runSearch();
    }, /^\d{6}$/.test(q) ? 100 : 400);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const beginDraft = useCallback((seed: Partial<SHCSavedAddress>) => {
    setDraft({
      label: 'home',
      line1: seed.line1 ?? '',
      line2: seed.line2,
      postal_code: seed.postal_code,
      lat: seed.lat ?? 1.3521,
      lng: seed.lng ?? 103.8198,
      instructions: seed.instructions,
      source: seed.source ?? 'search',
    });
    setStep(2);
  }, []);

  const geocodeDraft = useCallback(async (lat: number, lng: number) => {
    try {
      const rev = await reverseGeocodeSingapore(lat, lng);
      setDraft((d) =>
        d
          ? {
              ...d,
              lat: rev.lat,
              lng: rev.lng,
              line1: d.line1 || rev.line1,
              postal_code: d.postal_code || rev.postal_code,
              source: d.source === 'gps' ? 'gps' : d.source ?? 'search',
            }
          : d
      );
    } catch {
      /* keep coords */
    }
  }, []);

  const onSelectResult = useCallback(
    (r: AddressSearchResult) => {
      setQuery(r.title);
      beginDraft({
        line1: r.line1,
        postal_code: r.postal_code,
        lat: r.lat,
        lng: r.lng,
        source: 'search',
      });
    },
    [beginDraft]
  );

  const onUseGps = useCallback(async () => {
    setLocating(true);
    try {
      const result = await getCurrentGpsCoords();
      if (result.ok === false) {
        if (result.reason === 'unavailable') {
          Alert.alert(
            'GPS not available',
            'Rebuild the cook app to enable current location, or search for your block above.'
          );
        } else if (result.reason === 'denied') {
          Alert.alert('Location permission needed', 'Enable location in Settings, or use search instead.');
        } else {
          Alert.alert('Could not get location', 'Try search instead.');
        }
        return;
      }

      if (!isWithinSingapore(result.coords.lat, result.coords.lng)) {
        Alert.alert('Outside Singapore', SG_ONLY_LOCATION_MESSAGE);
        return;
      }

      beginDraft({
        line1: '',
        lat: result.coords.lat,
        lng: result.coords.lng,
        source: 'gps',
      });
      void geocodeDraft(result.coords.lat, result.coords.lng);
    } finally {
      setLocating(false);
    }
  }, [beginDraft, geocodeDraft]);

  const applyPinCoords = useCallback((nextLat: number, nextLng: number) => {
    setDraft((d) => (d ? { ...d, lat: nextLat, lng: nextLng, source: 'map' } : d));

    if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    geocodeTimer.current = setTimeout(() => {
      void reverseGeocodeSingapore(nextLat, nextLng).then((rev) => {
        setDraft((current) =>
          current
            ? {
                ...current,
                lat: nextLat,
                lng: nextLng,
                line1: current.line1 || rev.line1,
                postal_code: current.postal_code || rev.postal_code,
                source: 'map',
              }
            : current
        );
      });
    }, 350);
  }, []);

  const onPinDrag = useCallback(
    (coords: { lat: number; lng: number }) => {
      applyPinCoords(coords.lat, coords.lng);
    },
    [applyPinCoords]
  );

  const onPinMove = useCallback(
    (direction: 'n' | 's' | 'e' | 'w') => {
      setDraft((d) => {
        if (!d || d.lat == null || d.lng == null) return d;
        const next = nudgeCoordinates(d.lat, d.lng, direction);
        applyPinCoords(next.lat, next.lng);
        return { ...d, lat: next.lat, lng: next.lng, source: 'map' };
      });
    },
    [applyPinCoords]
  );

  const onQuickPickArea = useCallback(
    (areaName: string) => {
      const entry = SG_QUICK_PICK_AREAS.find((a) => a.name === areaName);
      if (!entry) return;
      beginDraft(savedAddressFromSgArea(entry));
    },
    [beginDraft]
  );

  const resetPicker = useCallback(() => {
    setStep(1);
    setDraft(null);
    setQuery('');
    setResults([]);
  }, []);

  const buildConfirmedAddress = useCallback((): { kitchen_address: string; collection_instructions?: string } | null => {
    if (!draft?.line1?.trim()) return null;
    const kitchen_address = formatLocationLabel(draft as SHCSavedAddress);
    const collection_instructions = draft.instructions?.trim() || draft.line2?.trim() || undefined;
    return { kitchen_address, collection_instructions };
  }, [draft]);

  return {
    step,
    setStep,
    query,
    setQuery,
    results,
    searching,
    runSearch,
    locating,
    busy,
    setBusy,
    draft,
    onDraftChange: (patch: Partial<SHCSavedAddress>) => setDraft((d) => (d ? { ...d, ...patch } : d)),
    onSelectResult,
    onUseGps,
    onPinDrag,
    onPinMove,
    onQuickPickArea,
    searchNotice,
    resetPicker,
    buildConfirmedAddress,
  };
}
