'use client';

/**
 * Customer area list — nearby kitchens only (no map pin).
 */
import React, { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { SHCSavedAddress } from '@shc/types';
import {
  reverseGeocodeSingapore,
  searchSingaporeAddresses,
  formatLocationLabel,
  SG_ONLY_LOCATION_MESSAGE,
  isWithinSingapore,
  type AddressSearchResult,
} from '@shc/utils';
import { useCustomerLocation } from '../../lib/useCustomerLocation';

const EMOJI_OPTIONS = ['🏠', '🏢', '🏫', '❤️', '⭐', '📍', '🛒', '☕'] as const;

type PendingArea = {
  line1: string;
  line2?: string;
  postal_code?: string;
  lat: number;
  lng: number;
  source: SHCSavedAddress['source'];
  editId?: string;
};

function isEmojiLabel(label: string): boolean {
  const t = label.trim();
  return t.length > 0 && t.length <= 4 && !/^[a-zA-Z0-9]/.test(t);
}

export default function LocationPage() {
  const router = useRouter();
  const { saved, activeId, saveNew, updateSaved, setActive, removeSaved } = useCustomerLocation();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<AddressSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [busy, setBusy] = useState(false);
  const [pending, setPending] = useState<PendingArea | null>(null);
  const [emoji, setEmoji] = useState('🏠');
  const [error, setError] = useState<string | null>(null);

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
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const t = setTimeout(() => {
      if (/^\d{6}$/.test(q) || q.length >= 3) void runSearch();
    }, /^\d{6}$/.test(q) ? 100 : 400);
    return () => clearTimeout(t);
  }, [query, runSearch]);

  const openEmojiModal = (seed: PendingArea, initial = '🏠') => {
    setEmoji(initial);
    setPending(seed);
    setError(null);
  };

  const confirmEmoji = async () => {
    if (!pending) return;
    const label = (emoji || '📍').trim().slice(0, 8) || '📍';
    const isEdit = Boolean(pending.editId);
    setBusy(true);
    setError(null);
    try {
      if (pending.editId) {
        updateSaved(pending.editId, { label });
      } else {
        await saveNew({
          label,
          line1: pending.line1,
          line2: pending.line2,
          postal_code: pending.postal_code,
          lat: pending.lat,
          lng: pending.lng,
          source: pending.source,
        });
      }
      setPending(null);
      setQuery('');
      setResults([]);
      if (!isEdit) router.back();
    } catch (e: unknown) {
      setError((e as Error)?.message ?? 'Could not save');
    } finally {
      setBusy(false);
    }
  };

  const onUseGps = () => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('Location is not available in this browser.');
      return;
    }
    setLocating(true);
    setError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void (async () => {
          try {
            const lat = pos.coords.latitude;
            const lng = pos.coords.longitude;
            if (!isWithinSingapore(lat, lng)) {
              setError(SG_ONLY_LOCATION_MESSAGE);
              return;
            }
            let line1 = 'Near me, Singapore';
            let postal_code: string | undefined;
            try {
              const rev = await reverseGeocodeSingapore(lat, lng);
              if ((rev.line1 || '').trim().length >= 3) line1 = rev.line1.trim();
              if (rev.postal_code && /^\d{6}$/.test(rev.postal_code)) postal_code = rev.postal_code;
            } catch {
              /* coords enough */
            }
            openEmojiModal({ line1, postal_code, lat, lng, source: 'gps' });
          } finally {
            setLocating(false);
          }
        })();
      },
      () => {
        setLocating(false);
        setError('Location permission denied — search instead.');
      },
      { enableHighAccuracy: false, timeout: 12000, maximumAge: 60_000 }
    );
  };

  const showDropdown = query.trim().length >= 2;

  return (
    <div className="min-h-[100dvh] bg-white max-w-lg mx-auto" data-testid="location-screen">
      <div className="px-4 pt-4 pb-2">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-2xl font-bold text-foreground w-10 h-10"
          data-testid="location-back"
          aria-label="Back"
        >
          ←
        </button>
      </div>

      <div className="px-5 pb-10">
        <h1 className="text-[22px] font-extrabold tracking-tight text-foreground mb-5 leading-snug">
          Enter your area or apartment name
        </h1>

        <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#FAFAFA] pl-3 pr-1.5 min-h-12 mb-4">
          <span className="text-muted-foreground text-lg" aria-hidden>
            ⌕
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try Tampines, Bishan, 520456…"
            className="flex-1 bg-transparent text-[15px] font-medium outline-none py-3"
            data-testid="location-search-input"
            onKeyDown={(e) => {
              if (e.key === 'Enter') void runSearch();
            }}
          />
          <button
            type="button"
            onClick={() => void runSearch()}
            className="w-9 h-9 rounded-full bg-[var(--shc-primary,#F87048)] text-white text-xl font-semibold flex items-center justify-center"
            data-testid="location-search-add"
            aria-label="Search"
          >
            +
          </button>
        </div>

        {showDropdown ? (
          <div className="mb-4 rounded-xl border border-black/10 overflow-hidden" data-testid="location-search-results">
            {searching && results.length === 0 ? (
              <p className="p-3 text-xs font-semibold text-muted-foreground">Searching…</p>
            ) : results.length === 0 ? (
              <p className="p-3 text-xs font-semibold text-muted-foreground">No matches</p>
            ) : (
              results.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() =>
                    openEmojiModal({
                      line1: r.line1,
                      postal_code: r.postal_code,
                      lat: r.lat,
                      lng: r.lng,
                      source: 'search',
                    })
                  }
                  className="w-full text-left px-3.5 py-3 border-t border-black/5 hover:bg-muted/40"
                  data-testid={`location-result-${r.id}`}
                >
                  <p className="text-sm font-bold">{r.title || r.line1}</p>
                  {r.subtitle ? <p className="text-xs text-muted-foreground mt-0.5">{r.subtitle}</p> : null}
                </button>
              ))
            )}
          </div>
        ) : null}

        {error ? <p className="text-sm font-bold text-destructive mb-3">{error}</p> : null}

        <button
          type="button"
          onClick={onUseGps}
          disabled={locating}
          className="w-full flex items-center gap-3 py-4 text-left disabled:opacity-60"
          data-testid="location-use-gps"
        >
          <span className="text-primary font-bold w-6 text-center">➤</span>
          <span className="flex-1 text-base font-bold text-primary">
            {locating ? 'Detecting…' : 'Use my current location'}
          </span>
          <span className="text-muted-foreground text-xl">›</span>
        </button>

        {saved.length > 0 ? (
          <>
            <div className="h-px bg-black/10 my-1" />
            {saved.map((addr) => {
              const active = addr.id === activeId;
              const pin = isEmojiLabel(addr.label) ? addr.label.trim() : '📍';
              const full = formatLocationLabel(addr);
              return (
                <div
                  key={addr.id}
                  className={`flex items-stretch gap-0 rounded-xl overflow-hidden ${
                    active ? 'bg-[#FFF5F0]' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={async () => {
                      await setActive(addr);
                      router.back();
                    }}
                    onContextMenu={(e) => {
                      e.preventDefault();
                      openEmojiModal(
                        {
                          editId: addr.id,
                          line1: addr.line1,
                          line2: addr.line2,
                          postal_code: addr.postal_code,
                          lat: addr.lat,
                          lng: addr.lng,
                          source: addr.source,
                        },
                        pin
                      );
                    }}
                    className="flex-1 flex items-center gap-3 py-3.5 px-2 text-left min-w-0"
                    data-testid={`location-saved-${addr.id}`}
                  >
                    <span
                      className={`w-11 h-11 rounded-full flex items-center justify-center text-xl shrink-0 ${
                        active ? 'bg-[var(--shc-primary,#F87048)]' : 'bg-[#FFE8DE]'
                      }`}
                    >
                      {pin}
                    </span>
                    <span className="flex-1 min-w-0">
                      <span className="block text-[15px] font-bold text-foreground leading-snug">{full}</span>
                      {active ? (
                        <span className="inline-block mt-1 text-[10px] font-black uppercase tracking-wide text-white bg-[var(--shc-primary,#F87048)] px-2 py-0.5 rounded-full">
                          Selected
                        </span>
                      ) : null}
                    </span>
                    {active ? (
                      <span className="text-primary font-black text-lg">✓</span>
                    ) : (
                      <span className="text-muted-foreground text-xl">›</span>
                    )}
                  </button>
                  <button
                    type="button"
                    className="px-4 bg-red-600 text-white text-xs font-black shrink-0"
                    onClick={() => void removeSaved(addr.id)}
                    aria-label="Delete"
                  >
                    Delete
                  </button>
                </div>
              );
            })}
          </>
        ) : null}
      </div>

      {pending ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/40" data-testid="location-tag-modal">
          <div className="w-full max-w-lg rounded-t-2xl bg-white p-5 pb-8 shadow-xl">
            <p className="text-lg font-black text-foreground mb-2">
              {pending.editId ? 'Change emoji' : 'Pick an emoji'}
            </p>
            <p className="text-sm font-semibold text-muted-foreground mb-4 line-clamp-3">{pending.line1}</p>
            <div className="flex flex-wrap gap-2.5 mb-5">
              {EMOJI_OPTIONS.map((e) => {
                const on = emoji === e;
                return (
                  <button
                    key={e}
                    type="button"
                    onClick={() => setEmoji(e)}
                    className={`w-13 h-13 w-[52px] h-[52px] rounded-xl border-2 text-2xl ${
                      on
                        ? 'border-[var(--shc-primary,#F87048)] bg-[#FFF5F0]'
                        : 'border-black/10 bg-[#FAFAFA]'
                    }`}
                  >
                    {e}
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={() => void confirmEmoji()}
              disabled={busy}
              className="w-full min-h-[52px] rounded-2xl bg-[var(--shc-primary,#F87048)] text-white text-base font-black disabled:opacity-50"
              data-testid="location-tag-save"
            >
              {busy ? 'Saving…' : pending.editId ? 'Update' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setPending(null)}
              className="w-full py-3 text-sm font-bold text-muted-foreground"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
