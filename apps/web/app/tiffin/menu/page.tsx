'use client';

import React, { Suspense, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { getDishImageUrl } from '@shc/utils';
import { useTiffinKitchen } from '../../../lib/useTiffin';
import { GourmeatScreenHeader, SHCSkeletonList } from '../../components/SHCWebComponents';
import { VirtualRowList } from '../../components/VirtualLists';

const CUISINE_FILTERS = ['All', 'Peranakan', 'Chinese', 'Malay', 'Indian', 'Western'];

function TiffinMenuContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cookId = String(searchParams.get('cookId') || '');
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId);
  const [filter, setFilter] = useState('All');

  const dishes = useMemo(() => {
    const all = ((kitchen as { dishes?: Array<{ id: string; name: string; price?: number; cuisine?: string; description?: string }> })?.dishes || []).map(
      (d) => ({
        id: d.id,
        name: d.name,
        price: d.price,
        cuisine: d.cuisine,
        description: d.description,
      })
    );
    if (filter === 'All') return all;
    return all.filter((d) => String(d.cuisine || '').toLowerCase().includes(filter.toLowerCase()));
  }, [filter, kitchen]);

  if (!cookId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10 shc-tab-bar-pad" data-testid="tiffin-menu-missing">
        <GourmeatScreenHeader title="Menu" subtitle="Kitchen not found" backHref="/tiffin" />
        <p className="text-sm font-semibold text-muted-foreground mt-4">Open a kitchen from tiffin browse first.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="tiffin-menu-loading">
        <SHCSkeletonList count={4} rowHeight={64} />
      </div>
    );
  }

  const cookName = (kitchen as { cook?: { display_name?: string } })?.cook?.display_name || 'Menu';

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 shc-tab-bar-pad md:pb-8" data-testid="tiffin-menu-screen">
      <GourmeatScreenHeader
        title={cookName}
        subtitle="Culinary inspiration"
        backHref={cookId ? `/tiffin/kitchen/${encodeURIComponent(cookId)}` : '/tiffin'}
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-none">
        {CUISINE_FILTERS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFilter(c)}
            className={`shrink-0 rounded-full px-3.5 py-2 text-xs font-bold border-2 border-[var(--shc-border-brutal)] ${
              filter === c
                ? 'bg-[var(--shc-gourmeat-primary-light,#FFE8E0)] text-primary'
                : 'bg-[var(--shc-surface-alt,#F5F0EB)] text-muted-foreground'
            }`}
            data-testid={`tiffin-menu-filter-${c.toLowerCase()}`}
          >
            {c}
          </button>
        ))}
      </div>

      <VirtualRowList
        items={dishes}
        getKey={(d) => d.id}
        testID="tiffin-menu-list"
        rowHeight={96}
        renderItem={(d) => (
          <button
            type="button"
            onClick={() => router.push(`/product/${encodeURIComponent(d.id)}`)}
            className="flex w-full gap-3 items-center rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3 mb-2 text-left hover:bg-muted/40 transition-colors"
            data-testid={`tiffin-menu-item-${d.id}`}
          >
            <Image
              src={getDishImageUrl({ id: d.id, cuisine: d.cuisine, name: d.name })}
              alt=""
              width={56}
              height={56}
              className="rounded-lg object-cover shrink-0"
            />
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{d.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {d.description || d.cuisine || 'Home-cooked'}
              </p>
            </div>
            {d.price != null ? (
              <span className="font-black text-sm tabular-nums shrink-0">S${Number(d.price).toFixed(2)}</span>
            ) : null}
          </button>
        )}
      />

      {dishes.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground mt-4" data-testid="tiffin-menu-empty">
          No dishes match this filter yet.
        </p>
      ) : null}
    </div>
  );
}

export default function TiffinMenuPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-2xl mx-auto px-4 py-6">
          <SHCSkeletonList count={4} rowHeight={64} />
        </div>
      }
    >
      <TiffinMenuContent />
    </Suspense>
  );
}
