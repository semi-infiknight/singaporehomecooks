'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getCookAvatarUrl, getDishImageUrl } from '@shc/utils';
import { useAuth } from '../../../../lib/useAuth';
import {
  useTiffinKitchen,
  useSubscribeTiffin,
  tiffinPricePerServing,
  tiffinWeeklySubtotal,
  TIFFIN_DAY_LABELS,
} from '../../../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCBadge } from '../../../components/SHCWebComponents';

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

  useEffect(() => {
    if (!user) {
      router.replace(`/login?returnTo=/tiffin/kitchen/${cookId}`);
    }
  }, [user, cookId, router]);

  const dishes = ((kitchen as any)?.dishes || []) as Array<{
    id: string;
    name: string;
    price?: number;
    cuisine?: string;
  }>;

  const handleSubscribe = async () => {
    if (!cookId) return;
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
        <SHCPageHeader title="Kitchen unavailable" subtitle="This kitchen is not offering tiffin right now." />
        <SHCButton onClick={() => router.push('/tiffin')}>Back to tiffin</SHCButton>
      </div>
    );
  }

  const cookName = (kitchen as any).cook?.display_name || 'Kitchen';
  const avatar = getCookAvatarUrl(cookId, cookName);

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-32" data-testid="tiffin-kitchen-screen">
      <SHCPageHeader title="Subscribe" subtitle="STEP 1 · Choose your weekly plan" />

      <div className="rounded-xl overflow-hidden border-2 border-[var(--shc-border-brutal)] mb-4 shadow-[var(--shc-shadow-brutal-sm)]">
        <div className="relative h-36 bg-[var(--shc-bento-mint)]">
          <Image src={avatar} alt="" fill className="object-cover opacity-90" sizes="640px" />
        </div>
        <div className="p-4 bg-card">
          <p className="font-black text-xl">{cookName}</p>
          <p className="text-sm text-muted-foreground font-semibold mt-1">
            {(kitchen as any).tagline ||
              `${(kitchen as any).cook?.area || 'Singapore'} · home-cooked tiffin`}
          </p>
        </div>
      </div>

      <p className="font-bold text-sm mb-2">How many meals each week?</p>
      <div className="flex gap-2 mb-4" data-testid="tiffin-meals-picker">
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

      <SHCCard className="mb-4">
        <div className="flex justify-between items-center">
          <span className="font-bold text-sm">Weekly total</span>
          <span className="font-black text-lg tabular-nums">S${tiffinWeeklySubtotal(mealsPerWeek).toFixed(2)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">Collection from HDB kitchen · PayNow on first cycle</p>
      </SHCCard>

      <p className="font-extrabold text-sm mb-2">Full menu</p>
      <ul className="space-y-2 mb-4">
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
            {d.price != null ? (
              <SHCBadge variant="heritage">S${(d.price / 100).toFixed(0)}</SHCBadge>
            ) : null}
          </li>
        ))}
      </ul>

      <p className="text-xs font-semibold text-primary mb-6">
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
            {subscribeMut.isPending ? 'Subscribing…' : 'Subscribe & select meals'}
          </SHCButton>
        </div>
      </div>
    </div>
  );
}
