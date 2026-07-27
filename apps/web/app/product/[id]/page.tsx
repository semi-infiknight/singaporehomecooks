'use client';

import React, { Suspense, useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { getDishImageUrl, resolveProductForDisplay, recipeHeritageLead, recipeAboutBlurb, recipeAtAGlance, recipeStepsForProduct, recipeHasStory } from '@shc/utils';
import { useProduct, useAddToCart, useCollectionSlots, useAICalorieEstimate } from '../../../lib/useProducts';
import {
  SHCCard,
  SHCButton,
  SHCBadge,
  SHCMetaBadge,
  SHCSectionTitle,
  AllergenAckCheckbox,
  SHCErrorBanner,
  CollectionSlotPicker,
  SHCLoading,
  CalorieBadge,
  GourmeatProductStickyBar,
  GourmeatCard,
  DishOrderingInfo,
  RecipeStoryCard,
  FavoriteButton,
  SHCSharedDishImageWeb,
} from '../../components/SHCWebComponents';
import { useFavorites } from '../../../lib/useFavorites';
import { useGuestAuthGate } from '../../../lib/useGuestAuthGate';

function ProductDetailSkeleton() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-6" data-testid="product-skeleton" aria-busy="true" aria-label="Loading dish">
      <div className="shc-skeleton h-56 w-full rounded-none mb-4" />
      <div className="space-y-3 px-4">
        <div className="shc-skeleton h-6 w-[70%]" />
        <div className="shc-skeleton h-4 w-[45%]" />
        <div className="shc-skeleton h-20 w-full rounded-xl mt-2" />
      </div>
    </div>
  );
}

export default function ProductDetail() {
  return (
    <Suspense fallback={<ProductDetailSkeleton />}>
      <ProductDetailContent />
    </Suspense>
  );
}

function ProductDetailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const evidenceMode = process.env.NEXT_PUBLIC_FAMILY_VALUES_EVIDENCE === '1';
  const { data: productRaw, isLoading } = useProduct(id || '');
  const product = resolveProductForDisplay(productRaw, id || '', { evidence: evidenceMode });
  const { data: slots = [] } = useCollectionSlots(id || '');
  const addMut = useAddToCart({ silent: true });
  const aiMut = useAICalorieEstimate();
  const { isFavorite, toggle } = useFavorites();
  const { requireAuth } = useGuestAuthGate();

  const allergenAckFromUrl = searchParams.get('allergenAck') === '1' || searchParams.get('allergenAck') === 'true';
  const [allergenAck, setAllergenAck] = useState(allergenAckFromUrl);
  const [qty, setQty] = useState(5);
  const [error, setError] = useState<string | null>(null);
  const [aiCalories, setAiCalories] = useState<number | null>(null);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (allergenAckFromUrl) setAllergenAck(true);
  }, [allergenAckFromUrl]);

  useEffect(() => {
    if (product?.min_qty) setQty((q) => Math.max(product.min_qty, q));
  }, [product?.min_qty]);

  if ((isLoading && !evidenceMode) || !product) {
    if (!isLoading && !product) {
      return (
        <div className="max-w-3xl mx-auto px-4 py-8">
          <SHCLoading label="Dish not found" />
        </div>
      );
    }
    return <ProductDetailSkeleton />;
  }

  const tier1 = product.allergen_tiers?.tier1 || (product as { allergens?: string[] }).allergens || [];
  const cookSlug = product.cook_slug || product.cook_id?.replace('cook_', '') || '';
  const minQty = product.min_qty || 1;
  const effectiveQty = Math.max(minQty, qty);
  const calConfidence = ((product as { calories_confidence?: string }).calories_confidence as 'full' | 'category') || 'category';
  const heroImage = getDishImageUrl({
    id: product.id,
    cuisine: product.cuisine,
    name: product.name,
    image_url: (product as { image_url?: string }).image_url,
  });

  const handleAdd = async () => {
    setError(null);
    if (!allergenAck) {
      setError('Please acknowledge allergens before adding to cart.');
      return;
    }
    if (!requireAuth('Sign in to add this dish to your cart.', `/product/${id}`)) return;
    try {
      await addMut.mutateAsync({ productId: product.id, qty: effectiveQty });
      setAdded(true);
      setTimeout(() => router.push('/cart'), 600);
    } catch (e: unknown) {
      const err = e as { message?: string };
      setError(err?.message || 'Unable to add to cart. You may already have items from another cook.');
    }
  };

  const runAI = async () => {
    try {
      const res = await aiMut.mutateAsync(product.ingredients || []);
      setAiCalories((res as { calories?: number }).calories ?? null);
    } catch {
      /* optional */
    }
  };

  const displayCal = aiCalories ?? product.calories ?? 450;
  const recipeSteps = recipeStepsForProduct({
    id: product.id,
    description: product.description,
    cuisine: product.cuisine,
    cook_name: product.cook_name,
    min_qty: product.min_qty,
    ingredients: product.ingredients,
    recipe_steps: (product as { recipe_steps?: unknown }).recipe_steps as import('@shc/utils').RecipeStep[] | undefined,
  });
  const showRecipe = recipeHasStory({
    id: product.id,
    description: product.description,
    ingredients: product.ingredients,
    recipe_steps: (product as { recipe_steps?: unknown }).recipe_steps as import('@shc/utils').RecipeStep[] | undefined,
  });

  return (
    <div className="min-h-screen bg-background" data-testid="product-detail-screen">
      <div className="relative w-full h-56 sm:h-64 md:h-80">
        <SHCSharedDishImageWeb
          dishId={product.id}
          src={heroImage}
          alt={product.name}
          hero
          className="absolute inset-0 w-full h-full"
          testID="pdp-hero-image"
        />
        <div className="absolute top-4 left-4 right-4 z-10 flex justify-between items-center gap-2">
          <button
            type="button"
            onClick={() => router.back()}
            className="text-sm font-bold bg-card/95 px-3 py-2 rounded-full shadow-[var(--shc-shadow-soft)]"
            data-testid="pdp-back-btn"
          >
            ← Back
          </button>
          <div className="flex items-center gap-2">
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

      <div className="max-w-3xl mx-auto px-4 py-6 pb-28">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-foreground">{product.name}</h1>
        <div className="flex flex-wrap items-center gap-1 text-sm font-semibold text-primary mt-1">
          {cookSlug ? (
            <Link href={`/cook/${cookSlug}`} className="font-bold hover:underline">
              {product.cook_name} ›
            </Link>
          ) : (
            <span>{product.cook_name}</span>
          )}
          <span className="text-foreground">
            {' '}
            · S${product.price} · min {minQty}
          </span>
        </div>

        <div className="flex flex-wrap gap-2 my-4">
          {product.cuisine ? <SHCMetaBadge kind="cuisine">{product.cuisine}</SHCMetaBadge> : null}
          <CalorieBadge calories={displayCal} />
          {product.halal && <SHCMetaBadge kind="halal">Halal</SHCMetaBadge>}
        </div>

        {showRecipe ? (
          <RecipeStoryCard
            heritageLead={recipeHeritageLead({ description: product.description })}
            aboutBlurb={recipeAboutBlurb({ description: product.description })}
            glanceChips={recipeAtAGlance(
              { cuisine: product.cuisine, min_qty: product.min_qty },
              recipeSteps.length
            )}
            ingredients={product.ingredients}
            steps={recipeSteps}
            cookName={product.cook_name}
          />
        ) : null}

        <GourmeatCard className="mb-4">
          <DishOrderingInfo
            tier1={tier1}
            tier2={product.allergen_tiers?.tier2}
            tier3={product.allergen_tiers?.tier3}
            ingredients={product.ingredients}
            calories={displayCal}
            caloriesConfidence={calConfidence}
          />
          <button
            type="button"
            onClick={runAI}
            className="mt-2 text-xs text-primary font-bold hover:underline"
            disabled={aiMut.isPending}
          >
            {aiMut.isPending ? 'Estimating…' : '🔥 Refresh calorie estimate'}
          </button>
        </GourmeatCard>

        <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} testID="allergen-ack-web" />
        {error && (
          <p className="text-sm font-bold text-[var(--shc-error)] mt-2" data-testid="pdp-add-error">
            {error}
          </p>
        )}

        <SHCSectionTitle>Collection slots</SHCSectionTitle>
        <CollectionSlotPicker slots={slots} selected={null} onSelect={() => {}} />

        {cookSlug && (
          <div className="mt-6 hidden md:block">
            <Link href={`/cook/${cookSlug}`}>
              <SHCButton variant="outline">View {product.cook_name?.split(' ')[0]}&apos;s kitchen</SHCButton>
            </Link>
          </div>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-40 md:max-w-3xl md:mx-auto">
        <GourmeatProductStickyBar
          qty={effectiveQty}
          minQty={minQty}
          lineTotal={product.price * effectiveQty}
          onDecrement={() => setQty(Math.max(minQty, effectiveQty - 1))}
          onIncrement={() => setQty(effectiveQty + 1)}
          onAdd={handleAdd}
          disabled={!allergenAck || addMut.isPending}
          loading={addMut.isPending}
          testID={
            added ? 'add-to-cart-success' : allergenAck && !addMut.isPending ? 'pdp-sticky-ready' : 'pdp-sticky-bar'
          }
        />
      </div>
    </div>
  );
}
