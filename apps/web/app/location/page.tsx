'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SHCSavedAddress } from '@shc/types';
import {
  buildOsmMapPickerHtml,
  reverseGeocodeSingapore,
  searchSingaporeAddresses,
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
  const [draft, setDraft] = useState<Partial<SHCSavedAddress> | null>(null);

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
    if (!navigator.geolocation) {
      alert('Geolocation not supported in this browser.');
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const rev = await reverseGeocodeSingapore(pos.coords.latitude, pos.coords.longitude);
          beginDraft({
            line1: rev.line1,
            postal_code: rev.postal_code,
            lat: rev.lat,
            lng: rev.lng,
            source: 'gps',
          });
        } catch (e: unknown) {
          alert((e as Error)?.message ?? 'Could not resolve address');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        alert('Location permission denied. Search by postal code instead.');
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

  // Web-native layout mirroring LocationPickerExperience (RN component not used on web)
  return (
    <div className="max-w-lg mx-auto px-4 py-6 pb-16" data-testid="location-screen">
      <button type="button" onClick={() => (step === 2 ? setStep(1) : router.back())} className="mb-4 font-bold" data-testid="location-back-btn">
        ← Back
      </button>
      <h1 className="text-2xl font-black">Where will you collect?</h1>
      <p className="text-sm text-muted-foreground font-medium mt-1">HDB collection — cooks near your pin shown first.</p>

      {step === 1 && (
        <div data-testid="location-step-find" className="mt-6 space-y-4">
          <button type="button" onClick={onUseGps} disabled={locating} className="shc-input w-full text-left font-bold" data-testid="location-use-gps">
            {locating ? 'Getting GPS…' : '📍 Use my current location'}
          </button>
          {saved.length > 0 && (
            <div>
              <p className="text-sm font-bold mb-2">Saved</p>
              {saved.map((addr) => (
                <button
                  key={addr.id}
                  type="button"
                  className="shc-input w-full text-left mb-2"
                  onClick={() => {
                    setActive(addr);
                    router.back();
                  }}
                  data-testid={`saved-addr-${addr.id}`}
                >
                  <span className="font-bold capitalize">{addr.label}</span>
                  <span className="block text-xs text-muted-foreground">{addr.line1}</span>
                </button>
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
          {searching && <p className="text-sm text-muted-foreground">Searching…</p>}
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