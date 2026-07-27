'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SHCSavedAddress } from '@shc/types';
import {
  buildOsmMapPickerHtml,
  reverseGeocodeSingapore,
  searchSingaporeAddresses,
  savedAddressFromSgArea,
  SG_ONLY_LOCATION_MESSAGE,
  SG_QUICK_PICK_AREAS,
  isWithinSingapore,
  type AddressSearchResult,
} from '@shc/utils';
import { useCustomerLocation } from '../../lib/useCustomerLocation';

export default function LocationPage() {
  const router = useRouter();
  const { saved, activeId, saveNew, setActive, removeSaved } = useCustomerLocation();
  const [step, setStep] = useState<1 | 2>(1);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [draft, setDraft] = useState<Partial<SHCSavedAddress> | null>(null);

  const nudgePin = useCallback((latDelta: number, lngDelta: number) => {
    setDraft((d) =>
      d
        ? {
            ...d,
            lat: Math.max(1.15, Math.min(1.48, (d.lat ?? 1.3521) + latDelta)),
            lng: Math.max(103.6, Math.min(104.1, (d.lng ?? 103.8198) + lngDelta)),
            source: 'map',
          }
        : d
    );
  }, []);

  const searchNotice = useMemo(() => {
    if (searching || query.trim().length < 2) return null;
    if (results.length > 0) return null;
    return 'No Singapore matches — try a 6-digit postal code (e.g. 520456) or pick your area below.';
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

  const onMapMessage = useCallback((event: MessageEvent) => {
    const data = event.data as { type?: string; lat?: number; lng?: number };
    if (data?.type !== 'shc-map-pin' || typeof data.lat !== 'number' || typeof data.lng !== 'number') return;
    void reverseGeocodeSingapore(data.lat, data.lng).then((rev) => {
      setDraft((d) =>
        d
          ? {
              ...d,
              lat: data.lat,
              lng: data.lng,
              line1: d.line1 || rev.line1,
              postal_code: d.postal_code || rev.postal_code,
              source: 'map',
            }
          : d
      );
    });
  }, []);

  useEffect(() => {
    window.addEventListener('message', onMapMessage);
    return () => window.removeEventListener('message', onMapMessage);
  }, [onMapMessage]);

  const mapSrc = useMemo(() => {
    if (!draft) return '';
    const html = buildOsmMapPickerHtml(draft.lat ?? 1.3521, draft.lng ?? 103.8198);
    return `data:text/html;charset=utf-8,${encodeURIComponent(html)}`;
  }, [draft?.lat, draft?.lng, draft]);

  const onUseGps = () => {
    setGpsError(null);
    if (!navigator.geolocation) {
      setGpsError('Geolocation is not supported in this browser. Search by postal code instead.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          if (!isWithinSingapore(pos.coords.latitude, pos.coords.longitude)) {
            setGpsError(SG_ONLY_LOCATION_MESSAGE);
            return;
          }
          const rev = await reverseGeocodeSingapore(pos.coords.latitude, pos.coords.longitude);
          beginDraft({
            line1: rev.line1,
            postal_code: rev.postal_code,
            lat: rev.lat,
            lng: rev.lng,
            source: 'gps',
          });
        } catch (e: unknown) {
          setGpsError((e as Error)?.message ?? 'Could not resolve address from GPS.');
        } finally {
          setLocating(false);
        }
      },
      (err) => {
        setLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGpsError('Location permission denied. Enable location in browser settings or search by postal code.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setGpsError('GPS signal unavailable. Try again or search by postal code.');
        } else if (err.code === err.TIMEOUT) {
          setGpsError('Location timed out. Try again or search by postal code.');
        } else {
          setGpsError('Could not get your location. Search by postal code instead.');
        }
      },
      { enableHighAccuracy: false, timeout: 15000 }
    );
  };

  const onConfirm = () => {
    if (!draft?.line1 || draft.lat == null || draft.lng == null || !draft.label) return;
    setBusy(true);
    try {
      saveNew({
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
      alert((e as Error)?.message ?? 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const onQuickPickArea = (areaName: string) => {
    const entry = SG_QUICK_PICK_AREAS.find((a) => a.name === areaName);
    if (!entry) return;
    setBusy(true);
    try {
      saveNew(savedAddressFromSgArea(entry));
      router.back();
    } catch (e: unknown) {
      alert((e as Error)?.message ?? 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  // Web-native layout mirroring LocationPickerExperience (RN component not used on web)
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-16" data-testid="location-screen">
      <button type="button" onClick={() => (step === 2 ? setStep(1) : router.back())} className="mb-4 font-bold" data-testid="location-back-btn">
        ← Back
      </button>
      <h1 className="text-2xl font-black">Where will you collect?</h1>
      <p className="text-sm text-muted-foreground font-medium mt-1">
        Singapore HDB pickup only — we sort kitchens and dishes by distance to your pin.
      </p>

      {step === 1 && (
        <div data-testid="location-step-find" className="mt-6 space-y-4">
          <button type="button" onClick={onUseGps} disabled={locating} className="shc-input w-full text-left font-bold" data-testid="location-use-gps">
            {locating ? 'Getting GPS…' : '📍 Use my current location'}
          </button>
          {gpsError ? (
            <p className="text-sm font-semibold text-red-600" data-testid="location-gps-error">
              {gpsError}
            </p>
          ) : null}

          <div>
            <p className="text-sm font-bold mb-1">Quick pick — your area</p>
            <p className="text-xs text-muted-foreground font-semibold mb-2">
              One tap to browse nearby kitchens. Add your block at checkout.
            </p>
            <div className="flex flex-wrap gap-2" data-testid="location-quick-areas">
              {SG_QUICK_PICK_AREAS.map((entry) => (
                <button
                  key={entry.name}
                  type="button"
                  disabled={busy}
                  onClick={() => onQuickPickArea(entry.name)}
                  className="rounded-full border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 text-xs font-extrabold hover:bg-muted"
                  data-testid={`location-quick-area-${entry.name.replace(/\s+/g, '-')}`}
                >
                  {entry.name.split(' / ')[0]}
                </button>
              ))}
            </div>
          </div>
          {saved.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">Saved</p>
              {saved.map((addr) => (
                <div key={addr.id} className="flex gap-2 mb-2">
                  <button
                    type="button"
                    className="shc-input flex-1 text-left"
                    onClick={() => {
                      setActive(addr);
                      router.back();
                    }}
                    data-testid={`saved-addr-${addr.id}`}
                  >
                    <span className="font-bold capitalize">{addr.label}</span>
                    <span className="block text-xs text-muted-foreground">{addr.line1}</span>
                  </button>
                  <button
                    type="button"
                    className="shc-input px-3 text-xs font-bold text-red-600 shrink-0"
                    onClick={() => removeSaved(addr.id)}
                    data-testid={`saved-addr-delete-${addr.id}`}
                    aria-label={`Delete ${addr.label}`}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
          <div className="flex gap-2">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Postal, block, area…"
              className="shc-input flex-1"
              data-testid="location-search-input"
            />
            <button type="button" onClick={() => void runSearch()} className="shc-btn-primary px-4 rounded-lg font-bold border-2 border-[var(--shc-border-brutal)]" data-testid="location-search-btn">
              Go
            </button>
          </div>
          {searching && <p className="text-sm text-muted-foreground">Searching Singapore…</p>}
          {searchNotice ? (
            <p className="text-sm font-semibold text-muted-foreground rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-peach)] px-3 py-2">
              {searchNotice}
            </p>
          ) : null}
          {results.map((r) => (
            <button
              key={r.id}
              type="button"
              className="shc-input w-full text-left"
              onClick={() =>
                beginDraft({ line1: r.line1, postal_code: r.postal_code, lat: r.lat, lng: r.lng, source: 'search' })
              }
              data-testid={`location-result-${r.id}`}
            >
              <span className="font-bold">{r.title}</span>
              <span className="block text-xs text-muted-foreground">{r.subtitle}</span>
            </button>
          ))}
        </div>
      )}

      {step === 2 && draft && (
        <div data-testid="location-step-confirm" className="mt-6 space-y-3">
          <iframe title="Map" src={mapSrc} className="w-full h-56 rounded-xl border-2 border-[var(--shc-border-brutal)]" data-testid="location-map" />
          <div className="grid grid-cols-3 gap-2" data-testid="location-pin-nudge">
            <button type="button" className="shc-input py-2 text-xs font-bold" onClick={() => nudgePin(0.001, 0)}>
              N ↑
            </button>
            <button type="button" className="shc-input py-2 text-xs font-bold" onClick={() => nudgePin(-0.001, 0)}>
              S ↓
            </button>
            <button type="button" className="shc-input py-2 text-xs font-bold" onClick={() => nudgePin(0, 0.001)}>
              E →
            </button>
          </div>
          <p className="text-[11px] font-semibold text-muted-foreground">Drag pin on map or nudge to refine collection point.</p>
          <input value={draft.line1 ?? ''} onChange={(e) => setDraft({ ...draft, line1: e.target.value })} className="shc-input w-full" placeholder="Block & street" data-testid="location-line1" />
          <input value={draft.line2 ?? ''} onChange={(e) => setDraft({ ...draft, line2: e.target.value })} className="shc-input w-full" placeholder="Unit #05-123" data-testid="location-line2" />
          <input
            value={draft.postal_code ?? ''}
            onChange={(e) => setDraft({ ...draft, postal_code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
            className="shc-input w-full"
            placeholder="Postal code"
            data-testid="location-postal"
          />
          <textarea
            value={draft.instructions ?? ''}
            onChange={(e) => setDraft({ ...draft, instructions: e.target.value })}
            className="shc-input w-full min-h-[72px]"
            placeholder="Collection notes"
            data-testid="location-instructions"
          />
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className="shc-btn-primary w-full py-3 rounded-lg font-black border-2 border-[var(--shc-border-brutal)]"
            data-testid="location-confirm-btn"
          >
            {busy ? 'Saving…' : 'Save collection location'}
          </button>
        </div>
      )}
    </div>
  );
}