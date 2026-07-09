'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCookAvatarUrl, getDishImageUrl } from '@shc/utils';
import { useAuth } from '../../lib/useAuth';
import { useCustomerLocation } from '../../lib/useCustomerLocation';
import { useTiffinKitchens, useTiffinSubscription, tiffinPricePerServing } from '../../lib/useTiffin';
import { SHCButton, SHCCard, SHCEmptyState } from '../components/SHCWebComponents';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'popular', label: 'Top rated' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🏠' },
  { id: 'Peranakan', label: 'Peranakan', emoji: '🦞' },
  { id: 'Malay', label: 'Malay', emoji: '🍛' },
  { id: 'Indian', label: 'Indian', emoji: '🫓' },
  { id: 'Chinese', label: 'Chinese', emoji: '🥟' },
  { id: 'Eurasian', label: 'Eurasian', emoji: '🍲' },
];

export default function TiffinBrowsePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: kitchens = [], isLoading } = useTiffinKitchens();
  const { data: subData } = useTiffinSubscription();
  const { locationLabel } = useCustomerLocation();
  const sub = (subData as { subscription?: { cook_id?: string } } | undefined)?.subscription;

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    let list = [...(kitchens as any[])];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (k) =>
          (k.cook?.display_name || '').toLowerCase().includes(q) ||
          (k.tagline || '').toLowerCase().includes(q) ||
          (k.cook?.area || '').toLowerCase().includes(q)
      );
    }
    if (category !== 'all') {
      list = list.filter((k) =>
        (k.dishes || []).some((d: any) => (d.cuisine || '').toLowerCase() === category.toLowerCase())
      );
    }
    if (filter === 'popular') {
      list.sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0));
    }
    return list;
  }, [kitchens, query, filter, category]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28" data-testid="tiffin-browse-screen">
      {/* Location chrome — HomelyEats header */}
      <div className="flex items-center gap-2 mb-3">
        <Link href="/" className="text-2xl font-light text-foreground leading-none px-1" aria-label="Back">
          ‹
        </Link>
        <Link
          href="/location"
          className="flex-1 flex items-center gap-1.5 rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-3 py-2 shadow-[var(--shc-shadow-brutal-sm)]"
          data-testid="tiffin-location-chip"
        >
          <span aria-hidden>📍</span>
          <span className="text-sm font-bold truncate flex-1">{locationLabel || 'Set collection location'}</span>
          <span className="text-xs text-muted-foreground">▾</span>
        </Link>
      </div>

      <h1 className="text-2xl font-black text-foreground mb-3" data-testid="tiffin-browse-header">
        {filtered.length} kitchen{filtered.length === 1 ? '' : 's'} near you
      </h1>

      {/* Promo banner — HomelyEats #1 */}
      <div
        className="rounded-2xl p-4 mb-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
        style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
        data-testid="tiffin-hero-banner"
      >
        <p className="font-black text-lg">No time to cook?</p>
        <p className="font-extrabold text-base opacity-95 mb-2">Explore tiffin plans</p>
        <ul className="text-sm font-semibold space-y-0.5 opacity-90">
          <li>· Nutritious home-cooked meals from HDB kitchens</li>
          <li>· Heritage cuisines — Peranakan, Malay, Indian & more</li>
          <li>· Flexible 2 · 3 · 4 meals per week</li>
        </ul>
      </div>

      {sub ? (
        <div data-testid="tiffin-active-banner">
          <SHCCard className="mb-4">
            <p className="font-bold text-sm mb-3">You have an active tiffin plan</p>
            <SHCButton size="sm" onClick={() => router.push('/tiffin/manage')} testID="tiffin-go-manage-btn">
              Manage subscription
            </SHCButton>
          </SHCCard>
        </div>
      ) : null}

      {/* Search */}
      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search kitchen, meal or cuisine"
          data-testid="tiffin-search-input"
          className="w-full rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card pl-9 pr-3 py-3 text-sm font-semibold"
        />
      </div>

      {/* Categories */}
      <p className="text-xs font-bold text-muted-foreground text-center mb-2">Explore by categories</p>
      <div className="flex gap-3 overflow-x-auto pb-3 mb-3" data-testid="tiffin-category-row">
        {CATEGORIES.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setCategory(c.id)}
            data-testid={`tiffin-cat-${c.id}`}
            className="shrink-0 w-[72px] flex flex-col items-center"
          >
            <span
              className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl border-2 bg-card ${
                category === c.id ? 'border-primary' : 'border-[var(--shc-border-brutal)]'
              }`}
            >
              {c.emoji}
            </span>
            <span className={`text-[11px] font-bold mt-1 ${category === c.id ? 'text-primary' : 'text-muted-foreground'}`}>
              {c.label}
            </span>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-2 overflow-x-auto pb-3 mb-3" data-testid="tiffin-filter-chips">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            onClick={() => setFilter(f.id)}
            className={`shrink-0 rounded-full px-3.5 py-1.5 text-sm font-bold border-2 ${
              filter === f.id
                ? 'bg-primary text-primary-foreground border-primary'
                : 'bg-card border-[var(--shc-border-brutal)]'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Offer card */}
      <div className="rounded-2xl bg-[#1E3A5F] text-white p-4 mb-4" data-testid="tiffin-offer-card">
        <p className="font-black text-base">First week on us ✨</p>
        <p className="text-xs font-semibold opacity-90 mt-1">
          New tiffin subscribers — flexible 2–4 meals/week from one kitchen.
        </p>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10 font-semibold">Loading kitchens…</p>
      ) : filtered.length === 0 ? (
        <SHCEmptyState
          title="No kitchens match"
          description="Try another cuisine or clear search."
          action={
            <SHCButton
              size="sm"
              variant="outline"
              onClick={() => {
                setQuery('');
                setFilter('all');
                setCategory('all');
              }}
            >
              Clear filters
            </SHCButton>
          }
        />
      ) : (
        <ul className="space-y-4">
          {filtered.map((k: any) => {
            const name = k.cook?.display_name || 'Home kitchen';
            const cover =
              k.dishes?.[0]?.image_url ||
              getDishImageUrl({ id: k.dishes?.[0]?.id, name: k.dishes?.[0]?.name, cuisine: k.dishes?.[0]?.cuisine }) ||
              getCookAvatarUrl(k.cook_id, name);
            const prices = (k.dishes || [])
              .map((d: any) => Number(d.price))
              .filter((n: number) => Number.isFinite(n) && n > 0)
              .map((p: number) => (p > 50 ? p / 100 : p));
            const from = prices.length ? Math.min(...prices) : tiffinPricePerServing(3);
            const to = prices.length ? Math.max(...prices) : tiffinPricePerServing(2);
            return (
              <li key={k.cook_id}>
                <button
                  type="button"
                  data-testid={`tiffin-kitchen-${k.cook_id}`}
                  className="w-full text-left rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95 transition-opacity"
                  onClick={() => {
                    if (!user) {
                      router.push(`/login?returnTo=/tiffin/kitchen/${k.cook_id}`);
                      return;
                    }
                    router.push(`/tiffin/kitchen/${k.cook_id}`);
                  }}
                >
                  <div className="relative h-40 w-full bg-muted">
                    <Image src={cover} alt="" fill className="object-cover" sizes="640px" />
                  </div>
                  <div className="p-3">
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-black text-foreground truncate flex-1">{name}</p>
                      <span className="text-xs font-bold shrink-0">★ 4.8</span>
                    </div>
                    <p className="text-sm text-muted-foreground font-semibold line-clamp-1 mt-0.5">
                      {k.tagline || 'Weekly home-cooked meals'}
                      {k.cook?.area ? ` · ${k.cook.area}` : ''}
                    </p>
                    <p className="text-sm font-extrabold text-green-700 mt-1">
                      Open <span className="text-muted-foreground font-semibold">· HDB collection evenings</span>
                    </p>
                    <div className="flex justify-between items-center mt-2 text-sm">
                      <span className="font-black">
                        S${Math.round(from)}–{Math.round(to)}/meal
                      </span>
                      <span className="text-muted-foreground font-semibold">
                        👤 {k.subscriber_count ?? 0} subscribers
                      </span>
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm font-bold text-primary underline">
          Back to discover
        </Link>
      </div>
    </div>
  );
}
