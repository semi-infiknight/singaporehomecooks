import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LocationPickerExperience, type PinNudgeDirection } from '@shc/ui';
import type { SHCSavedAddress } from '@shc/types';
import {
  nudgeCoordinates,
  reverseGeocodeSingapore,
  searchSingaporeAddresses,
  type AddressSearchResult,
} from '@shc/utils';
import { useCustomerLocation } from '../../hooks/useCustomerLocation';
import { getCurrentGpsCoords } from '../../lib/gps-location';

export default function LocationScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { saved, activeId, saveNew, setActive, removeSaved } = useCustomerLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState<Partial<SHCSavedAddress> | null>(null);
  const geocodeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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
    const t = setTimeout(() => {
      if (query.trim().length >= 3) void runSearch();
    }, 400);
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
      /* keep coords; user can edit line1 manually */
    }
  }, []);

  const onSelectResult = (r: AddressSearchResult) => {
    beginDraft({
      line1: r.line1,
      postal_code: r.postal_code,
      lat: r.lat,
      lng: r.lng,
      source: 'search',
    });
  };

  const onUseGps = async () => {
    setLocating(true);
    try {
      const result = await getCurrentGpsCoords();
      if (!result.ok) {
        if (result.reason === 'unavailable') {
          Alert.alert(
            'GPS not available in this build',
            'Rebuild the dev app to enable current location:\n\n  cd apps/mobile-customer && npx expo run:ios\n\nUse search above to find your block for now.'
          );
        } else if (result.reason === 'denied') {
          Alert.alert(
            'Location permission needed',
            'Enable location in Settings → SHC Customer, or use search to find your HDB collection point.'
          );
        } else {
          Alert.alert('Could not get location', 'Try search instead, or set a custom location in the emulator extended controls.');
        }
        return;
      }

      beginDraft({
        line1: '',
        lat: result.coords.lat,
        lng: result.coords.lng,
        source: 'gps',
      });
      void geocodeDraft(result.coords.lat, result.coords.lng);
    } catch (e: unknown) {
      Alert.alert('Could not get location', (e as Error)?.message ?? 'Try search instead.');
    } finally {
      setLocating(false);
    }
  };

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
    (direction: PinNudgeDirection) => {
      setDraft((d) => {
        if (!d || d.lat == null || d.lng == null) return d;
        const next = nudgeCoordinates(d.lat, d.lng, direction);
        applyPinCoords(next.lat, next.lng);
        return { ...d, lat: next.lat, lng: next.lng, source: 'map' };
      });
    },
    [applyPinCoords]
  );

  useEffect(
    () => () => {
      if (geocodeTimer.current) clearTimeout(geocodeTimer.current);
    },
    []
  );

  const onConfirm = async () => {
    if (!draft?.line1 || draft.lat == null || draft.lng == null || !draft.label) return;
    setBusy(true);
    try {
      await saveNew({
        label: draft.label,
        line1: draft.line1,
        line2: draft.line2,
        postal_code: draft.postal_code,
        lat: draft.lat,
        lng: draft.lng,
        instructions: draft.instructions,
        source: draft.source,
      });
      router.back();
    } catch (e: unknown) {
      Alert.alert('Could not save', (e as Error)?.message ?? 'Check address fields.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, paddingTop: insets.top, backgroundColor: '#FAFAFA' }} testID="location-screen">
      <LocationPickerExperience
        step={step}
        onStepChange={setStep}
        query={query}
        onQueryChange={setQuery}
        results={results}
        searching={searching}
        onSearch={runSearch}
        saved={saved}
        activeId={activeId}
        onSelectSaved={async (addr) => {
          await setActive(addr);
          router.back();
        }}
        onDeleteSaved={(id) => void removeSaved(id)}
        onUseCurrentLocation={onUseGps}
        locating={locating}
        draft={draft}
        onDraftChange={(patch) => setDraft((d) => (d ? { ...d, ...patch } : d))}
        onSelectResult={onSelectResult}
        onConfirm={onConfirm}
        onBack={() => router.back()}
        busy={busy}
        onNudgePin={onPinMove}
        onPinDrag={onPinDrag}
      />
    </View>
  );
}