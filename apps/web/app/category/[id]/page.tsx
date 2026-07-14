'use client';

import React, { useMemo, useState, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  getCuisineCategoryById,
  scopeProductsByCategory,
  scopeKitchensByCategory,
  topRatedCategoryDishes,
  categoryOfferCopy,
  getDishImageUrl,
  getCookAvatarUrl,
} from '@shc/utils';
import { useProducts, useAddToCart } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import { useCustomerLocation } from '../../../lib/useCustomerLocation';
import { useDiscoverPrefs } from '../../../lib/useDiscoverPrefs';
import { getCooks } from '../../../lib/api-client';
import {
  GourmeatDishCard,
  GourmeatSectionTitle,
  FilterChipRow,
  SHCEmptyState,
  SHCButton,
  SHCSkeletonGrid,
  SHCSkeletonKitchenList,
  type DishCardProduct,
} from '../../components/SHCWebComponents';

function toDishCard(product: Record<string, unknown>): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    id: String(product.id),
    name: String(product.name),
    cook_name: String(product.cook_name || product.cook_display_name || ''),
    price: Number(product.price),
    cuisine: product.cuisine ? String(product.cuisine) : undefined,
    rating: product.rating != null ? Number(product.rating) : 4.8,
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
  const { data: products, isLoading } = useProducts('');
  const productList = (products as Record<string, unknown>[]) ?? [];
  const { data: cooks, isLoading: cooksLoading } = useQuery({ queryKey: ['cooks'], queryFn: getCooks, staleTime: 60_000 });
  const cookList = (cooks as Record<string, unknown>[]) ?? [];
  const { active: collectionLocation } = useCustomerLocation();
  const { halalOnly, toggleHalalOnly } = useDiscoverPrefs();
  const addMut = useAddToCart();
  const [chip, setChip] = useState('all');

  const category = useMemo(() => getCuisineCategoryById(categoryId), [categoryId]);
  const offer = useMemo(() => categoryOfferCopy(category), [category]);
  const title = category?.label || category?.id || 'Category';

  const categoryProducts = useMemo(() => {
    let list = scopeProductsByCategory(productList, categoryId);
    if (halalOnly || chip === 'halal') list = list.filter((p) => Boolean(p.halal));
    return list;
  }, [productList, categoryId, halalOnly, chip]);

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
      if (!user) {
        router.push('/login?next=' + encodeURIComponent(`/category/${encodeURIComponent(categoryId)}`));
        return;
      }
      addMut.mutate({ productId, qty: 1 });
    },
    [user, router, addMut, categoryId]
  );

  return (
    <section
      className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-8"
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
        <span className="w-10" />
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
      <FilterChipRow
        chips={[
          { id: 'all', label: 'All', active: chip === 'all' },
          { id: 'halal', label: 'Halal', active: chip === 'halal' || halalOnly },
          { id: 'nearest', label: 'Nearest', active: chip === 'nearest' },
        ]}
        onChipClick={(cid) => {
          setChip(cid);
          if (cid === 'halal') toggleHalalOnly();
          if (cid === 'nearest') router.push('/location');
        }}
        testID="category-filter-chips"
      />

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

      <ul className="space-y-3 mt-3">
        {kitchens.map((c) => {
          const cookId = String(c.id || c.slug || '');
          const cookName = String(c.display_name || c.name || 'Home kitchen');
          const slug = String(c.slug || c.id || '');
          const cover = getCookAvatarUrl(cookId, cookName);
          return (
            <li key={cookId}>
              <button
                type="button"
                data-testid={`category-kitchen-${cookId}`}
                className="w-full text-left rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden shadow-[var(--shc-shadow-brutal-sm)] hover:opacity-95"
                onClick={() => {
                  if (slug) router.push(`/cook/${slug}`);
                }}
              >
                <div className="relative h-36 w-full bg-muted">
                  <Image src={cover} alt="" fill className="object-cover" sizes="640px" />
                </div>
                <div className="p-3">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-black text-foreground truncate flex-1">{cookName}</p>
                    <span className="text-xs font-bold shrink-0">
                      ★ {c.rating != null ? Number(c.rating).toFixed(1) : '4.8'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground font-semibold line-clamp-1 mt-0.5">
                    {c.story ? String(c.story).slice(0, 80) : `${title} home cooking`}
                    {c.area ? ` · ${String(c.area)}` : ''}
                  </p>
                  <p className="text-sm font-extrabold text-green-700 mt-1">
                    Open <span className="text-muted-foreground font-semibold">· HDB collection</span>
                  </p>
                </div>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
