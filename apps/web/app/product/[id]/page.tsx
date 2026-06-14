'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useProduct, useAddToCart, useCollectionSlots, useCart, useAICalorieEstimate } from '../../../lib/useProducts';
import { SHCCard, SHCButton, SHCBadge, SHCSectionTitle, AllergenAckCheckbox, PriceEarningsCalc, SHCErrorBanner, CollectionSlotPicker } from '../../components/SHCWebComponents';
import { useAuth } from '../../../lib/useAuth';
import { createSHCError } from '../../../lib/api-client';
// shcColors inlined (no @shc/ui to prevent gluestack/RN module resolution failure in web build)

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: product, isLoading } = useProduct(id || '');
  const { data: slots = [] } = useCollectionSlots(id || '');
  const addMut = useAddToCart();
  const { data: cart } = useCart();
  const { user } = useAuth();
  const aiMut = useAICalorieEstimate();

  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [aiBadge, setAiBadge] = useState<any>(null);

  if (isLoading || !product) return <p>Loading dish detail + shared contracts...</p>;

  const total = product.price * qty;
  const tier1 = product.allergen_tiers?.tier1 || [];

  const handleAdd = async () => {
    setError(null);
    if (!allergenAck) { setError('Allergen acknowledgment required (SHC-CART-003)'); return; }
    try {
      await addMut.mutateAsync({ productId: product.id, qty });
      window.location.href = '/cart';
    } catch (e: any) {
      setError(e?.message || (e.code ? `${e.code}: ${e.message}` : 'Add failed (one-cook or min-qty)'));
    }
  };

  const runAI = async () => {
    try {
      const res = await aiMut.mutateAsync(product.ingredients || []);
      setAiBadge(res);
    } catch {}
  };

  return (
    <div>
      <Link href="/" className="text-sm underline">← Discover</Link>
      <h1 className="text-3xl font-semibold mt-2">{product.name}</h1>
      <p style={{color: '#B85C38'}} className="text-lg">by {product.cook_name} • S${product.price}/portion • min {product.min_qty} • {product.cuisine}</p>

      <SHCCard className="mt-4">
        <p className="italic">{product.heritage_note}</p>
        <div className="mt-1 text-xs">Festive: {product.festive_timing}</div>
      </SHCCard>

      <div className="flex gap-2 mt-3 flex-wrap">
        <SHCBadge variant="heritage">{product.cuisine}</SHCBadge>
        {product.halal && <SHCBadge variant="success">Halal</SHCBadge>}
        <span className="text-sm">Calories: {product.calories} ({product.calories_confidence})</span>
        {aiBadge && <SHCBadge variant="success">AI est: {aiBadge.calories} cal (stub)</SHCBadge>}
      </div>

      <SHCSectionTitle>3-Tier Allergen + Ingredients Disclosure (mandatory)</SHCSectionTitle>
      <SHCCard>
        <div className="text-sm"><strong className="text-[#B91C1C]">Tier 1 (Mandatory):</strong> {(tier1 || []).join(', ') || '—'}</div>
        <div className="text-sm mt-1">Tier 2: {(product.allergen_tiers?.tier2 || []).join(', ') || '—'}</div>
        <div className="text-sm">Tier 3 (trace): {(product.allergen_tiers?.tier3 || []).join(', ') || '—'}</div>
        <div className="text-xs mt-2">Ingredients: {JSON.stringify(product.ingredients)}</div>
      </SHCCard>

      <button onClick={runAI} className="mt-2 text-xs underline">Estimate calories via AI stub (Phase 7 parity)</button>

      <SHCSectionTitle>Quantity</SHCSectionTitle>
      <div className="flex items-center gap-4">
        <button onClick={()=>setQty(Math.max(product.min_qty, qty-1))} className="text-3xl text-[#1D9E75]">-</button>
        <span className="text-2xl font-semibold">{qty}</span>
        <button onClick={()=>setQty(qty+1)} className="text-3xl text-[#1D9E75]">+</button>
      </div>

      <SHCSectionTitle>Allergen Acknowledgment (gate)</SHCSectionTitle>
      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-ack-web" />

      {error && <SHCErrorBanner code="SHC-CART-003" message={error} />}

      <div className="mt-4">
        <PriceEarningsCalc total={total} />
      </div>

      <div className="mt-4 flex gap-3">
        <SHCButton onClick={handleAdd} disabled={!allergenAck} testID="add-to-cart-web">Add to Cart (enforce rules)</SHCButton>
        <Link href={`/cook/${product.cook_id?.replace('cook_','') || ''}`}><SHCButton variant="outline">View full Cook profile + heritage</SHCButton></Link>
      </div>

      <SHCSectionTitle>Collection Slots (availability from seed + shc_availability)</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={null} onSelect={()=>{ /* preview only on product */ }} />

      <p className="mt-6 text-xs text-[#5C5144]">Request custom variation? Go to profile. Earnings preview shown everywhere. Same as mobile product/[id]. SSR metadata + JSON-LD would be added in prod.</p>
    </div>
  );
}
