'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useAuth } from '../../lib/useAuth';
import { productMatchesOccasion } from '@shc/utils';
import {
  SHCButton,
  SHCPageHeader,
  GourmeatDishCard,
  SearchResultsDropdown,
  type DishCardProduct,
} from '../components/SHCWebComponents';

export default function SearchPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [halalOnly, setHalalOnly] = useState(false);
  const [maxCal, setMaxCal] = useState<number | undefined>(700);
  const { data: products = [], isLoading } = useProducts('');
  const addMut = useAddToCart();

  const results = useMemo(() => {
    let list = products as DishCardProduct[];
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter((p) => {
        const name = String(p.name || '').toLowerCase();
        const cook = String(p.cook_name || '').toLowerCase();
        return name.includes(ql) || cook.includes(ql) || String(p.id || '').toLowerCase().includes(ql);
      });
    }
    if (occ) list = list.filter((p) => productMatchesOccasion((p as { occasion_tags?: string[] }).occasion_tags, occ));
    if (halalOnly) list = list.filter((p) => Boolean((p as { halal?: boolean }).halal));
    if (maxCal != null) list = list.filter((p) => ((p as { calories?: number }).calories || 999) <= maxCal);
    return list;
  }, [products, q, occ, halalOnly, maxCal]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 pb-28">
      <SHCPageHeader title="Advanced Search" subtitle={`${user?.name || 'Guest'} · filters & ADD`} />
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search dishes, cooks…"
        className="w-full px-4 py-3 rounded-full bg-card border border-border shadow-[var(--shc-shadow-soft)] text-sm font-medium mb-4"
        data-testid="search-input"
      />

      {q.trim() && (
        <div className="relative mb-4">
          <SearchResultsDropdown
            query={q}
            products={results}
            onAdd={(id) => addMut.mutate({ productId: id, qty: 1 })}
            onClear={() => setQ('')}
          />
        </div>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {['', 'Hari Raya', 'Deepavali', 'Chinese New Year'].map((o) => (
          <button
            key={o || 'all'}
            type="button"
            onClick={() => setOcc(o)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border ${occ === o ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          >
            {o || 'All occasions'}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setHalalOnly((v) => !v)}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${halalOnly ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
          data-testid="halal-filter"
        >
          Halal
        </button>
        <button
          type="button"
          onClick={() => setMaxCal((v) => (v === 500 ? undefined : 500))}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border ${maxCal === 500 ? 'bg-primary text-primary-foreground border-primary' : 'bg-card border-border'}`}
        >
          Light (&lt;500 cal)
        </button>
      </div>

      <p className="text-sm font-bold text-muted-foreground mb-3">{isLoading ? 'Loading…' : `${results.length} results`}</p>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {results.map((p) => (
          <GourmeatDishCard key={p.id} product={p} />
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <SHCButton variant="outline" onClick={() => router.back()}>Back</SHCButton>
        <Link href="/" className="text-sm font-semibold text-primary self-center">Discover home</Link>
      </div>
    </div>
  );
}