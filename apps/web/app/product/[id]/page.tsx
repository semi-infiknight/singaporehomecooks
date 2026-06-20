'use client';

import React, { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Minus, Plus } from 'lucide-react';
import { getDishImageUrl } from '@shc/utils';
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
  CalorieBadge,
  GourmeatPayButton,
  gourmeatDiscountPercent,
  FavoriteButton,
} from '../../components/SHCWebComponents';
import { useFavorites } from '../../../lib/useFavorites';

export default function ProductDetail() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: product, isLoading } = useProduct(id || '');
  const { data: slots = [] } = useCollectionSlots(id || '');
  const addMut = useAddToCart();
  const aiMut = useAICalorieEstimate();
  const { isFavorite, toggle } = useFavorites();

  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [aiCalories, setAiCalories] = useState<number | null>(null);

  if (isLoading || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SHCLoading label="Loading dish details…" />
      </div>
    );
  }

  const tier1 = product.allergen_tiers?.tier1 || [];
  const cookSlug = product.cook_slug || product.cook_id?.replace('cook_', '') || '';
  const minQty = product.min_qty || 1;
  const effectiveQty = Math.max(minQty, qty);
  const heroImage = getDishImageUrl({
    id: product.id,
    cuisine: product.cuisine,
    name: product.name,
  });

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
  const lineTotal = product.price * effectiveQty;

  return (
    <>
      {/* Full-width hero food image */}
      <div className="relative w-full h-56 sm:h-64 md:h-80">
        <Image
          src={heroImage}
          alt={product.name}
          fill
          priority
          className="object-cover"
          sizes="100vw"
          data-testid="product-hero-image"
        />
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
          <Link
            href="/"
            className="text-sm font-bold bg-card/95 px-3 py-2 rounded-full shadow-[var(--shc-shadow-soft)]"
          >
            ← Back
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-1 rounded-md">
              {gourmeatDiscountPercent(product.id)}% OFF
            </span>
            <FavoriteButton
            active={isFavorite(product.id)}
            onClick={() =>
              toggle({
                id: product.id,
                name: product.name,
                cook_name: product.cook_name,
                price: product.price,
                cuisine: product.cuisine,
              })
            }
            testID="pdp-favorite-btn"
          />
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-6 shc-bottom-bar-pad">
        <h1 className="shc-display text-2xl md:text-3xl tracking-tight text-foreground">{product.name}</h1>
        <p className="text-sm font-semibold text-primary mt-1">
          {product.cook_name} · S${product.price} · min {minQty}
        </p>

        <div className="flex flex-wrap gap-2 my-4">
          <SHCBadge variant="heritage">{product.cuisine}</SHCBadge>
          <CalorieBadge calories={displayCal} />
          {product.halal && <SHCBadge variant="success">Halal</SHCBadge>}
          {product.festive_timing && <SHCBadge>{product.festive_timing}</SHCBadge>}
        </div>

        {product.heritage_note && (
          <SHCCard className="mb-6 shc-bento-yellow py-3 px-4">
            <p className="text-sm text-foreground leading-snug font-medium italic line-clamp-3">{product.heritage_note}</p>
          </SHCCard>
        )}

        <SHCSectionTitle subtitle="Review before ordering">Ingredients & allergens</SHCSectionTitle>
        <SHCCard className="rounded-2xl shadow-[var(--shc-shadow-card)] border border-border">
          {tier1.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[var(--shc-error)]">Contains</span>
              <p className="text-sm mt-1 font-medium">{tier1.join(', ')}</p>
            </div>
          )}
          {(product.allergen_tiers?.tier2 || []).length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">May contain</span>
              <p className="text-sm mt-1 font-medium">{(product.allergen_tiers?.tier2 || []).join(', ')}</p>
            </div>
          )}
          {(product.allergen_tiers?.tier3 || []).length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Trace</span>
              <p className="text-sm mt-1 font-medium">{(product.allergen_tiers?.tier3 || []).join(', ')}</p>
            </div>
          )}
          {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
            <div className="mt-4 pt-4 border-t-2 border-[var(--shc-border-brutal)]">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Ingredients</span>
              <ul className="text-sm mt-2 space-y-1 text-muted-foreground font-medium">
                {product.ingredients.map((ing: { name?: string; qty?: string }, i: number) => (
                  <li key={i}>
                    {ing.name || String(ing)}
                    {ing.qty ? ` — ${ing.qty}` : ''}
                  </li>
                ))}
              </ul>
            </div>
          )}
          <button
            type="button"
            onClick={runAI}
            className="mt-3 text-xs text-primary font-bold hover:underline"
            disabled={aiMut.isPending}
          >
            {aiMut.isPending ? 'Estimating…' : '🔥 Refresh calorie estimate'}
          </button>
        </SHCCard>

        <SHCSectionTitle>Quantity</SHCSectionTitle>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQty(Math.max(minQty, effectiveQty - 1))}
            className="w-10 h-10 rounded-lg border-2 border-[var(--shc-border-brutal)] flex items-center justify-center hover:bg-secondary transition-colors shadow-[var(--shc-shadow-brutal-sm)]"
            aria-label="Decrease quantity"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-2xl font-black tabular-nums w-12 text-center font-mono">{effectiveQty}</span>
          <button
            type="button"
            onClick={() => setQty(effectiveQty + 1)}
            className="w-10 h-10 rounded-lg border-2 border-[var(--shc-border-brutal)] flex items-center justify-center hover:bg-secondary transition-colors shadow-[var(--shc-shadow-brutal-sm)]"
            aria-label="Increase quantity"
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground font-semibold">Min {minQty}</span>
        </div>

        <div className="mt-6">
          <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-ack-web" />
        </div>

        {error && <SHCErrorBanner message={error} />}

        <div className="mt-6 hidden sm:flex flex-row gap-3">
          <GourmeatPayButton
            label={addMut.isPending ? 'Adding…' : 'Add to cart'}
            amount={`S$${lineTotal.toFixed(2)}`}
            onClick={handleAdd}
            disabled={!allergenAck || addMut.isPending}
            testID="add-to-cart-web"
          />
          {cookSlug && (
            <Link href={`/cook/${cookSlug}`}>
              <SHCButton variant="outline" size="lg">
                {product.cook_name?.split(' ')[0]}
              </SHCButton>
            </Link>
          )}
        </div>

        <SHCSectionTitle>Collection slots</SHCSectionTitle>
        <CollectionSlotPicker slots={slots} selected={null} onSelect={() => {}} />

        <div className="sm:hidden fixed bottom-[110px] left-4 right-4 z-40">
          <GourmeatPayButton
            label={addMut.isPending ? 'Adding…' : 'Add to cart'}
            amount={`S$${lineTotal.toFixed(2)}`}
            onClick={handleAdd}
            disabled={!allergenAck || addMut.isPending}
            testID="add-to-cart-web"
          />
        </div>
      </div>
    </>
  );
}