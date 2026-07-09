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
} from '@shc/utils';
import { useAuth } from '../../../../lib/useAuth';
import {
  useTiffinKitchen,
  useSubscribeTiffin,
  tiffinPricePerServing,
  tiffinWeeklySubtotal,
  TIFFIN_DAY_LABELS,
} from '../../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCBadge, GourmeatSectionTitle } from '../../../components/SHCWebComponents';

export default function TiffinKitchenPage() {
  const params = useParams();
  const cookId = String(params?.cookId || '');
  const router = useRouter();
  const { user } = useAuth();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId);
  const subscribeMut = useSubscribeTiffin();
  const mealsOptions: number[] = (kitchen as any)?.meals_per_week_options || [2, 3, 4];
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(3);

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
  };
  const open = kitchenOpenStatus(cookMeta);
  const tags = kitchenTagList(cookMeta);
  const planRows = useMemo(
    () => kitchenTiffinPlanRows(mealsOptions, tiffinPricePerServing),
    [mealsOptions]
  );
  const avatar = getCookAvatarUrl(cookId, cookName);

  const handleSubscribe = async () => {
    if (!cookId) return;
    if (!user) {
      router.push(`/login?returnTo=/tiffin/kitchen/${cookId}`);
      return;
    }
    await subscribeMut.mutateAsync({
      cookId,
      mealsPerWeek: mealsPerWeek as 2 | 3 | 4,
    });
    router.replace('/tiffin/confirm');
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center text-muted-foreground font-semibold">
        Loading kitchen…
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
    <div className="max-w-2xl mx-auto px-4 py-4 pb-32" data-testid="tiffin-kitchen-screen">
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
              ★ {Number(cookMeta.rating).toFixed(1)}
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
                <SHCBadge key={t} variant="heritage">
                  {t}
                </SHCBadge>
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

      <GourmeatSectionTitle title="Subscription plans" testID="kitchen-plans-header" />
      <p className="text-xs font-semibold text-muted-foreground mb-2">How many meals each week?</p>
      <div className="flex gap-2 mb-3" data-testid="tiffin-meals-picker">
        {mealsOptions.map((n) => {
          const active = n === mealsPerWeek;
          return (
            <button
              key={n}
              type="button"
              data-testid={`tiffin-meals-${n}`}
              onClick={() => setMealsPerWeek(n)}
              className={`flex-1 rounded-xl border-2 px-3 py-3 text-center ${
                active
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-[var(--shc-border-brutal)] bg-card'
              }`}
            >
              <div className="font-black text-lg">{n}</div>
              <div className="text-[10px] font-bold opacity-90">S${tiffinPricePerServing(n)}/meal</div>
            </button>
          );
        })}
      </div>
      <div className="mb-3" data-testid="kitchen-plan-rows">
        {planRows.map((row) => (
          <p key={row.meals} className="text-xs font-semibold text-muted-foreground">
            {row.label} · S${row.pricePerMeal.toFixed(2)}/meal
          </p>
        ))}
      </div>

      <SHCCard className="mb-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">Weekly total</span>
          <span className="font-black text-lg tabular-nums">
            S${tiffinWeeklySubtotal(mealsPerWeek).toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Collection from HDB kitchen · PayNow on first cycle</p>
      </SHCCard>

      <GourmeatSectionTitle
        title={dishes.length ? `Full menu · ${dishes.length}` : 'Full menu'}
        testID="kitchen-menu-header"
      />
      {dishes.length === 0 ? (
        <p className="text-sm font-semibold text-muted-foreground mb-4" data-testid="kitchen-menu-empty">
          No tiffin dishes listed for this kitchen yet.
        </p>
      ) : (
        <ul className="space-y-2 mb-4" data-testid="kitchen-menu-list">
          {dishes.map((d) => (
            <li
              key={d.id}
              className="flex gap-3 items-center rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-2"
            >
              <Image
                src={getDishImageUrl({ id: d.id, cuisine: d.cuisine, name: d.name })}
                alt=""
                width={48}
                height={48}
                className="rounded-lg object-cover"
              />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm truncate">{d.name}</p>
                <p className="text-xs text-muted-foreground">{d.cuisine || 'Home-cooked'}</p>
              </div>
              {kitchenDishPriceLabel(d) ? (
                <SHCBadge variant="heritage">{kitchenDishPriceLabel(d)}</SHCBadge>
              ) : null}
            </li>
          ))}
        </ul>
      )}

      <p className="text-xs font-semibold text-primary mb-6" data-testid="kitchen-collection-days">
        Collection days:{' '}
        {((kitchen as any).collection_days || [])
          .map((d: number) => TIFFIN_DAY_LABELS[d])
          .join(', ')}
      </p>

      <div className="fixed bottom-0 left-0 right-0 md:static md:mt-4 p-4 md:p-0 bg-card/95 md:bg-transparent border-t md:border-0 border-[var(--shc-border-brutal)] pb-[max(env(safe-area-inset-bottom),16px)] md:pb-0">
        <div className="max-w-2xl mx-auto">
          <SHCButton
            className="w-full"
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
