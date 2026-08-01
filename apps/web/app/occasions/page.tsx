'use client';

import React, { Suspense, useMemo, useCallback, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  filterDiscoverProducts,
  getDishImageUrl,
  customerOccasionCategories,
  customerOccasionHeading,
  customerIsPopularDish,
  coerceRating,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../lib/useProducts';
import { useGuestAuthGate } from '../../lib/useGuestAuthGate';
import { useFavorites } from '../../lib/useFavorites';
import { useCustomerConfig } from '../../lib/useCustomerConfig';
import {
  GourmeatCategoryRow,
  GourmeatDishCard,
  GourmeatSectionTitle,
  SHCButton,
  SHCEmptyState,
  SHCSkeletonGrid,
  RequestDishHomeCTA,
  type DishCardProduct,
} from '../components/SHCWebComponents';
import { VirtualDishGrid } from '../components/VirtualLists';

function toDishCard(product: Record<string, unknown>): DishCardProduct & { rating?: number; image_url?: string } {
  const id = String(product.id);
  return {
    id,
    name: String(product.name),
    cook_name: String(product.cook_name || ''),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: coerceRating(product.rating),
    image_url: getDishImageUrl({
      id,
      cuisine: product.cuisine ? String(product.cuisine) : undefined,
      name: String(product.name),
      image_url: product.image_url as string | undefined,
    }),
  };
}

export default function OccasionsPage() {
  return (
    <Suspense fallback={<SHCSkeletonGrid />}>
      <OccasionsPageContent />
    </Suspense>
  );
}

function OccasionsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialOccasion = searchParams.get('occasion') || '';
  const [occasionFilter, setOccasionFilter] = useState(initialOccasion);
  const { data: products, isLoading } = useProducts('');
  const productList = (products as Record<string, unknown>[]) ?? [];
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const { favorites, toggle, isFavorite } = useFavorites();

  const { config: browseConfig } = useCustomerConfig();

  const heading = customerOccasionHeading(browseConfig, occasionFilter);
  const categories = customerOccasionCategories(browseConfig);

  const filteredProducts = useMemo(
    () =>
      filterDiscoverProducts(productList, {
        occasion: occasionFilter || undefined,
      }),
    [productList, occasionFilter]
  );

  const gridProducts = useMemo(() => filteredProducts.map(toDishCard), [filteredProducts]);

  const checkPopular = useCallback(
    (product: DishCardProduct) =>
      customerIsPopularDish(product as Record<string, unknown>, productList, browseConfig.popular),
    [productList, browseConfig.popular]
  );

  const goToProduct = useCallback((id: string) => router.push(`/product/${id}`), [router]);

  const handleAddToCart = useCallback(
    (productId: string) => {      addMut.mutate({ productId, qty: 1 });
    },
    [addMut, requireAuth]
  );

  const handleFavorite = useCallback(
    (item: DishCardProduct) => {
      toggle({
        id: item.id,
        name: item.name,
        cook_name: item.cook_name || '',
        price: Number(item.price || 0),
        cuisine: item.cuisine,
      });
    },
    [toggle]
  );

  return (
    <section
      className="max-w-6xl mx-auto px-4 py-4 md:py-6 shc-tab-bar-pad md:pb-8"
      data-testid="occasions-browse-screen"
    >
      <div className="flex items-center gap-2 mb-4">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center text-2xl font-light text-foreground"
          data-testid="occasions-back-btn"
          aria-label="Back to discover"
        >
          ‹
        </Link>
        <h1 className="flex-1 text-center text-xl font-black text-foreground truncate" data-testid="occasions-title">
          {heading.title}
        </h1>
        <span className="w-10" />
      </div>

      <p className="text-sm font-semibold text-muted-foreground text-center mb-4">{heading.hint}</p>

      <GourmeatCategoryRow
        items={categories}
        active={occasionFilter}
        onSelect={setOccasionFilter}
        testID="occasion-gourmeat-row"
      />

      <GourmeatSectionTitle
        title={occasionFilter ? `${occasionFilter} dishes` : 'All occasion dishes'}
        testID="occasions-dish-header"
      />

      {isLoading && <SHCSkeletonGrid />}
      {!isLoading && gridProducts.length === 0 && (
        <SHCEmptyState
          title="No dishes for this occasion yet"
          description="Try another occasion or request the spread you need — a cook can list it."
          action={
            <SHCButton variant="outline" onClick={() => router.push('/request')}>
              Request a dish
            </SHCButton>
          }
        />
      )}

      {!isLoading && gridProducts.length > 0 && (
        <VirtualDishGrid
          products={gridProducts}
          isFavorite={isFavorite}
          isPopular={checkPopular}
          onFavoritePress={handleFavorite}
          onAddPress={handleAddToCart}
        />
      )}

      <div className="shc-section-stack">
        <RequestDishHomeCTA />
      </div>
    </section>
  );
}
