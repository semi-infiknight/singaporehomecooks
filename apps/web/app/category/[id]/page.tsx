'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCuisineCategoryById,
  scopeProductsByCategory,
  scopeKitchensByCategory,
  topRatedCategoryDishes,
  customerCategoryOfferCopy,
  getDishImageUrl,
  getCookKitchenHeroUrl,
  coerceRating,
  filterDiscoverProducts,
  discoverActiveFilterCount,
  clearedDiscoverFilters,
  type MealTypeId,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import { useGuestAuthGate } from '../../../lib/useGuestAuthGate';
import { useCustomerLocation } from '../../../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../../../lib/useDiscoverPrefs';
import { useCustomerConfig } from '../../../lib/useCustomerConfig';
import { getCooks } from '../../../lib/api-client';
import {
  GourmeatDishCard,
  GourmeatSectionTitle,
  SHCEmptyState,
  SHCButton,
  SHCSkeletonGrid,
  SHCSkeletonKitchenList,
  TiffinKitchenCard,
  DiscoverFilterSheet,
  type DishCardProduct,
} from '../../components/SHCWebComponents';
import { VirtualRowList } from '../../components/VirtualLists';

function toDishCard(product: Record<string, unknown>): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    id: String(product.id),
    name: String(product.name),
    cook_name: String(product.cook_name || product.cook_display_name || ''),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: coerceRating(product.rating),
    image_url: getDishImageUrl({
      id: String(product.id),
      cuisine: product.cuisine ? String(product.cuisine) : undefined,
      name: String(product.name),
    }),
  };
}

/**
 * Category explore page — HomelyEats IA: banner · top rated · kitchens.
 * Deep link: `/category/[id]` e.g. `/category/Peranakan`
 */
export default function CategoryPage() {
  const params = useParams();
  const rawId = typeof params?.id === 'string' ? params.id : Array.isArray(params?.id) ? params.id[0] : '';
  const categoryId = decodeURIComponent(String(rawId || ''));
  const router = useRouter();
  const { user } = useAuth();
  const { requireAuth } = useGuestAuthGate();
  const { data: products, isLoading } = useProducts('');
  const productList = (products as Record<string, unknown>[]) ?? [];
  const { data: cooks, isLoading: cooksLoading } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const cookList = (cooks as Record<string, unknown>[]) ?? [];
  const { active: collectionLocation } = useCustomerLocation();
  const { halalOnly, maxCal, vegetarianOnly, toggleHalalOnly, toggleLight, toggleVegetarianOnly } = useDiscoverPrefs();
  const addMut = useAddToCart();
  const [mealType, setMealType] = useState<MealTypeId>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [chip, setChip] = useState('all');

  const { config: browseConfig } = useCustomerConfig();
  const category = useMemo(() => getCuisineCategoryById(categoryId), [categoryId]);
  const offer = useMemo(
    () => customerCategoryOfferCopy(browseConfig, category?.label || category?.id || 'Heritage'),
    [browseConfig, category]
  );
  const title = category?.label || category?.id || 'Category';

  const filters = useMemo(
    () => ({ mealType, halalOnly, vegetarianOnly, maxCal }),
    [mealType, halalOnly, vegetarianOnly, maxCal]
  );
  const activeFilterCount = discoverActiveFilterCount(filters);

  const categoryProducts = useMemo(() => {
    const scoped = scopeProductsByCategory(productList, categoryId);
    return filterDiscoverProducts(scoped, {
      mealType: mealType !== 'all' ? mealType : undefined,
      halalOnly: halalOnly || undefined,
      vegetarianOnly: vegetarianOnly || undefined,
      maxCal,
    });
  }, [productList, categoryId, mealType, halalOnly, vegetarianOnly, maxCal]);

  const clearFilters = useCallback(() => {
    const cleared = clearedDiscoverFilters();
    setMealType(cleared.mealType);
    if (halalOnly) toggleHalalOnly();
    if (vegetarianOnly) toggleVegetarianOnly();
    if (maxCal != null) toggleLight();
  }, [halalOnly, vegetarianOnly, maxCal, toggleHalalOnly, toggleVegetarianOnly, toggleLight]);

  const topRated = useMemo(() => topRatedCategoryDishes(categoryProducts, 8), [categoryProducts]);

  const kitchens = useMemo(() => {
    let list = scopeKitchensByCategory(
      cookList,
      categoryProducts,
      categoryId
    );
    if (chip === 'nearest' && collectionLocation) {
      list = [...list].sort((a, b) => (String(b.area || '') ? 1 : 0) - (String(a.area || '') ? 1 : 0));
    }
    return list;
  }, [cookList, categoryProducts, categoryId, chip, collectionLocation]);

  const handleAdd = useCallback(
    (productId: string) => {
      if (!requireAuth('Sign in to add dishes to your cart.', `/category/${encodeURIComponent(categoryId)}`)) return;
      addMut.mutate({ productId, qty: 1 });
    },
    [requireAuth, addMut, categoryId]
  );

  return (
    <section
      className="max-w-2xl mx-auto px-4 py-4 shc-tab-bar-pad md:pb-8"
      data-testid="category-explore-screen"
    >
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center text-2xl font-light text-foreground"
          data-testid="category-back-btn"
          aria-label="Back to home"
        >
          ‹
        </Link>
        <h1 className="flex-1 text-center text-xl font-black text-foreground truncate" data-testid="category-title">
          {title}
        </h1>
        <button
          type="button"
          onClick={() => setFiltersOpen(true)}
          className="relative w-10 h-10 flex items-center justify-center text-lg"
          data-testid="category-filter-btn"
          aria-label="Filters"
        >
          ☰
          {activeFilterCount > 0 ? (
            <span className="absolute top-1 right-1 min-w-[16px] h-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-extrabold flex items-center justify-center">
              {activeFilterCount}
            </span>
          ) : null}
        </button>
      </div>

      <div
        className="rounded-2xl p-4 mb-4 text-white shadow-[var(--shc-shadow-brutal-sm)]"
        style={{ background: 'var(--shc-gourmeat-primary, #F87048)' }}
        data-testid="category-offer-banner"
      >
        <p className="font-black text-lg">{offer.title}</p>
        <p className="text-sm font-semibold opacity-95 mt-1">{offer.subtitle}</p>
      </div>

      <GourmeatSectionTitle title="Top rated" testID="category-top-rated-header" />
      {isLoading && <SHCSkeletonGrid count={4} />}
      {!isLoading && topRated.length === 0 && (
        <div className="mb-4" data-testid="category-dishes-empty">
          <SHCEmptyState
            title="No dishes in this category"
            description="Try another cuisine from the home explore row."
            action={
              <SHCButton variant="outline" onClick={() => router.push('/')}>
                Back to home
              </SHCButton>
            }
          />
        </div>
      )}
      {topRated.length > 0 && (
        <div
          className="flex gap-3 overflow-x-auto pb-3 mb-4 scrollbar-hide"
          data-testid="category-top-rated-rail"
        >
          {topRated.map((p) => (
            <div key={String(p.id)} className="shrink-0 w-[168px]">
              <GourmeatDishCard
                product={toDishCard(p)}
                onAddPress={() => handleAdd(String(p.id))}
              />
            </div>
          ))}
        </div>
      )}

      <GourmeatSectionTitle
        title={kitchens.length ? `${kitchens.length} kitchen${kitchens.length === 1 ? '' : 's'}` : 'All kitchens'}
        testID="category-kitchens-header"
      />
      <div className="flex gap-2 mb-3" data-testid="category-filter-chips">
        <button
          type="button"
          onClick={() => setChip(chip === 'nearest' ? 'all' : 'nearest')}
          className={`px-3 py-1.5 rounded-full text-xs font-bold border-2 ${
            chip === 'nearest' ? 'border-primary bg-primary text-primary-foreground' : 'border-[var(--shc-border-brutal)]'
          }`}
        >
          Nearest
        </button>
        {chip === 'nearest' ? (
          <button type="button" onClick={() => router.push('/location')} className="text-xs font-bold text-primary underline">
            Set collection location
          </button>
        ) : null}
      </div>

      {!isLoading && !cooksLoading && kitchens.length === 0 && (
        <p className="text-sm font-semibold text-muted-foreground mt-3" data-testid="category-kitchens-empty">
          No kitchens listed for this category yet.
        </p>
      )}

      {(isLoading || cooksLoading) && kitchens.length === 0 ? (
        <div className="mt-3">
          <SHCSkeletonKitchenList count={3} />
        </div>
      ) : null}

      <VirtualRowList
        items={kitchens}
        getKey={(c) => String(c.id || c.slug || '')}
        testID="category-kitchen-list"
        renderItem={(c) => {
          const cookId = String(c.id || c.slug || '');
          const cookName = String(c.display_name || c.name || 'Home kitchen');
          const slug = String(c.slug || c.id || '');
          return (
            <TiffinKitchenCard
              cookId={cookId}
              cookName={cookName}
              area={c.area ? String(c.area) : undefined}
              tagline={c.story ? String(c.story).slice(0, 80) : `${title} home cooking`}
              coverUri={getCookKitchenHeroUrl(cookId)}
              rating={coerceRating(c.rating)}
              reviewCount={c.review_count != null ? Number(c.review_count) : undefined}
              onPress={() => {
                if (slug) router.push(`/cook/${slug}`);
              }}
              testID={`category-kitchen-${cookId}`}
            />
          );
        }}
      />

      <DiscoverFilterSheet
        open={filtersOpen}
        onClose={() => setFiltersOpen(false)}
        mealTypeChips={browseConfig.meal_type_chips}
        mealType={mealType}
        onMealTypeChange={(id) => setMealType(id as MealTypeId)}
        cuisines={[]}
        cuisine=""
        onCuisineChange={() => {}}
        halalOnly={halalOnly}
        vegetarianOnly={vegetarianOnly}
        lightOnly={maxCal != null}
        onToggleHalal={toggleHalalOnly}
        onToggleVegetarian={toggleVegetarianOnly}
        onToggleLight={toggleLight}
        onClear={clearFilters}
        resultCount={categoryProducts.length}
        activeCount={activeFilterCount}
        hideCuisine
        testID="category-filter-sheet"
      />
    </section>
  );
}
