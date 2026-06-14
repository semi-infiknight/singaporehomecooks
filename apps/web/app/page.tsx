'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useProducts } from '../lib/useProducts';
import { useAuth } from '../lib/useAuth';
import { SHCButton, SHCCard, SHCBadge, SHCSectionTitle } from '../app/components/SHCWebComponents';
// shcColors inlined in components; no direct @shc/ui to keep build clean of RN subdeps for web parity
import { CreditBadge } from '../app/components/SHCWebComponents';

export default function DiscoverHome() {
  const [query, setQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [maxCal, setMaxCal] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts(query, { occasion: occasionFilter || undefined, maxCal });
  const occasions = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Christmas', 'Full Moon / Baby Full Month'];

  const calOpts = [
    {label: 'All', val: undefined},
    {label: '≤400 cal (Green)', val: 400},
    {label: '≤550 (Amber)', val: 550},
  ];

  return (
    <div id="discover">
      <div className="mb-8">
        <h1 className="text-4xl font-semibold tracking-tight mb-1" style={{color: '#2C2416'}}>Singapore Home Cooks</h1>
        <p className="text-lg text-[#5C5144]">Heritage recipes • HDB kitchens (Tampines, Katong/Joo Chiat) • Planned occasions only • One cook per order</p>
        <p className="text-sm mt-1">Welcome, <span className="font-medium">{user.name}</span> ({user.role}). Use DEV switcher above for E2E. <Link href="/cook-portal" className="underline">Cook portal</Link> for management.</p>
      </div>

      {/* Search + filters parity with mobile search.tsx + index */}
      <div className="mb-4">
        <input
          type="text"
          value={query}
          onChange={e=>setQuery(e.target.value)}
          placeholder="Search: Nasi Lemak, Hari Raya under 400 cal, Katong, buah keluak..."
          className="w-full p-3 text-base"
          data-testid="search-input-web"
          aria-label="Search heritage dishes and cooks"
        />
      </div>

      <div className="mb-3">
        <div className="text-xs uppercase tracking-widest text-[#5C5144] mb-1">Occasion (from seed content)</div>
        <div className="flex flex-wrap gap-2">
          <button onClick={()=>setOccasionFilter('')} className={`px-3 py-1 rounded-full text-sm ${!occasionFilter ? 'bg-[#1D9E75] text-white' : 'bg-[#F5F0E6]'}`}>All</button>
          {occasions.map(o => (
            <button key={o} onClick={()=>setOccasionFilter(o)} className={`px-3 py-1 rounded-full text-sm ${occasionFilter===o ? 'bg-[#1D9E75] text-white' : 'bg-[#F5F0E6]'}`}>{o}</button>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-xs uppercase tracking-widest text-[#5C5144] mb-1">Calorie traffic-light (green/amber/red like mobile)</div>
        <div className="flex gap-2 flex-wrap">
          {calOpts.map((opt,i)=> (
            <button key={i} onClick={()=>setMaxCal(opt.val)} className={`px-3 py-1 rounded-full text-sm border ${maxCal===opt.val ? 'border-[#1D9E75] bg-white' : 'border-[#E8D5B7]'}`}>{opt.label}</button>
          ))}
        </div>
      </div>

      <SHCSectionTitle>Heritage Dishes {occasionFilter ? `for ${occasionFilter}` : ''} {maxCal ? `≤${maxCal} cal` : ''}</SHCSectionTitle>

      {isLoading && <p>Loading from shared canonical seeds...</p>}
      {products.length === 0 && <p className="text-[#5C5144]">No matches. Clear filters or try NL search like "nasi lemak hari raya under 400".</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {products.map((p: any) => {
          const cal = p.calories || 450;
          const traffic = cal < 400 ? 'success' : cal < 550 ? 'warning' : 'error';
          return (
            <SHCCard key={p.id} className="flex flex-col">
              <Link href={`/product/${p.id}`} className="block mb-2">
                <div className="font-semibold text-lg">{p.name}</div>
                <div className="text-sm" style={{color: '#B85C38'}}>{p.cook_name} • S${p.price} / portion • {p.cuisine}</div>
                <div className="text-xs text-[#5C5144] mt-1 line-clamp-2">{p.heritage_note}</div>
              </Link>
              <div className="flex items-center gap-2 mt-auto pt-2 flex-wrap">
                <SHCBadge variant="heritage">{p.cuisine}</SHCBadge>
                <SHCBadge variant={traffic as any}>🔥 {traffic.toUpperCase()} ~{cal} cal</SHCBadge>
                <span className="text-xs">min {p.min_qty}</span>
                {p.halal && <SHCBadge variant="success">Halal</SHCBadge>}
              </div>
              <div className="text-[11px] text-[#1D9E75] mt-1">Perfect for: {(p.occasion_tags||[]).join(', ')}</div>
              <div className="flex gap-2 mt-3">
                <Link href={`/cook/${p.cook_id?.replace('cook_','') || p.cook_id}`}><SHCButton size="sm" variant="outline">View Cook</SHCButton></Link>
                <Link href={`/product/${p.id}`}><SHCButton size="sm">Details &amp; Add (ack+qty)</SHCButton></Link>
              </div>
            </SHCCard>
          );
        })}
      </div>

      <div className="mt-6">
        <Link href="/cart"><SHCButton testID="view-cart-web">View Cart (one-cook enforced)</SHCButton></Link>
      </div>

      {/* Growth + trust snippets */}
      <div className="mt-8 grid md:grid-cols-2 gap-4">
        <SHCCard>
          <SHCSectionTitle>How it Works (SG reality)</SHCSectionTitle>
          <p className="text-sm text-[#5C5144]">Browse by occasion (Hari Raya/CNY/Deepavali) → heritage cook + dish (HDB kitchens) → add (min qty + one-cook + allergen ack mandatory) → checkout slot + PayNow ref + PDPA consent → track + chat → collected → 5% Home Credits. Address released 2h pre. Weekly payouts to cooks.</p>
          <Link href="/content/trust" className="text-xs underline mt-2 inline-block">Full Trust &amp; Safety + PDPA</Link>
        </SHCCard>
        <SHCCard>
          <SHCSectionTitle>Credits &amp; Requests (Phase 8/9 parity)</SHCSectionTitle>
          <p className="text-sm">Earn 5% on completed orders (Silver tier demo). Request custom dish from profile. Cooks bid on collab board in portal. Heritage archive lives forever on cook profiles.</p>
          <div className="mt-2"><Link href="/profile"><SHCButton size="sm" variant="outline">Open Profile (wallet + request form)</SHCButton></Link></div>
        </SHCCard>
      </div>

      <p className="mt-10 text-center text-xs text-[#5C5144]">127+ cooks • 4,892+ meals served • Same exact seeds, rules, @shc/types as mobile app and Medusa backend. SSR + SEO enabled. PWA installable.</p>

      {/* Switch to mobile parity note + QR sim per task */}
      <div id="switch-mobile" className="mt-10 border-t pt-6 text-center">
        <div className="font-medium">Test without installing Expo Go — use this web, or pair with mobile</div>
        <div className="text-sm mt-1">Mobile Expo: <code>http://localhost:8081</code> (or tunnel). Scan to open in Expo Go when tunneled.</div>
        <div className="mx-auto mt-3 inline-block p-3 border bg-white rounded text-[10px] font-mono">QR SIM<br/>localhost:8081<br/>(use real phone + same LAN or cloudflared)</div>
        <div className="text-xs text-[#5C5144] mt-1">All customer E2E + cook management identical flows. Use dev role switcher on both for seamless side-by-side testing.</div>
      </div>
    </div>
  );
}
