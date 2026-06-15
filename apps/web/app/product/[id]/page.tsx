'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import {
  useProduct,
  useAddToCart,
  useCollectionSlots,
  useAICalorieEstimate,
} from '../../../lib/useProducts';
import {
  SHCCard,
  SHCButton,
  SHCBadge,
  SHCSectionTitle,
  AllergenAckCheckbox,
  SHCErrorBanner,
  CollectionSlotPicker,
  SHCLoading,
  SHCPageHeader,
  CalorieBadge,
} from '../../components/SHCWebComponents';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: product, isLoading } = useProduct(id || '');
  const { data: slots = [] } = useCollectionSlots(id || '');
  const addMut = useAddToCart();
  const aiMut = useAICalorieEstimate();

  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [aiCalories, setAiCalories] = useState<number | null>(null);

  if (isLoading || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <SHCLoading label="Loading dish details…" />
      </div>
    );
  }

  const tier1 = product.allergen_tiers?.tier1 || [];
  const cookSlug = product.cook_id?.replace('cook_', '') || '';
  const minQty = product.min_qty || 1;
  const effectiveQty = Math.max(minQty, qty);

  const handleAdd = async () => {
    setError(null);
    if (!allergenAck) {
      setError('Please acknowledge allergens before adding to cart.');
      return;
    }
    try {
      await addMut.mutateAsync({ productId: product.id, qty: effectiveQty });
      window.location.href = '/cart';
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      setError(err?.message || 'Unable to add to cart. You may already have items from another cook.');
    }
  };

  const runAI = async () => {
    try {
      const res = await aiMut.mutateAsync(product.ingredients || []);
      setAiCalories((res as { calories?: number }).calories ?? null);
    } catch {
      /* optional enhancement */
    }
  };

  const displayCal = aiCalories ?? product.calories ?? 450;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <SHCPageHeader
        title={product.name}
        subtitle={`by ${product.cook_name} · S$${product.price} per portion · min ${minQty} portions`}
        backHref="/"
        backLabel="All dishes"
      />

      <div className="flex flex-wrap gap-2 mb-6">
        <SHCBadge variant="heritage">{product.cuisine}</SHCBadge>
        <CalorieBadge calories={displayCal} />
        {product.halal && <SHCBadge variant="success">Halal</SHCBadge>}
        {product.festive_timing && <SHCBadge>{product.festive_timing}</SHCBadge>}
      </div>

      <SHCCard className="mb-6">
        <p className="text-[#2C2416] leading-relaxed italic">{product.heritage_note}</p>
      </SHCCard>

      <SHCSectionTitle subtitle="Mandatory disclosure — please review before ordering">Ingredients & allergens</SHCSectionTitle>
      <SHCCard>
        {tier1.length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-red-700">Contains</span>
            <p className="text-sm mt-1">{tier1.join(', ')}</p>
          </div>
        )}
        {(product.allergen_tiers?.tier2 || []).length > 0 && (
          <div className="mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5144]">May contain</span>
            <p className="text-sm mt-1">{(product.allergen_tiers?.tier2 || []).join(', ')}</p>
          </div>
        )}
        {(product.allergen_tiers?.tier3 || []).length > 0 && (
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5144]">Trace</span>
            <p className="text-sm mt-1">{(product.allergen_tiers?.tier3 || []).join(', ')}</p>
          </div>
        )}
        {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
          <div className="mt-4 pt-4 border-t border-[#E8D5B7]/60">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#5C5144]">Ingredients</span>
            <ul className="text-sm mt-2 space-y-1 text-[#5C5144]">
              {product.ingredients.map((ing: { name?: string; qty?: string }, i: number) => (
                <li key={i}>
                  {ing.name || String(ing)}
                  {ing.qty ? ` — ${ing.qty}` : ''}
                </li>
              ))}
            </ul>
          </div>
        )}
        <button type="button" onClick={runAI} className="mt-3 text-xs text-[#1D9E75] hover:underline" disabled={aiMut.isPending}>
          {aiMut.isPending ? 'Estimating…' : 'Refresh calorie estimate'}
        </button>
      </SHCCard>

      <SHCSectionTitle>Quantity</SHCSectionTitle>
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => setQty(Math.max(minQty, effectiveQty - 1))}
          className="w-10 h-10 rounded-lg border border-[#E8D5B7] flex items-center justify-center hover:bg-[#F5F0E6] transition-colors"
          aria-label="Decrease quantity"
        >
          <Minus className="w-4 h-4" />
        </button>
        <span className="text-2xl font-semibold tabular-nums w-12 text-center">{effectiveQty}</span>
        <button
          type="button"
          onClick={() => setQty(effectiveQty + 1)}
          className="w-10 h-10 rounded-lg border border-[#E8D5B7] flex items-center justify-center hover:bg-[#F5F0E6] transition-colors"
          aria-label="Increase quantity"
        >
          <Plus className="w-4 h-4" />
        </button>
        <span className="text-sm text-[#5C5144]">Minimum {minQty} portions</span>
      </div>

      <div className="mt-6">
        <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-ack-web" />
      </div>

      {error && <SHCErrorBanner message={error} />}

      <div className="mt-6 flex flex-col sm:flex-row gap-3">
        <SHCButton
          onClick={handleAdd}
          disabled={!allergenAck || addMut.isPending}
          testID="add-to-cart-web"
          size="lg"
          className="flex-1"
        >
          Add to cart · S${(product.price * effectiveQty).toFixed(2)}
        </SHCButton>
        {cookSlug && (
          <Link href={`/cook/${cookSlug}`}>
            <SHCButton variant="outline" size="lg">
              Meet {product.cook_name?.split(' ')[0]}
            </SHCButton>
          </Link>
        )}
      </div>

      <SHCSectionTitle subtitle="Preview availability — confirm at checkout">Collection slots</SHCSectionTitle>
      <CollectionSlotPicker slots={slots} selected={null} onSelect={() => {}} />
    </div>
  );
}