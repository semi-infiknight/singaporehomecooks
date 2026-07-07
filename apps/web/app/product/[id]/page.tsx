'use client';

import React, { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Minus, Plus } from 'lucide-react';
import { getDishImageUrl, resolveProductForDisplay } from '@shc/utils';
import {
  useProduct,
  useAddToCart,
  useCollectionSlots,
  useAICalorieEstimate,
} from '../../../lib/useProducts';
import {
  SHCCard,
  SHCBadge,
  SHCSectionTitle,
  AllergenAckCheckbox,
  SHCErrorBanner,
  CollectionSlotPicker,
  SHCLoading,
  CalorieBadge,
  GourmeatPayButton,
  GourmeatPrimaryButton,
  gourmeatDiscountPercent,
  FavoriteButton,
  SHCSharedDishImageWeb,
} from '../../components/SHCWebComponents';
import { useFavorites } from '../../../lib/useFavorites';
import { useShcI18n, getProductDetailCopy } from '@shc/i18n';

export default function ProductDetail() {
  const { locale } = useShcI18n();
  const copy = getProductDetailCopy(locale);
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const evidenceMode = process.env.NEXT_PUBLIC_FAMILY_VALUES_EVIDENCE === '1';
  const { data: productRaw, isLoading } = useProduct(id || '');
  const product = resolveProductForDisplay(productRaw, id || '', { evidence: evidenceMode });
  const { data: slots = [] } = useCollectionSlots(id || '');
  const addMut = useAddToCart();
  const aiMut = useAICalorieEstimate();
  const { isFavorite, toggle } = useFavorites();

  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [aiCalories, setAiCalories] = useState<number | null>(null);

  if ((isLoading && !evidenceMode) || !product) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-8">
        <SHCLoading label={copy.loadingWeb} />
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
      setError(copy.allergenRequired);
      return;
    }
    const { isAuthenticated } = await import('../../../lib/api-client');
    if (!isAuthenticated()) {
      router.push('/login?next=' + encodeURIComponent(`/product/${id}`));
      return;
    }
    try {
      await addMut.mutateAsync({ productId: product.id, qty: effectiveQty });
      window.location.href = '/cart';
    } catch (e: unknown) {
      const err = e as { message?: string; code?: string };
      setError(err?.message || copy.addCartConflict);
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
      <div className="relative w-full h-56 sm:h-64 md:h-80">
        <SHCSharedDishImageWeb
          dishId={product.id}
          src={heroImage}
          alt={product.name}
          hero
          className="absolute inset-0 w-full h-full"
          testID={`shared-dish-${product.id}-hero`}
        />
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
          <Link
            href="/"
            className="text-sm font-bold bg-card/95 px-3 py-2 rounded-full border border-border shadow-[var(--shc-shadow-soft)]"
          >
            {copy.back}
          </Link>
          <div className="flex items-center gap-2">
            <span className="bg-primary text-primary-foreground text-[10px] font-extrabold px-2 py-1 rounded-md">
              {copy.offBadge(gourmeatDiscountPercent(product.id))}
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
          {copy.priceMeta(product.cook_name || '', product.price, minQty)}
        </p>

        <div className="flex flex-wrap gap-2 my-4">
          <SHCBadge variant="heritage" soft>{product.cuisine}</SHCBadge>
          <CalorieBadge calories={displayCal} />
          {product.halal && <SHCBadge variant="success" soft>{copy.halal}</SHCBadge>}
          {product.festive_timing && <SHCBadge soft>{product.festive_timing}</SHCBadge>}
        </div>

        {product.heritage_note && (
          <SHCCard className="mb-6 shc-bento-yellow py-3 px-4" variant="customer">
            <p className="text-sm text-foreground leading-snug font-medium italic line-clamp-3">{product.heritage_note}</p>
          </SHCCard>
        )}

        <SHCSectionTitle subtitle={copy.ingredientsSubtitle}>{copy.ingredientsTitle}</SHCSectionTitle>
        <SHCCard variant="customer">
          {tier1.length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-destructive">{copy.allergenContains}</span>
              <p className="text-sm mt-1 font-medium">{tier1.join(', ')}</p>
            </div>
          )}
          {(product.allergen_tiers?.tier2 || []).length > 0 && (
            <div className="mb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{copy.allergenMayContain}</span>
              <p className="text-sm mt-1 font-medium">{(product.allergen_tiers?.tier2 || []).join(', ')}</p>
            </div>
          )}
          {(product.allergen_tiers?.tier3 || []).length > 0 && (
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{copy.allergenTrace}</span>
              <p className="text-sm mt-1 font-medium">{(product.allergen_tiers?.tier3 || []).join(', ')}</p>
            </div>
          )}
          {Array.isArray(product.ingredients) && product.ingredients.length > 0 && (
            <div className="mt-4 pt-4 border-t border-border">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{copy.ingredientsLabel}</span>
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
            {aiMut.isPending ? copy.calorieEstimating : copy.calorieRefresh}
          </button>
        </SHCCard>

        <SHCSectionTitle>{copy.quantityTitle}</SHCSectionTitle>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setQty(Math.max(minQty, effectiveQty - 1))}
            className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-[var(--shc-shadow-soft)]"
            aria-label={copy.decreaseQty}
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="text-2xl font-black tabular-nums w-12 text-center font-mono">{effectiveQty}</span>
          <button
            type="button"
            onClick={() => setQty(effectiveQty + 1)}
            className="w-10 h-10 rounded-lg border border-border flex items-center justify-center hover:bg-secondary transition-colors shadow-[var(--shc-shadow-soft)]"
            aria-label={copy.increaseQty}
          >
            <Plus className="w-4 h-4" />
          </button>
          <span className="text-sm text-muted-foreground font-semibold">{copy.minQty(minQty)}</span>
        </div>

        <div className="mt-6">
          <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-ack-web" />
        </div>

        {error && <SHCErrorBanner message={error} />}

        <div className="mt-6 hidden sm:flex flex-row gap-3">
          <GourmeatPayButton
            label={addMut.isPending ? copy.adding : copy.addToCart}
            amount={`S$${lineTotal.toFixed(2)}`}
            onClick={handleAdd}
            disabled={!allergenAck || addMut.isPending}
            testID="add-to-cart-web"
          />
          {cookSlug && (
            <GourmeatPrimaryButton
              label={copy.viewCook(product.cook_name?.split(' ')[0] || product.cook_name || '')}
              variant="outline"
              onClick={() => router.push(`/cook/${cookSlug}`)}
              testID="pdp-view-cook-btn"
            />
          )}
        </div>

        <SHCSectionTitle>{copy.collectionSlots}</SHCSectionTitle>
        <CollectionSlotPicker slots={slots} selected={null} onSelect={() => {}} />

        <div className="sm:hidden fixed bottom-[110px] left-4 right-4 z-40">
          <GourmeatPayButton
            label={addMut.isPending ? copy.adding : copy.addToCart}
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
