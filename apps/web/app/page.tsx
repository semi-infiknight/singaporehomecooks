'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { useProducts } from '../lib/useProducts';
import { SHCButton, SHCCard, SHCBadge, CalorieBadge, SHCSkeletonGrid, SHCEmptyState, TrustStrip } from './components/SHCWebComponents';

const occasions = [
  'Hari Raya',
  'Deepavali',
  'Chinese New Year',
  'Family Gathering',
  'Birthday',
  'Christmas',
  'Full Moon / Baby Full Month',
];

const calOpts = [
  { label: 'All portions', val: undefined as number | undefined },
  { label: 'Light · ≤400 cal', val: 400 },
  { label: 'Moderate · ≤550 cal', val: 550 },
];

export default function DiscoverHome() {
  const [query, setQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [maxCal, setMaxCal] = useState<number | undefined>(undefined);
  const { data: products = [], isLoading } = useProducts(query, {
    occasion: occasionFilter || undefined,
    maxCal,
  });

  const featuredCooks = useMemo(() => {
    const seen = new Set<string>();
    const cooks: Array<{ id: string; name: string; area: string; cuisine: string }> = [];
    for (const p of products as Array<{ cook_id?: string; cook_name?: string; cuisine?: string }>) {
      const id = p.cook_id || p.cook_name || '';
      if (!id || seen.has(id)) continue;
      seen.add(id);
      cooks.push({
        id: id.replace('cook_', ''),
        name: p.cook_name || 'Home cook',
        area: 'Singapore',
        cuisine: p.cuisine || 'Heritage',
      });
      if (cooks.length >= 4) break;
    }
    return cooks;
  }, [products]);

  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-bg border-b border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-14 md:py-20">
          <div className="max-w-2xl">
            <p className="text-sm font-medium text-primary uppercase tracking-wider mb-3">
              Heritage in every dish
            </p>
            <h1 className="shc-display text-4xl md:text-5xl font-semibold tracking-tight text-foreground leading-[1.1]">
              Home-cooked Singapore food for your next occasion
            </h1>
            <p className="text-lg text-muted-foreground mt-4 leading-relaxed">
              Peranakan, Malay, Eurasian and more — from verified cooks in Tampines, Katong and across the island.
              Order ahead, collect from HDB, pay with PayNow.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <a href="#discover">
                <SHCButton size="lg">Browse dishes</SHCButton>
              </a>
              <Link href="/content/trust">
                <SHCButton size="lg" variant="outline">
                  How we keep you safe
                </SHCButton>
              </Link>
            </div>
          </div>
          <div className="mt-10">
            <TrustStrip />
          </div>
        </div>
      </section>

      {/* Discover */}
      <section id="discover" className="max-w-6xl mx-auto px-4 py-10 md:py-14">
        <div className="mb-8">
          <h2 className="shc-display text-2xl md:text-3xl font-semibold text-[#2C2416]">Find your occasion meal</h2>
          <p className="text-[#5C5144] mt-1">Search by dish, cuisine, or occasion — one cook per order</p>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5C5144]" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try nasi lemak, buah keluak, Hari Raya spread…"
            className="shc-input pl-12 text-base"
            data-testid="search-input-web"
            aria-label="Search heritage dishes and cooks"
          />
        </div>

        <div className="mb-5">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5144] mb-2">Occasion</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setOccasionFilter('')}
              className={`shc-chip ${!occasionFilter ? 'shc-chip-active' : 'shc-chip-inactive'}`}
            >
              All
            </button>
            {occasions.map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOccasionFilter(o)}
                className={`shc-chip ${occasionFilter === o ? 'shc-chip-active' : 'shc-chip-inactive'}`}
              >
                {o}
              </button>
            ))}
          </div>
        </div>

        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[#5C5144] mb-2">Portion size</p>
          <div className="flex flex-wrap gap-2">
            {calOpts.map((opt, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setMaxCal(opt.val)}
                className={`shc-chip ${maxCal === opt.val ? 'shc-chip-active' : 'shc-chip-inactive'}`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {featuredCooks.length > 0 && !query && !occasionFilter && (
          <div className="mb-10">
            <h3 className="text-sm font-semibold text-[#5C5144] uppercase tracking-wider mb-3">Featured cooks</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 -mx-1 px-1">
              {featuredCooks.map((c) => (
                <Link
                  key={c.id}
                  href={`/cook/${c.id}`}
                  className="shrink-0 w-44 p-4 bg-white border border-[#E8D5B7] rounded-xl hover:shadow-md transition-shadow"
                >
                  <div className="w-10 h-10 rounded-full bg-[#F5F0E6] flex items-center justify-center text-[#8B5E3C] font-semibold text-sm mb-2">
                    {c.name.charAt(0)}
                  </div>
                  <div className="font-medium text-sm text-[#2C2416] line-clamp-1">{c.name}</div>
                  <div className="text-xs text-[#5C5144] mt-0.5">{c.cuisine}</div>
                </Link>
              ))}
            </div>
          </div>
        )}

        <h3 className="text-lg font-semibold text-[#2C2416] mb-4">
          {occasionFilter ? `Dishes for ${occasionFilter}` : 'Heritage dishes'}
          {maxCal ? ` · up to ${maxCal} cal` : ''}
        </h3>

        {isLoading && <SHCSkeletonGrid />}
        {!isLoading && products.length === 0 && (
          <SHCEmptyState
            title="No dishes match your search"
            description="Try a different occasion, clear your filters, or search for a classic like nasi lemak or chap chye."
            action={
              <SHCButton
                variant="outline"
                onClick={() => {
                  setQuery('');
                  setOccasionFilter('');
                  setMaxCal(undefined);
                }}
              >
                Clear filters
              </SHCButton>
            }
          />
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {(products as Array<Record<string, unknown>>).map((p) => {
            const cal = (p.calories as number) || 450;
            const cookSlug = String(p.cook_id || '').replace('cook_', '');
            return (
              <SHCCard key={String(p.id)} hover className="flex flex-col">
                <Link href={`/product/${p.id}`} className="block flex-1">
                  <div className="font-semibold text-lg text-[#2C2416] leading-snug">{String(p.name)}</div>
                  <div className="text-sm text-[#B85C38] mt-1">
                    {String(p.cook_name)} · S${String(p.price)} / portion
                  </div>
                  <p className="text-sm text-[#5C5144] mt-2 line-clamp-2 leading-relaxed">{String(p.heritage_note)}</p>
                </Link>
                <div className="flex items-center gap-2 mt-4 flex-wrap">
                  <SHCBadge variant="heritage">{String(p.cuisine)}</SHCBadge>
                  <CalorieBadge calories={cal} />
                  {Boolean(p.halal) && <SHCBadge variant="success">Halal</SHCBadge>}
                  <span className="text-xs text-[#5C5144]">Min {String(p.min_qty)} portions</span>
                </div>
                {(p.occasion_tags as string[] | undefined)?.length ? (
                  <p className="text-xs text-[#1D9E75] mt-2">
                    Great for {(p.occasion_tags as string[]).join(', ')}
                  </p>
                ) : null}
                <div className="flex gap-2 mt-4 pt-4 border-t border-[#E8D5B7]/60">
                  {cookSlug && (
                    <Link href={`/cook/${cookSlug}`}>
                      <SHCButton size="sm" variant="ghost">
                        Meet the cook
                      </SHCButton>
                    </Link>
                  )}
                  <Link href={`/product/${p.id}`} className="ml-auto">
                    <SHCButton size="sm">View & order</SHCButton>
                  </Link>
                </div>
              </SHCCard>
            );
          })}
        </div>
      </section>

      {/* How it works */}
      <section className="bg-secondary border-y border-border/50">
        <div className="max-w-6xl mx-auto px-4 py-14">
          <h2 className="shc-display text-2xl font-semibold text-[#2C2416] mb-8">How it works</h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', title: 'Discover', desc: 'Browse by occasion or search heritage dishes from verified home cooks.' },
              { step: '2', title: 'Order safely', desc: 'Acknowledge allergens, pick a collection slot — one cook per cart.' },
              { step: '3', title: 'Pay with PayNow', desc: 'Transfer to our UEN with your order reference. Chat opens right away.' },
              { step: '4', title: 'Collect & enjoy', desc: 'Address shared 2h before your slot. Earn 5% Home Credits after collection.' },
            ].map((item) => (
              <div key={item.step}>
                <div className="w-8 h-8 rounded-full bg-[#1D9E75] text-white flex items-center justify-center text-sm font-bold mb-3">
                  {item.step}
                </div>
                <h3 className="font-semibold text-[#2C2416]">{item.title}</h3>
                <p className="text-sm text-[#5C5144] mt-1 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-8">
            <Link href="/content/trust" className="text-sm text-[#1D9E75] font-medium hover:underline">
              Read our full Trust & Safety policy →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}