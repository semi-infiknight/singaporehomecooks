'use client';

/**
 * Tiffin kitchen page — HomelyEats restaurant IA + plan subscribe.
 * Browse without login; auth only on subscribe.
 */
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  getCookAvatarUrl,
  getDishImageUrl,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenTiffinPlanRows,
  kitchenDishPriceLabel,
  kitchenRatingSummary,
  kitchenCollectionHours,
  kitchenAboutPoints,
  kitchenChefBackground,
  kitchenTrustCerts,
  kitchenDemoReviews,
  sortKitchenReviews,
  kitchenRatingBuckets,
  tiffinPlanDurationOptions,
  tiffinPlanDurationTotal,
  subscribeTrustChips,
  kitchenSubscriberLabel,
  tiffinPlanFeaturesForTier,
  tiffinPlanBestValueMeals,
  tiffinPlanStrikethroughPrice,
  tiffinPlanSavingsLabel,
  type TiffinPlanDurationId,
} from '@shc/utils';
import { useAuth } from '../../../../lib/useAuth';
import { useGuestAuthTray } from '../../../../lib/useGuestAuthTray';
import {
  useTiffinKitchen,
  useSubscribeTiffin,
  tiffinPricePerServing,
  tiffinWeeklySubtotal,
  TIFFIN_DAY_LABELS,
} from '../../../../lib/useTiffin';
import {
  SHCButton,
  SHCCard,
  SHCBadge,
  SHCMetaBadge,
  SHCErrorBanner,
  GourmeatSectionTitle,
  KitchenTrustCertsList,
  SubscribeTrustList,
  SubscribeFunnelProgress,
  TiffinPlanFeatureList,
  SHCSkeletonList,
  RecipeStoryPreview,
} from '../../../components/SHCWebComponents';
import { VirtualRowList } from '../../../components/VirtualLists';

export default function TiffinKitchenPage() {
  const params = useParams();
  const cookId = String(params?.cookId || '');
  const router = useRouter();
  const { user } = useAuth();
  const { showGuestAuthTray } = useGuestAuthTray();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId);
  const subscribeMut = useSubscribeTiffin();
  const mealsOptions: number[] = (kitchen as any)?.meals_per_week_options || [2, 3, 4];
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(3);
  const [planDuration, setPlanDuration] = useState<TiffinPlanDurationId>('7d');
  const [tab, setTab] = useState<'plan' | 'about' | 'hours' | 'reviews'>('plan');
  const [subscribeError, setSubscribeError] = useState('');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);

  useEffect(() => {
    if (mealsOptions.length) {
      setMealsPerWeek(mealsOptions[1] || mealsOptions[0]);
    }
  }, [JSON.stringify(mealsOptions)]);

  const dishes = ((kitchen as any)?.dishes || []) as Array<{
    id: string;
    name: string;
    price?: number;
    cuisine?: string;
    description?: string;
    ingredients?: Array<{ name: string; quantity?: number; unit?: string }>;
    min_qty?: number;
  }>;

  const cookName = (kitchen as any)?.cook?.display_name || 'Kitchen';
  const cookMeta = {
    id: cookId,
    display_name: cookName,
    area: (kitchen as any)?.cook?.area,
    story: (kitchen as any)?.tagline || (kitchen as any)?.cook?.story,
    cuisine: dishes[0]?.cuisine,
    rating: (kitchen as any)?.rating ?? (kitchen as any)?.cook?.rating ?? 4.8,
    review_count: (kitchen as any)?.review_count,
    subscriber_count: (kitchen as any)?.subscriber_count,
    status: (kitchen as any)?.enabled === false ? 'paused' : 'active',
    collection_instructions: (kitchen as any)?.cook?.collection_instructions,
  };
  const open = kitchenOpenStatus(cookMeta);
  const tags = kitchenTagList(cookMeta);
  const planRows = useMemo(
    () => kitchenTiffinPlanRows(mealsOptions, tiffinPricePerServing),
    [mealsOptions]
  );
  const ratingSum = kitchenRatingSummary(cookMeta);
  const hours = kitchenCollectionHours({
    collection_days: (kitchen as any)?.collection_days,
    collection_instructions: (kitchen as any)?.cook?.collection_instructions,
  });
  const aboutPoints = kitchenAboutPoints(cookMeta);
  const trustCerts = kitchenTrustCerts({
    ...cookMeta,
    sfa_reg_number: (kitchen as any)?.cook?.sfa_reg_number,
  });
  const chefBg = kitchenChefBackground(cookMeta);
  const durationOpts = tiffinPlanDurationOptions();
  const selectedDuration = durationOpts.find((d) => d.id === planDuration) || durationOpts[0];
  const durationTotal = tiffinPlanDurationTotal(
    mealsPerWeek,
    tiffinPricePerServing(mealsPerWeek),
    selectedDuration.weeks
  );
  const reviews = sortKitchenReviews(kitchenDemoReviews(cookId), 'recent');
  const buckets = kitchenRatingBuckets(ratingSum.rating);
  const avatar = getCookAvatarUrl(cookId, cookName);
  const trustChips = subscribeTrustChips({
    area: (kitchen as any)?.cook?.area,
    cookName,
  });
  const bestValueAt = tiffinPlanBestValueMeals(mealsOptions);
  const planFeatures = useMemo(
    () => tiffinPlanFeaturesForTier(mealsPerWeek),
    [mealsPerWeek]
  );

  const handleSubscribe = async () => {
    setSubscribeError('');
    if (!cookId) {
      setSubscribeError('Kitchen id missing. Go back and open a kitchen again.');
      return;
    }
    if (!user) {
      showGuestAuthTray(
        'Sign in to subscribe',
        'Browse kitchens freely — sign in to start a tiffin plan and pick meals.',
        `/tiffin/kitchen/${cookId}`
      );
      return;
    }
    try {
      await subscribeMut.mutateAsync({
        cookId,
        mealsPerWeek: mealsPerWeek as 2 | 3 | 4,
        weeks: selectedDuration.weeks,
      });
      router.replace('/tiffin/confirm');
    } catch (e: unknown) {
      const err = e as { message?: string };
      const msg =
        err?.message === 'Failed to fetch'
          ? 'Could not reach the server. Check your connection and try again.'
          : err?.message || 'Unable to subscribe. Try again or pick another kitchen.';
      setSubscribeError(msg);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="shc-skeleton h-40 w-full rounded-2xl mb-4" />
        <SHCSkeletonList count={4} rowHeight={56} />
      </div>
    );
  }

  if (!kitchen) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10" data-testid="tiffin-kitchen-missing">
        <h1 className="text-xl font-black mb-2">Kitchen unavailable</h1>
        <p className="text-sm text-muted-foreground mb-4">This kitchen is not offering tiffin right now.</p>
        <SHCButton onClick={() => router.push('/tiffin')}>Back to tiffin</SHCButton>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-4 shc-safe-bottom-pad" data-testid="tiffin-kitchen-screen">
      <div className="flex items-center gap-2 mb-3">
        <Link
          href="/tiffin"
          className="w-10 h-10 flex items-center justify-center text-2xl font-light"
          data-testid="kitchen-back-btn"
        >
          ‹
        </Link>
        <h1 className="flex-1 text-center text-lg font-black truncate" data-testid="kitchen-page-title">
          {cookName}
        </h1>
        <span className="w-10" />
      </div>

      <div
        className="rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] bg-card shadow-[var(--shc-shadow-brutal-sm)] mb-4"
        data-testid="kitchen-page-hero"
      >
        <div className="relative h-44 bg-[var(--shc-bento-mint)]">
          <Image src={avatar} alt="" fill className="object-cover" sizes="720px" priority />
        </div>
        <div className="p-4">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0 flex-1">
              <p className="font-black text-xl truncate">{cookName}</p>
              <p className="text-sm text-muted-foreground font-semibold mt-1">
                {(kitchen as any).tagline ||
                  `${(kitchen as any).cook?.area || 'Singapore'} · home-cooked tiffin`}
              </p>
            </div>
            <span
              className="shrink-0 rounded-lg bg-black px-2 py-1 text-xs font-extrabold text-white"
              data-testid="kitchen-rating-pill"
            >
              ★ {ratingSum.label}
            </span>
          </div>
          <p
            className={`text-sm font-extrabold mt-2 ${open.isOpen ? 'text-green-700' : 'text-red-700'}`}
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
          {(kitchen as any).cook?.story && (
            <p className="text-sm text-muted-foreground font-semibold mt-3 leading-relaxed" data-testid="kitchen-story">
              {(kitchen as any).cook.story}
            </p>
          )}
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b-2 border-[var(--shc-border-brutal)] mb-4" data-testid="kitchen-tabs">
        {(
          [
            { id: 'plan' as const, label: 'Plans' },
            { id: 'about' as const, label: 'About' },
            { id: 'hours' as const, label: 'Hours' },
            { id: 'reviews' as const, label: 'Reviews' },
          ] as const
        ).map((t) => (
          <button
            key={t.id}
            type="button"
            data-testid={`kitchen-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`shrink-0 px-3 py-2.5 text-sm font-extrabold border-b-2 -mb-0.5 ${
              tab === t.id ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'plan' && (
        <>
          <SubscribeFunnelProgress current="plan" />
          <GourmeatSectionTitle title="Subscription plans" testID="kitchen-plans-header" />
          <p className="text-base font-extrabold mb-2">How many meals would you like each week?</p>
          <div className="flex gap-2 mb-3" data-testid="tiffin-meals-picker">
            {mealsOptions.map((n) => {
              const active = n === mealsPerWeek;
              const price = tiffinPricePerServing(n);
              const strike = tiffinPlanStrikethroughPrice(n, tiffinPricePerServing);
              const savings = tiffinPlanSavingsLabel(n, tiffinPricePerServing);
              const isBest = n === bestValueAt;
              return (
                <button
                  key={n}
                  type="button"
                  data-testid={`tiffin-meals-${n}`}
                  onClick={() => setMealsPerWeek(n)}
                  className={`relative flex-1 rounded-xl border-2 px-3 py-3 text-center ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-[var(--shc-border-brutal)] bg-card'
                  }`}
                >
                  {isBest ? (
                    <span
                      className="absolute -top-2 left-1/2 -translate-x-1/2 text-[9px] font-black uppercase bg-foreground text-background px-2 py-0.5 rounded-md"
                      data-testid={`tiffin-meals-best-${n}`}
                    >
                      Best value
                    </span>
                  ) : null}
                  <div className="font-black text-lg">{n}</div>
                  {strike ? (
                    <div className={`text-[10px] line-through opacity-70 ${active ? '' : 'text-muted-foreground'}`}>
                      {strike}/meal
                    </div>
                  ) : null}
                  <div className="text-[10px] font-bold opacity-90">S${price.toFixed(2)}/meal</div>
                  {savings ? (
                    <div className={`text-[10px] font-bold mt-1 ${active ? 'text-primary-foreground/90' : 'text-[var(--shc-success)]'}`}>
                      {savings}
                    </div>
                  ) : null}
                </button>
              );
            })}
          </div>
          <TiffinPlanFeatureList features={planFeatures} />
          <div className="mb-3" data-testid="kitchen-plan-rows">
            {planRows.map((row) => (
              <p key={row.meals} className="text-xs font-semibold text-muted-foreground">
                {row.label} · S${row.pricePerMeal.toFixed(2)}/meal
              </p>
            ))}
          </div>

          {/* Wireframe: plan duration */}
          <p className="text-base font-extrabold mb-2">How long would you like to subscribe?</p>
          <div className="flex gap-2 mb-3" data-testid="tiffin-plan-duration">
            {durationOpts.map((d) => {
              const active = d.id === planDuration;
              return (
                <button
                  key={d.id}
                  type="button"
                  data-testid={`tiffin-duration-${d.id}`}
                  onClick={() => setPlanDuration(d.id)}
                  className={`flex-1 rounded-xl border-2 px-2 py-3 text-center ${
                    active
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-[var(--shc-border-brutal)] bg-card'
                  }`}
                >
                  <div className="font-black text-sm">{d.label}</div>
                  <div className="text-[10px] font-bold opacity-90 mt-0.5">{d.hint}</div>
                </button>
              );
            })}
          </div>

          <SHCCard className="mb-4">
            <div className="flex justify-between items-center">
              <span className="font-bold text-sm">Weekly total</span>
              <span className="font-black text-lg tabular-nums">
                S${tiffinWeeklySubtotal(mealsPerWeek).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center mt-2">
              <span className="font-bold text-sm">Plan estimate · {selectedDuration.label}</span>
              <span className="font-black tabular-nums text-primary" data-testid="tiffin-duration-total">
                S${durationTotal.toFixed(2)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Collection from HDB kitchen · PayNow on first cycle · manage anytime
            </p>
          </SHCCard>

          <GourmeatSectionTitle
            title={dishes.length ? `Full menu · ${dishes.length}` : 'Full menu'}
            testID="kitchen-menu-header"
          />
          {dishes[0] ? (
            <div className="mb-3">
              <Link href={`/product/${encodeURIComponent(dishes[0].id)}`}>
                <SHCButton variant="outline" size="sm" testID="kitchen-order-once-btn">
                  Order once (try without plan)
                </SHCButton>
              </Link>
            </div>
          ) : null}
          {dishes.length === 0 ? (
            <p className="text-sm font-semibold text-muted-foreground mb-4" data-testid="kitchen-menu-empty">
              No tiffin dishes listed for this kitchen yet.
            </p>
          ) : (
            <VirtualRowList
              items={dishes}
              getKey={(d) => d.id}
              testID="kitchen-menu-list"
              rowHeight={88}
              className="mb-4"
              renderItem={(d) => (
                <div className="mb-2" data-testid={`kitchen-menu-wrap-${d.id}`}>
                  <button
                    type="button"
                    onClick={() => router.push(`/product/${encodeURIComponent(d.id)}`)}
                    className="flex w-full gap-3 items-center rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-2 text-left hover:bg-muted/40 transition-colors"
                    data-testid={`kitchen-menu-item-${d.id}`}
                  >
                    <Image
                      src={getDishImageUrl({ id: d.id, cuisine: d.cuisine, name: d.name })}
                      alt=""
                      width={48}
                      height={48}
                      className="rounded-lg object-cover shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-sm truncate">{d.name}</p>
                      <p className="text-xs text-muted-foreground">{d.cuisine || 'Home-cooked'}</p>
                    </div>
                    {kitchenDishPriceLabel(d) ? (
                      <SHCMetaBadge kind="price">{kitchenDishPriceLabel(d)}</SHCMetaBadge>
                    ) : null}
                  </button>
                  <RecipeStoryPreview
                    dish={d}
                    cookName={cookName}
                    expanded={expandedRecipeId === d.id}
                    onToggle={() => setExpandedRecipeId((cur) => (cur === d.id ? null : d.id))}
                    onOpenDish={() => router.push(`/product/${encodeURIComponent(d.id)}`)}
                    testID={`kitchen-recipe-${d.id}`}
                  />
                </div>
              )}
            />
          )}

          <p className="text-xs font-semibold text-primary mb-3" data-testid="kitchen-collection-days">
            Collection days:{' '}
            {((kitchen as any).collection_days || [])
              .map((d: number) => TIFFIN_DAY_LABELS[d])
              .join(', ')}
          </p>
          <p className="text-xs font-bold text-muted-foreground mb-4" data-testid="kitchen-subscriber-proof">
            👤 {kitchenSubscriberLabel((kitchen as any)?.subscriber_count)}
          </p>

          <GourmeatSectionTitle title="Why subscribe" testID="kitchen-trust-header" />
          <div className="mb-8">
            <SubscribeTrustList chips={trustChips} />
          </div>
        </>
      )}

      {tab === 'about' && (
        <div className="space-y-3 mb-8" data-testid="kitchen-tab-panel-about">
          <SHCCard data-testid="kitchen-chef-background">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              Chef&apos;s background
            </p>
            <p className="text-sm font-semibold mt-2 leading-relaxed">{chefBg}</p>
          </SHCCard>
          <ul className="space-y-2">
            {aboutPoints.map((p) => (
              <li key={p} className="text-sm font-semibold">
                ✓ {p}
              </li>
            ))}
          </ul>
          <KitchenTrustCertsList certs={trustCerts} />
          <SHCCard>
            <p className="text-xs font-bold text-muted-foreground">Location</p>
            <p className="font-bold mt-1">{(kitchen as any).cook?.area || 'Singapore'}</p>
          </SHCCard>
          <SHCCard>
            <p className="text-xs font-bold text-muted-foreground">About the cook</p>
            <p className="font-bold mt-1">{cookName}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {(kitchen as any).cook?.story || (kitchen as any).tagline || 'Weekly home-cooked tiffin.'}
            </p>
          </SHCCard>
        </div>
      )}

      {tab === 'hours' && (
        <div className="space-y-2 mb-8" data-testid="kitchen-tab-panel-hours">
          {hours.map((h) => (
            <div key={h.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] p-3">
              <p className="font-black text-sm">{h.label}</p>
              <p className="text-sm text-muted-foreground font-semibold">{h.window}</p>
            </div>
          ))}
        </div>
      )}

      {tab === 'reviews' && (
        <div className="space-y-3 mb-8" data-testid="kitchen-tab-panel-reviews">
          <div className="rounded-2xl border-2 border-[var(--shc-border-brutal)] p-4">
            <p className="text-3xl font-black">{ratingSum.rating.toFixed(1)} / 5</p>
            <p className="text-xs font-semibold text-muted-foreground mb-3">{ratingSum.reviewCount} reviews</p>
            {buckets.map((b) => (
              <div key={b.key} className="flex items-center gap-2 text-xs mb-1">
                <span className="w-20 text-muted-foreground font-semibold">{b.label}</span>
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round(b.share * 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
          {reviews.map((r) => (
            <SHCCard key={r.id}>
              <p className="font-black text-sm">{r.author}</p>
              <p className="text-primary font-bold text-sm">{'★'.repeat(r.rating)}</p>
              <p className="text-sm text-muted-foreground mt-1">{r.body}</p>
            </SHCCard>
          ))}
        </div>
      )}

      {/* Sticky CTA — always visible; above mobile tab bar (z-50) so taps register */}
      <div
        className="fixed bottom-0 left-0 right-0 z-[70] bg-card/95 border-t-2 border-[var(--shc-border-brutal)] shadow-[0_-4px_0_var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),8px)] md:static md:mt-4 md:border-0 md:shadow-none md:bg-transparent md:pb-0"
        data-testid="tiffin-subscribe-bar"
      >
        <div className="max-w-2xl mx-auto px-4 py-3 mb-14 md:mb-0">
          {subscribeError ? (
            <div className="mb-2">
              <SHCErrorBanner message={subscribeError} />
            </div>
          ) : null}
          {tab !== 'plan' ? (
            <button
              type="button"
              className="text-xs font-bold text-primary mb-2 w-full text-left"
              onClick={() => setTab('plan')}
            >
              Plan tab · choose meals/week first ↑
            </button>
          ) : null}
          <SHCButton
            className="w-full"
            size="lg"
            onClick={handleSubscribe}
            disabled={subscribeMut.isPending}
            testID="tiffin-subscribe-btn"
          >
            {subscribeMut.isPending
              ? 'Subscribing…'
              : user
                ? 'Subscribe & select meals'
                : 'Sign in to subscribe'}
          </SHCButton>
        </div>
      </div>
    </div>
  );
}
