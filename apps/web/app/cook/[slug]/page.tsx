'use client';

/**
 * Kitchen page — HomelyEats / Jakob’s Law restaurant IA.
 * Hero · rating · open · tags/story · menu · order + tiffin CTAs.
 */
import React, { useEffect, useMemo, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getDishImageUrl,
  getCookAvatarUrl,
  getCookKitchenHeroUrl,
  scopeProductsByKitchen,
  kitchenOpenStatus,
  kitchenTagList,
} from '@shc/utils';
import { useCook, useProducts, useAddToCart } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import {
  SHCCard,
  SHCButton,
  SHCBadge,
  SHCLoading,
  GourmeatDishCard,
  GourmeatSectionTitle,
  type DishCardProduct,
} from '../../components/SHCWebComponents';
import { getHeritageArchive } from '../../../lib/api-client';

function toDishCard(p: Record<string, unknown>, cookName: string): DishCardProduct & { rating?: number; image_url?: string } {
  return {
    id: String(p.id),
    name: String(p.name),
    cook_name: cookName,
    price: Number(p.price),
    cuisine: p.cuisine ? String(p.cuisine) : undefined,
    rating: p.rating != null ? Number(p.rating) : 4.8,
    image_url: getDishImageUrl({
      id: String(p.id),
      cuisine: p.cuisine ? String(p.cuisine) : undefined,
      name: String(p.name),
    }),
  };
}

export default function KitchenPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const router = useRouter();
  const { data: cook, isLoading } = useCook(slug);
  const { data: products = [] } = useProducts('');
  const { user } = useAuth();
  const addMut = useAddToCart();
  const [heritage, setHeritage] = React.useState<Array<{ title?: string; story?: string; created_at?: string }>>([]);

  React.useEffect(() => {
    if (cook?.id) getHeritageArchive(cook.id).then(setHeritage).catch(() => {});
  }, [cook?.id]);

  const cookProducts = useMemo(
    () =>
      scopeProductsByKitchen(products as Record<string, unknown>[], {
        id: cook?.id,
        slug,
        display_name: cook?.display_name,
        name: cook?.name,
      }),
    [products, cook, slug]
  );

  const handleAdd = useCallback(
    (productId: string) => {
      if (!user) {
        router.push(`/login?next=${encodeURIComponent(`/cook/${slug}`)}`);
        return;
      }
      addMut.mutate({ productId, qty: 1 });
    },
    [user, router, addMut, slug]
  );

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label="Loading kitchen…" />
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10" data-testid="kitchen-missing">
        <h1 className="text-xl font-black mb-2">Kitchen not found</h1>
        <p className="text-sm text-muted-foreground mb-4">This kitchen link may be outdated.</p>
        <Link href="/">
          <SHCButton variant="outline">Back to home</SHCButton>
        </Link>
      </div>
    );
  }

  const open = kitchenOpenStatus(cook as any);
  const tags = kitchenTagList({
    ...(cook as any),
    cuisine: cook.cuisine || cookProducts[0]?.cuisine,
  });
  const hero = getCookKitchenHeroUrl(cook.display_name);
  const avatar = getCookAvatarUrl(cook.id, cook.display_name);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 pb-28 md:pb-10" data-testid="kitchen-page-screen">
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/"
          className="w-10 h-10 flex items-center justify-center text-2xl font-light"
          data-testid="kitchen-back-btn"
          aria-label="Back"
        >
          ‹
        </Link>
        <h1 className="flex-1 text-center text-lg font-black truncate" data-testid="kitchen-page-title">
          {cook.display_name}
        </h1>
        <span className="w-10" />
      </div>

      {/* Hero — HomelyEats kitchen page */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal-sm)] mb-4"
        data-testid="kitchen-page-hero"
      >
        <div className="relative h-44 bg-muted">
          <Image src={hero} alt="" fill className="object-cover" sizes="720px" priority />
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 to-transparent" />
          <div className="absolute bottom-3 left-3 right-3 flex items-end gap-3">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-white shrink-0">
              <Image src={avatar} alt="" fill className="object-cover" sizes="56px" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-black text-white text-xl truncate">{cook.display_name}</p>
              <p className="text-xs font-semibold text-white/90">
                {cook.area ? `${cook.area} · ` : ''}HDB collection
                {cook.orders ? ` · ${cook.orders}+ orders` : ''}
              </p>
            </div>
            <span
              className="shrink-0 rounded-lg bg-black px-2 py-1 text-xs font-extrabold text-white"
              data-testid="kitchen-rating-pill"
            >
              ★ {cook.rating != null ? Number(cook.rating).toFixed(1) : '4.8'}
            </span>
          </div>
        </div>
        <div className="p-4">
          <p
            className={`text-sm font-extrabold ${open.isOpen ? 'text-green-700' : 'text-red-700'}`}
            data-testid="kitchen-open-status"
          >
            {open.label}{' '}
            <span className="text-muted-foreground font-semibold">· {open.detail}</span>
          </p>
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3" data-testid="kitchen-tags">
              {tags.map((t) => (
                <SHCBadge key={t} variant="heritage">
                  {t}
                </SHCBadge>
              ))}
            </div>
          )}
          {cook.story && (
            <p className="text-sm text-muted-foreground font-semibold mt-3 leading-relaxed" data-testid="kitchen-story">
              {cook.story}
            </p>
          )}
        </div>
      </div>

      <GourmeatSectionTitle
        title={cookProducts.length ? `Menu · ${cookProducts.length} dishes` : 'Menu'}
        testID="kitchen-menu-header"
      />
      {cookProducts.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground mb-4" data-testid="kitchen-menu-empty">
          No dishes listed for this kitchen yet.
        </p>
      ) : (
        <div className="grid grid-cols-2 gap-3 mb-6" data-testid="kitchen-menu-grid">
          {cookProducts.map((p) => (
            <GourmeatDishCard
              key={String(p.id)}
              product={toDishCard(p, cook.display_name)}
              onAddPress={() => handleAdd(String(p.id))}
            />
          ))}
        </div>
      )}

      <div
        className="rounded-2xl bg-[#1E3A5F] text-white p-4 mb-6"
        data-testid="kitchen-tiffin-cta-card"
      >
        <p className="font-black text-base">Weekly tiffin from this kitchen</p>
        <p className="text-xs font-semibold opacity-90 mt-1 mb-3">2 · 3 · 4 meals/week · flexible skip &amp; pause</p>
        <SHCButton
          onClick={() => router.push(`/tiffin/kitchen/${cook.id}`)}
          testID="kitchen-tiffin-cta"
          className="w-full"
        >
          View tiffin plans
        </SHCButton>
      </div>

      {heritage.length > 0 && (
        <>
          <GourmeatSectionTitle title="Heritage stories" testID="kitchen-heritage-header" />
          <div className="space-y-3 mb-6">
            {heritage.map((h, i) => (
              <SHCCard key={i}>
                <div className="font-bold text-foreground">{h.title}</div>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{h.story}</p>
              </SHCCard>
            ))}
          </div>
        </>
      )}

      {cookProducts.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 md:static p-4 md:p-0 bg-card/95 md:bg-transparent border-t md:border-0 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),16px)] md:pb-0">
          <div className="max-w-2xl mx-auto">
            <SHCButton className="w-full" onClick={() => router.push('/cart')} testID="kitchen-order-cta">
              View cart
            </SHCButton>
          </div>
        </div>
      )}
    </div>
  );
}
