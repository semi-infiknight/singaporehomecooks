'use client';

/**
 * Kitchen page — HomelyEats restaurant IA (Jakob’s Law).
 * Hero · rating · menu sections · About · Collection hours · Reviews.
 */
import React, { useEffect, useMemo, useCallback, useState } from 'react';
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
  kitchenRatingSummary,
  kitchenRatingBuckets,
  kitchenDemoReviews,
  sortKitchenReviews,
  kitchenCollectionHours,
  kitchenAboutPoints,
  kitchenMenuSections,
  kitchenDishPriceLabel,
  type KitchenReviewSort,
} from '@shc/utils';
import { useCook, useProducts, useAddToCart } from '../../../lib/useProducts';
import { useAuth } from '../../../lib/useAuth';
import {
  SHCCard,
  SHCButton,
  SHCBadge,
  SHCLoading,
  type DishCardProduct,
} from '../../components/SHCWebComponents';
import { getHeritageArchive } from '../../../lib/api-client';

type TabId = 'menu' | 'about' | 'hours' | 'reviews';

const TABS: { id: TabId; label: string }[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'about', label: 'About' },
  { id: 'hours', label: 'Collection hours' },
  { id: 'reviews', label: 'Reviews' },
];

const REVIEW_SORTS: { id: KitchenReviewSort; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'photos', label: 'With photos' },
];

export default function KitchenPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const router = useRouter();
  const { data: cook, isLoading } = useCook(slug);
  const { data: products = [] } = useProducts('');
  const { user } = useAuth();
  const addMut = useAddToCart();
  const [heritage, setHeritage] = useState<Array<{ title?: string; story?: string }>>([]);
  const [tab, setTab] = useState<TabId>('menu');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');

  useEffect(() => {
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

  const menuSections = useMemo(() => kitchenMenuSections(cookProducts), [cookProducts]);

  useEffect(() => {
    if (menuSections.length) {
      setOpenSections((prev) => {
        const next = { ...prev };
        menuSections.forEach((s, i) => {
          if (next[s.id] === undefined) next[s.id] = i === 0;
        });
        return next;
      });
    }
  }, [menuSections]);

  const ratingSum = useMemo(() => kitchenRatingSummary(cook as any), [cook]);
  const buckets = useMemo(() => kitchenRatingBuckets(ratingSum.rating), [ratingSum.rating]);
  const reviews = useMemo(
    () => sortKitchenReviews(kitchenDemoReviews(String(cook?.id || slug || 'kitchen')), reviewSort),
    [cook?.id, slug, reviewSort]
  );
  const hours = useMemo(
    () =>
      kitchenCollectionHours({
        collection_instructions: cook?.collection_instructions,
      }),
    [cook?.collection_instructions]
  );
  const aboutPoints = useMemo(() => kitchenAboutPoints(cook as any), [cook]);

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
  const kitchenPhoto = getCookKitchenHeroUrl(cook.id || cook.display_name);

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

      {/* Hero */}
      <div
        className="rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal-sm)] mb-3"
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
            <button
              type="button"
              className="shrink-0 rounded-lg bg-black px-2 py-1 text-xs font-extrabold text-white"
              data-testid="kitchen-rating-pill"
              onClick={() => setTab('reviews')}
            >
              ★ {ratingSum.label}
            </button>
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
            <p className="text-sm text-muted-foreground font-semibold mt-3 line-clamp-2" data-testid="kitchen-story">
              {cook.story}
            </p>
          )}
        </div>
      </div>

      {/* Tabs — Menu · About · Hours · Reviews */}
      <div
        className="flex gap-1 overflow-x-auto border-b-2 border-[var(--shc-border-brutal)] mb-4 scrollbar-hide"
        data-testid="kitchen-tabs"
        role="tablist"
      >
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            data-testid={`kitchen-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-2.5 text-sm font-extrabold border-b-2 -mb-0.5 transition-colors ${
              tab === t.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Menu ── */}
      {tab === 'menu' && (
        <div data-testid="kitchen-tab-panel-menu">
          {menuSections.length === 0 ? (
            <p className="text-sm font-semibold text-muted-foreground mb-4" data-testid="kitchen-menu-empty">
              No dishes listed for this kitchen yet.
            </p>
          ) : (
            <div className="space-y-3 mb-4" data-testid="kitchen-menu-sections">
              {menuSections.map((section) => {
                const isOpen = openSections[section.id] !== false;
                return (
                  <div
                    key={section.id}
                    className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card overflow-hidden"
                    data-testid={`kitchen-menu-section-${section.id}`}
                  >
                    <button
                      type="button"
                      className="w-full flex items-center justify-between p-3 text-left"
                      onClick={() =>
                        setOpenSections((s) => ({ ...s, [section.id]: !isOpen }))
                      }
                    >
                      <div>
                        <p className="font-black text-foreground">{section.title}</p>
                        <p className="text-xs font-semibold text-muted-foreground mt-0.5">
                          {section.subtitle}
                        </p>
                      </div>
                      <span className="text-lg font-light text-muted-foreground">{isOpen ? '⌃' : '⌄'}</span>
                    </button>
                    {isOpen && (
                      <ul className="border-t-2 border-[var(--shc-border-brutal)] divide-y-2 divide-[var(--shc-border-brutal)]">
                        {section.dishes.map((d) => {
                          const price = kitchenDishPriceLabel(d);
                          return (
                            <li key={String(d.id)} className="flex gap-3 items-center p-3">
                              <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted">
                                <Image
                                  src={getDishImageUrl({
                                    id: String(d.id),
                                    cuisine: d.cuisine ? String(d.cuisine) : undefined,
                                    name: String(d.name),
                                  })}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="56px"
                                />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-bold text-sm truncate">{String(d.name)}</p>
                                <p className="text-xs text-muted-foreground line-clamp-1">
                                  {d.heritage_note
                                    ? String(d.heritage_note).slice(0, 60)
                                    : d.cuisine
                                      ? `${d.cuisine} heritage`
                                      : 'Home-cooked'}
                                </p>
                                {price && (
                                  <p className="text-sm font-black text-primary mt-0.5">{price}/portion</p>
                                )}
                              </div>
                              <div className="flex flex-col gap-1 shrink-0">
                                <SHCButton size="sm" onClick={() => handleAdd(String(d.id))} testID={`kitchen-add-${d.id}`}>
                                  + Add
                                </SHCButton>
                                <Link
                                  href={`/product/${d.id}`}
                                  className="text-[10px] font-bold text-center text-primary"
                                >
                                  Details
                                </Link>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div
            className="rounded-2xl bg-[#1E3A5F] text-white p-4 mb-4"
            data-testid="kitchen-tiffin-cta-card"
          >
            <p className="font-black text-base">Weekly tiffin from this kitchen</p>
            <p className="text-xs font-semibold opacity-90 mt-1 mb-3">
              2 · 3 · 4 meals/week · flexible skip &amp; pause
            </p>
            <SHCButton
              onClick={() => router.push(`/tiffin/kitchen/${cook.id}`)}
              testID="kitchen-tiffin-cta"
              className="w-full"
            >
              View tiffin plans
            </SHCButton>
          </div>
        </div>
      )}

      {/* ── About ── */}
      {tab === 'about' && (
        <div className="space-y-4 mb-6" data-testid="kitchen-tab-panel-about">
          <div className="relative h-48 rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)]">
            <Image src={kitchenPhoto} alt="Kitchen" fill className="object-cover" sizes="720px" />
          </div>
          <ul className="space-y-2" data-testid="kitchen-about-points">
            {aboutPoints.map((p) => (
              <li key={p} className="flex items-start gap-2 text-sm font-semibold">
                <span className="text-primary">✓</span>
                <span>{p}</span>
              </li>
            ))}
          </ul>
          <SHCCard data-testid="kitchen-about-location">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">Location</p>
            <p className="font-bold mt-1">{cook.area || 'Singapore'}</p>
            <p className="text-sm text-muted-foreground font-semibold mt-1">
              {cook.collection_address || 'HDB collection point shared after order accept'}
            </p>
            {cook.collection_instructions && (
              <p className="text-sm mt-2 font-semibold">{cook.collection_instructions}</p>
            )}
          </SHCCard>
          <SHCCard data-testid="kitchen-about-chef">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">About the cook</p>
            <div className="flex gap-3 mt-2 items-center">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                <Image src={avatar} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <p className="font-black">{cook.display_name}</p>
                <p className="text-sm text-muted-foreground font-semibold line-clamp-3">
                  {cook.story || 'Home cook sharing heritage recipes from an HDB kitchen.'}
                </p>
              </div>
            </div>
          </SHCCard>
          {heritage.length > 0 && (
            <div data-testid="kitchen-heritage">
              <p className="font-black mb-2">Heritage stories</p>
              {heritage.map((h, i) => (
                <SHCCard key={i} className="mb-2">
                  <p className="font-bold">{h.title}</p>
                  <p className="text-sm text-muted-foreground mt-1">{h.story}</p>
                </SHCCard>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Collection hours ── */}
      {tab === 'hours' && (
        <div className="space-y-3 mb-6" data-testid="kitchen-tab-panel-hours">
          <p className="text-sm font-semibold text-muted-foreground">
            Kitchen collection timings (HDB — not door delivery)
          </p>
          {hours.map((slot) => (
            <div
              key={slot.id}
              className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card px-4 py-3"
              data-testid={`kitchen-hour-${slot.id}`}
            >
              <p className="font-black text-sm">{slot.label}</p>
              <p className="text-sm font-semibold text-muted-foreground mt-0.5">{slot.window}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── Reviews ── */}
      {tab === 'reviews' && (
        <div className="space-y-4 mb-6" data-testid="kitchen-tab-panel-reviews">
          <div
            className="rounded-2xl border-2 border-[var(--shc-border-brutal)] bg-card p-4"
            data-testid="kitchen-rating-breakdown"
          >
            <div className="flex items-end gap-4 mb-4">
              <div>
                <p className="text-4xl font-black tabular-nums">{ratingSum.rating.toFixed(1)}</p>
                <p className="text-xs font-bold text-muted-foreground">/ 5.0</p>
                <p className="text-xs font-semibold text-muted-foreground mt-1">
                  {ratingSum.reviewCount} reviews
                </p>
              </div>
              <div className="flex-1 space-y-1.5">
                {buckets.map((b) => (
                  <div key={b.key} className="flex items-center gap-2 text-xs font-semibold">
                    <span className="w-20 shrink-0 text-muted-foreground">{b.label}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full rounded-full bg-primary"
                        style={{ width: `${Math.round(b.share * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-xs font-semibold text-muted-foreground">
              Community samples for this kitchen · leave a review after you collect an order.
            </p>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide" data-testid="kitchen-review-sorts">
            {REVIEW_SORTS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setReviewSort(s.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border-2 ${
                  reviewSort === s.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-[var(--shc-border-brutal)] bg-card'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <ul className="space-y-3" data-testid="kitchen-reviews-list">
            {reviews.map((r) => (
              <li
                key={r.id}
                className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3"
                data-testid={`kitchen-review-${r.id}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-black text-sm">{r.author}</p>
                  <p className="text-xs text-muted-foreground font-semibold">
                    {r.daysAgo === 1 ? '1 day ago' : `${r.daysAgo} days ago`}
                  </p>
                </div>
                <p className="text-sm font-bold text-primary mt-0.5">
                  {'★'.repeat(r.rating)}
                  {'☆'.repeat(5 - r.rating)}
                </p>
                <p className="text-sm font-semibold text-muted-foreground mt-1 leading-relaxed">{r.body}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      {cookProducts.length > 0 && tab === 'menu' && (
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
