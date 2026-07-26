'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  getCookKitchenHeroUrl,
  kitchenDishPriceDollars,
  kitchenCardOpenProps,
} from '@shc/utils';
import { useCustomerLocation } from '../../lib/useCustomerLocation';
import { useTiffinKitchens, useTiffinSubscription, tiffinPricePerServing } from '../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCSkeletonKitchenList,
  TiffinHeroBanner,
  TiffinCategoryRow,
  TiffinFilterChips,
  TiffinKitchenCard,
  TiffinEmptyState,
  TiffinHowItWorks,
} from '../components/SHCWebComponents';
import { VirtualRowList } from '../components/VirtualLists';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'halal', label: 'Halal' },
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
  const { data: kitchens = [], isLoading } = useTiffinKitchens();
  const { data: subData } = useTiffinSubscription();
  const { active: location, locationLabel } = useCustomerLocation();
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
          (k.cook?.area || '').toLowerCase().includes(q) ||
          (k.dishes || []).some((d: any) => (d.name || d.cuisine || '').toLowerCase().includes(q))
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
    if (filter === 'nearest' && location) {
      list.sort((a, b) => {
        const aMatch = (a.cook?.area || '').includes(locationLabel || '') ? 0 : 1;
        const bMatch = (b.cook?.area || '').includes(locationLabel || '') ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    if (filter === 'halal') {
      list = list.filter((k) =>
        (k.dishes || []).some((d: any) => Boolean(d.halal)) || Boolean(k.cook?.halal)
      );
    }
    return list;
  }, [kitchens, query, filter, category, location, locationLabel]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 shc-safe-bottom-pad" data-testid="tiffin-browse-screen">
      <div className="flex items-center gap-2 mb-3">
        <Link href="/" className="text-2xl font-light text-foreground leading-none px-1" aria-label="Back">
          ‹
        </Link>
        <Link
          href="/location"
          className="flex-1 flex items-center gap-1.5 rounded-xl border border-[var(--shc-border)] bg-card px-3 py-2 shadow-[var(--shc-shadow-soft)]"
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

      <div className="mb-4">
        <TiffinHeroBanner />
      </div>

      <TiffinHowItWorks />

      {sub ? (
        <div data-testid="tiffin-active-banner">
          <SHCCard className="mb-4">
            <p className="font-bold text-sm mb-3">You have an active tiffin plan</p>
            <div className="flex flex-wrap gap-2">
              <SHCButton size="sm" onClick={() => router.push('/tiffin/manage')} testID="tiffin-go-manage-btn">
                Manage subscription
              </SHCButton>
              <SHCButton
                size="sm"
                variant="outline"
                onClick={() => router.push('/tiffin/subscriptions')}
                testID="tiffin-my-subs-btn"
              >
                My Subscriptions
              </SHCButton>
            </div>
          </SHCCard>
        </div>
      ) : (
        <div className="mb-4" data-testid="tiffin-empty-subs-link">
          <SHCButton
            size="sm"
            variant="outline"
            onClick={() => router.push('/tiffin/subscriptions')}
            testID="tiffin-my-subs-btn"
          >
            My Subscriptions
          </SHCButton>
        </div>
      )}

      <div className="relative mb-4">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">⌕</span>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search kitchen, meal or cuisine"
          data-testid="tiffin-search-input"
          className="w-full rounded-full border border-[var(--shc-border)] bg-card pl-9 pr-3 py-3 text-sm font-medium shadow-[var(--shc-shadow-soft)] outline-none"
        />
      </div>

      <TiffinCategoryRow categories={CATEGORIES} activeId={category} onSelect={setCategory} />

      <div className="mb-3">
        <TiffinFilterChips chips={FILTERS} activeId={filter} onSelect={setFilter} testID="tiffin-filter-chips" />
      </div>

      <div className="rounded-2xl shc-bg-offer text-white p-4 mb-4" data-testid="tiffin-offer-card">
        <p className="font-black text-base">First week on us ✨</p>
        <p className="text-xs font-semibold opacity-90 mt-1">
          New tiffin subscribers — flexible 2–4 meals/week from one kitchen.
        </p>
      </div>

      {isLoading ? (
        <SHCSkeletonKitchenList count={4} />
      ) : filtered.length === 0 ? (
        <TiffinEmptyState
          title="No kitchens match"
          subtitle="Try another cuisine or clear search."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setFilter('all');
            setCategory('all');
          }}
        />
      ) : (
        <VirtualRowList
          items={filtered}
          getKey={(k: { cook_id: string }) => k.cook_id}
          testID="tiffin-kitchen-list"
          renderItem={(k: any) => {
            const name = k.cook?.display_name || 'Home kitchen';
            const prices = (k.dishes || [])
              .map((d: any) => kitchenDishPriceDollars(d))
              .filter((n: number | null): n is number => n != null && n > 0);
            const from = prices.length ? Math.min(...prices) : tiffinPricePerServing(3);
            const to = prices.length ? Math.max(...prices) : tiffinPricePerServing(2);
            const openProps = kitchenCardOpenProps({
              display_name: name,
              area: k.cook?.area,
              status: k.enabled === false ? 'paused' : 'active',
              collection_instructions: k.cook?.collection_instructions,
            });
            return (
              <TiffinKitchenCard
                cookId={k.cook_id}
                cookName={name}
                area={k.cook?.area}
                tagline={k.tagline || 'Weekly home-cooked meals'}
                coverUri={getCookKitchenHeroUrl(k.cook_id)}
                rating={k.cook?.rating != null ? Number(k.cook.rating) : undefined}
                subscriberCount={k.subscriber_count}
                priceFrom={Math.round(from)}
                priceTo={Math.round(to)}
                {...openProps}
                onPress={() => router.push(`/tiffin/kitchen/${k.cook_id}`)}
                testID={`tiffin-kitchen-${k.cook_id}`}
              />
            );
          }}
        />
      )}

      <div className="mt-6 text-center">
        <Link href="/" className="text-sm font-bold text-primary underline">
          Back to discover
        </Link>
      </div>
    </div>
  );
}
