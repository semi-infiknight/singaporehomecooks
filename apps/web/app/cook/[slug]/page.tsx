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
  kitchenRatingBucketsFromReviews,
  kitchenReviewFromApi,
  sortKitchenReviews,
  kitchenCollectionHours,
  kitchenAboutPoints,
  kitchenChefBackground,
  kitchenMenuSections,
  kitchenTrustCerts,
  kitchenDishPriceLabel,
  kitchenMenuFilterChips,
  filterKitchenMenuDishes,
  kitchenMealSectionDeliveryHint,
  upsertKitchenOrderLine,
  setKitchenOrderLineQty,
  lineQtyForProduct,
  formatKitchenOrderCta,
  formatKitchenSubscribeCta,
  cartItemsAddedLabel,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  getDropImageUrl,
  type KitchenReviewSort,
  type KitchenOrderLine,
  VIRTUAL_KITCHEN_MENU_ROW_HEIGHT,
} from '@shc/utils';
import { useCook, useCookReviews, useProducts, useAddToCart } from '../../../lib/useProducts';
import { useDrops } from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import { useGuestAuthGate } from '../../../lib/useGuestAuthGate';
import {
  SHCCard,
  SHCButton,
  SHCBadge,
  SHCMetaBadge,
  SHCSkeletonGrid,
  KitchenTrustCertsList,
  RecipeStoryPreview,
} from '../../components/SHCWebComponents';
import { KitchenMealCustomizeSheet } from '../../components/KitchenMealCustomize';
import { VirtualRowList } from '../../components/VirtualLists';

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
  const { data: reviewsPayload } = useCookReviews(slug, { limit: 50 });
  const { data: products = [] } = useProducts('');
  const { data: kitchenDropsRaw = [] } = useDrops(cook?.id ? String(cook.id) : undefined, {
    enabled: Boolean(cook?.id),
  });
  const kitchenDrops = useMemo(
    () => filterCustomerCookingSoonDrops(kitchenDropsRaw as { cook_date?: string; status?: string }[]),
    [kitchenDropsRaw]
  );
  const { user } = useAuth();
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart({ silent: true });
  const [tab, setTab] = useState<TabId>('menu');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');
  const [menuFilter, setMenuFilter] = useState('all');
  const [orderLines, setOrderLines] = useState<KitchenOrderLine[]>([]);
  const [customizeDish, setCustomizeDish] = useState<Record<string, unknown> | null>(null);
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

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

  const filteredProducts = useMemo(
    () => filterKitchenMenuDishes(cookProducts, menuFilter),
    [cookProducts, menuFilter]
  );

  const menuSections = useMemo(() => kitchenMenuSections(filteredProducts), [filteredProducts]);

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
  const buckets = useMemo(() => {
    const fromReviews = kitchenRatingBucketsFromReviews(reviewsPayload?.reviews || []);
    if (fromReviews) return fromReviews;
    if (ratingSum) return kitchenRatingBuckets(ratingSum.rating);
    return [];
  }, [reviewsPayload?.reviews, ratingSum]);
  const reviews = useMemo(
    () =>
      sortKitchenReviews(
        (reviewsPayload?.reviews || []).map(kitchenReviewFromApi),
        reviewSort
      ),
    [reviewsPayload?.reviews, reviewSort]
  );
  const hours = useMemo(
    () =>
      kitchenCollectionHours({
        collection_instructions: cook?.collection_instructions,
      }),
    [cook?.collection_instructions]
  );
  const aboutPoints = useMemo(() => kitchenAboutPoints(cook as any), [cook]);
  const trustCerts = useMemo(() => kitchenTrustCerts(cook as any), [cook]);
  const chefBg = useMemo(() => kitchenChefBackground(cook as any), [cook]);

  const openCustomize = useCallback(
    (dish: Record<string, unknown>) => {
      if (!requireAuth('Sign in to add dishes to your cart.', `/cook/${slug}`)) return;
      setCustomizeDish(dish);
    },
    [requireAuth, slug]
  );

  const confirmCustomize = useCallback(
    (line: KitchenOrderLine) => {
      setOrderLines((prev) => upsertKitchenOrderLine(prev, line));
      addMut.mutate({ productId: line.productId, qty: line.qty });
    },
    [addMut]
  );

  const bumpLineQty = useCallback(
    (productId: string, delta: number) => {
      if (delta > 0 && !requireAuth('Sign in to add dishes to your cart.', `/cook/${slug}`)) return;
      setOrderLines((prev) => {
        const cur = lineQtyForProduct(prev, productId);
        const next = cur + delta;
        if (next <= 0) return setKitchenOrderLineQty(prev, productId, 0);
        if (delta > 0) addMut.mutate({ productId, qty: 1 });
        return setKitchenOrderLineQty(prev, productId, next);
      });
    },
    [addMut, requireAuth, slug]
  );

  const orderCta = useMemo(() => formatKitchenOrderCta(orderLines), [orderLines]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="kitchen-page-loading">
        <div className="shc-skeleton h-40 w-full rounded-2xl mb-4" />
        <div className="shc-skeleton h-5 w-[55%] mb-2" />
        <div className="shc-skeleton h-3.5 w-[35%] mb-4" />
        <SHCSkeletonGrid count={4} />
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
  const hero = getCookKitchenHeroUrl(cook.id, cook.hero_image_url);
  const avatar = getCookAvatarUrl(cook.id, cook.display_name, cook.avatar_url);
  const kitchenPhoto = getCookKitchenHeroUrl(cook.id, cook.hero_image_url);

  const openDrops = (kitchenDrops as any[]).filter((d) => d.status === 'open' || d.status === 'sold_out');

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 shc-tab-bar-pad md:pb-10" data-testid="kitchen-page-screen">
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
            {ratingSum ? (
              <button
                type="button"
                className="shrink-0 rounded-lg bg-black px-2 py-1 text-xs font-extrabold text-white"
                data-testid="kitchen-rating-pill"
                onClick={() => router.push(`/cook/${slug}/ratings`)}
              >
                ★ {ratingSum.label}
              </button>
            ) : null}
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
                <SHCMetaBadge key={t} kind="occasion">
                  {t}
                </SHCMetaBadge>
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

      {/* Cooking soon — active batches for this kitchen */}
      {openDrops.length > 0 && (
        <div className="mb-4 space-y-2" data-testid="kitchen-cooking-soon">
          <h2 className="font-black text-base">Cooking soon</h2>
          {openDrops.map((d) => (
            <button
              key={d.id}
              type="button"
              data-testid={`kitchen-drop-${d.id}`}
              onClick={() => router.push(`/drops/${encodeURIComponent(d.id)}`)}
              className="w-full text-left rounded-2xl border border-[var(--shc-border)] bg-card overflow-hidden shadow-[var(--shc-shadow-soft)] hover:opacity-95"
            >
              <div className="relative h-24 w-full bg-muted">
                <Image
                  src={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: d.cook_id })}
                  alt=""
                  fill
                  className="object-cover"
                  sizes="640px"
                />
              </div>
              <div className="p-4 flex items-start justify-between gap-2">
                <div>
                  <p className="font-black">{d.title}</p>
                  <p className="text-xs font-semibold text-muted-foreground">
                    {formatDropCookDate(d.cook_date)} · {d.collection_slot} · by {formatDropOrderBy(d.order_by)}
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-primary">
                    {formatDropPrice(d.price_cents, d.price)} · {d.remaining_qty ?? 0} of {d.max_qty} left
                  </p>
                </div>
                <span className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-extrabold text-primary-foreground">
                  Order
                </span>
              </div>
            </button>
          ))}
        </div>
      )}

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

      {/* ── Menu — HomelyEats kitchen order flow ── */}
      {tab === 'menu' && (
        <div data-testid="kitchen-tab-panel-menu">
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide" data-testid="kitchen-menu-filters">
            {kitchenMenuFilterChips().map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setMenuFilter(f.id)}
                className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-bold border-2 ${
                  menuFilter === f.id
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-[var(--shc-border-brutal)] bg-card'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

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
                          {kitchenMealSectionDeliveryHint(section.title)}
                        </p>
                      </div>
                      <span className="text-lg font-light text-muted-foreground">{isOpen ? '⌃' : '⌄'}</span>
                    </button>
                    {isOpen && (
                      <div className="border-t-2 border-[var(--shc-border-brutal)]">
                        <VirtualRowList
                          items={section.dishes}
                          getKey={(d) => String(d.id)}
                          rowHeight={VIRTUAL_KITCHEN_MENU_ROW_HEIGHT}
                          testID={`kitchen-menu-section-list-${section.id}`}
                          renderItem={(d) => {
                          const price = kitchenDishPriceLabel(d);
                          const qty = lineQtyForProduct(orderLines, String(d.id));
                          return (
                            <div data-testid={`kitchen-menu-wrap-${d.id}`}>
                              <div className="flex gap-3 items-center p-3 border-b-2 border-[var(--shc-border-brutal)] last:border-b-0" data-testid={`kitchen-menu-row-${d.id}`}>
                              <button
                                type="button"
                                className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-muted"
                                onClick={() => router.push(`/product/${encodeURIComponent(String(d.id))}`)}
                              >
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
                              </button>
                              <div className="flex-1 min-w-0">
                                <button
                                  type="button"
                                  className="text-left w-full"
                                  onClick={() => router.push(`/product/${encodeURIComponent(String(d.id))}`)}
                                >
                                  <p className="font-bold text-sm truncate">{String(d.name)}</p>
                                  <p className="text-xs text-muted-foreground line-clamp-1">
                                    {d.cuisine ? String(d.cuisine) : 'Home-cooked'}
                                  </p>
                                </button>
                                {price && (
                                  <p className="text-sm font-black text-primary mt-0.5">{price}/portion</p>
                                )}
                                <p className="text-[10px] font-bold text-primary/80">Customizable</p>
                              </div>
                              {qty > 0 ? (
                                <div
                                  className="flex items-center gap-2 border-2 border-[var(--shc-border-brutal)] rounded-xl px-1"
                                  data-testid={`kitchen-row-qty-${d.id}`}
                                >
                                  <button
                                    type="button"
                                    className="w-8 h-8 font-black"
                                    onClick={() => bumpLineQty(String(d.id), -1)}
                                  >
                                    −
                                  </button>
                                  <span className="font-black tabular-nums w-5 text-center">{qty}</span>
                                  <button
                                    type="button"
                                    className="w-8 h-8 font-black"
                                    onClick={() => openCustomize(d)}
                                  >
                                    +
                                  </button>
                                </div>
                              ) : (
                                <SHCButton
                                  size="sm"
                                  onClick={() => openCustomize(d)}
                                  testID={`kitchen-add-${d.id}`}
                                >
                                  + Add
                                </SHCButton>
                              )}
                              </div>
                              <RecipeStoryPreview
                                dish={d as Record<string, unknown>}
                                cookName={cook.display_name}
                                expanded={expandedRecipeId === String(d.id)}
                                onToggle={() =>
                                  setExpandedRecipeId((cur) => (cur === String(d.id) ? null : String(d.id)))
                                }
                                onOpenDish={() => router.push(`/product/${encodeURIComponent(String(d.id))}`)}
                                testID={`kitchen-recipe-${d.id}`}
                              />
                            </div>
                          );
                        }}
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <p className="text-xs font-semibold text-muted-foreground mb-4">
            Report an issue with the menu · Trust &amp; Safety on Home
          </p>
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
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Chef&apos;s background
            </p>
            <div className="flex gap-3 mt-2 items-start">
              <div className="relative w-12 h-12 rounded-full overflow-hidden shrink-0">
                <Image src={avatar} alt="" fill className="object-cover" sizes="48px" />
              </div>
              <div>
                <p className="font-black">{cook.display_name}</p>
                <p className="text-sm text-muted-foreground font-semibold line-clamp-4">{chefBg}</p>
              </div>
            </div>
          </SHCCard>
          <KitchenTrustCertsList certs={trustCerts} />
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
            {ratingSum ? (
              <div className="flex items-end gap-4 mb-4">
                <div>
                  <p className="text-4xl font-black tabular-nums">{ratingSum.rating.toFixed(1)}</p>
                  <p className="text-xs font-bold text-muted-foreground">/ 5.0</p>
                  {ratingSum.reviewCount != null ? (
                    <p className="text-xs font-semibold text-muted-foreground mt-1">
                      {ratingSum.reviewCount} reviews
                    </p>
                  ) : null}
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
            ) : (
              <p className="text-sm font-semibold text-muted-foreground mb-4">No ratings yet for this kitchen.</p>
            )}
            <p className="text-xs font-semibold text-muted-foreground">
              {reviews.length > 0
                ? 'Verified reviews from customers who collected their orders.'
                : 'No reviews yet. Leave one after you collect an order (PayNow → collected).'}
            </p>
            {ratingSum ? (
              <button
                type="button"
                className="mt-3 text-sm font-bold text-primary"
                data-testid="kitchen-see-all-ratings"
                onClick={() => router.push(`/cook/${slug}/ratings`)}
              >
                Open full ratings →
              </button>
            ) : null}
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
            {reviews.length === 0 ? (
              <li className="text-sm font-semibold text-muted-foreground" data-testid="kitchen-reviews-empty">
                No written reviews yet for this kitchen.
              </li>
            ) : (
              reviews.map((r) => (
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
              ))
            )}
          </ul>
        </div>
      )}

      {/* Sticky bar — HomelyEats “Create subscription” analogue: cart + tiffin */}
      {tab === 'menu' && orderLines.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 p-3 bg-card/95 border-t-2 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),12px)]"
          data-testid="kitchen-order-sticky"
        >
          <div className="max-w-2xl mx-auto flex flex-col gap-2">
            <div className="flex items-center justify-between text-sm font-bold mb-1">
              <span data-testid="kitchen-order-item-label">
                {cartItemsAddedLabel(
                  orderLines.reduce((s, l) => s + l.qty, 0)
                )}
              </span>
              <span className="tabular-nums text-primary" data-testid="kitchen-order-total">
                {orderCta.totalLabel}
              </span>
            </div>
            <div className="flex gap-2">
              <SHCButton
                className="flex-1"
                onClick={() => router.push('/cart')}
                testID="kitchen-order-cta"
              >
                View cart {orderCta.totalLabel}
              </SHCButton>
              <SHCButton
                variant="outline"
                className="flex-1"
                onClick={() => router.push(`/tiffin/kitchen/${cook.id}`)}
                testID="kitchen-subscribe-cta"
              >
                {formatKitchenSubscribeCta()}
              </SHCButton>
            </div>
          </div>
        </div>
      )}

      <KitchenMealCustomizeSheet
        dish={customizeDish}
        open={Boolean(customizeDish)}
        onClose={() => setCustomizeDish(null)}
        onConfirm={confirmCustomize}
      />
    </div>
  );
}
