'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { getCookAvatarUrl } from '@shc/utils';
import { useAuth } from '../../lib/useAuth';
import { useTiffinKitchens, useTiffinSubscription, TIFFIN_DAY_LABELS } from '../../lib/useTiffin';
import { SHCButton, SHCCard, SHCPageHeader, SHCEmptyState } from '../components/SHCWebComponents';

export default function TiffinBrowsePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { data: kitchens = [], isLoading } = useTiffinKitchens();
  const { data: subData } = useTiffinSubscription();
  const sub = (subData as { subscription?: { cook_id?: string } } | undefined)?.subscription;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 pb-28" data-testid="tiffin-browse-screen">
      <SHCPageHeader
        title="Tiffin subscription"
        subtitle="One kitchen, your weekly rhythm — home-cooked meals on repeat."
      />

      <div className="rounded-xl border-2 border-[var(--shc-border-brutal)] bg-[var(--shc-bento-peach)] p-4 mb-4 shadow-[var(--shc-shadow-brutal-sm)]">
        <p className="font-black text-foreground text-lg">Weekly Tiffin</p>
        <p className="text-sm text-muted-foreground font-semibold mt-1">
          Subscribe to home-cooked meals from one kitchen — pick 2, 3, or 4 days a week.
        </p>
      </div>

      {sub ? (
        <div data-testid="tiffin-active-banner">
          <SHCCard className="mb-4">
            <p className="font-bold text-sm mb-3">You have an active tiffin plan</p>
            <SHCButton size="sm" onClick={() => router.push('/tiffin/manage')} testID="tiffin-go-manage-btn">
              Manage subscription
            </SHCButton>
          </SHCCard>
        </div>
      ) : null}

      {isLoading ? (
        <p className="text-center text-muted-foreground py-10 font-semibold">Loading kitchens…</p>
      ) : kitchens.length === 0 ? (
        <SHCEmptyState
          title="No tiffin kitchens yet"
          description="Check back soon — home cooks are enabling weekly plans."
        />
      ) : (
        <ul className="space-y-3">
          {(kitchens as Array<{
            cook_id: string;
            tagline?: string;
            meals_per_week_options?: number[];
            dishes?: unknown[];
            cook?: { display_name?: string; area?: string };
          }>).map((k) => {
            const name = k.cook?.display_name || 'Home kitchen';
            const avatar = getCookAvatarUrl(k.cook_id, name);
            return (
              <li key={k.cook_id}>
                <button
                  type="button"
                  data-testid={`tiffin-kitchen-${k.cook_id}`}
                  className="w-full text-left rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card p-3 shadow-[var(--shc-shadow-brutal-sm)] flex gap-3 items-center hover:opacity-95 transition-opacity"
                  onClick={() => {
                    if (!user) {
                      router.push(`/login?returnTo=/tiffin/kitchen/${k.cook_id}`);
                      return;
                    }
                    router.push(`/tiffin/kitchen/${k.cook_id}`);
                  }}
                >
                  <Image src={avatar} alt="" width={56} height={56} className="rounded-full border-2 border-[var(--shc-border-brutal)]" />
                  <div className="flex-1 min-w-0">
                    <p className="font-black text-foreground truncate">{name}</p>
                    {k.cook?.area ? <p className="text-xs text-muted-foreground font-semibold">{k.cook.area}</p> : null}
                    <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                      {k.tagline || 'Weekly home-cooked meals'}
                    </p>
                    <p className="text-xs font-bold text-primary mt-1">
                      {(k.meals_per_week_options || [2, 3, 4]).join(' · ')} meals/wk
                      {k.dishes ? ` · ${k.dishes.length} dishes` : ''}
                    </p>
                  </div>
                  <span className="text-2xl text-muted-foreground" aria-hidden>
                    ›
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="text-center text-xs text-muted-foreground mt-6">
        Collection days use cook HDB slots · {TIFFIN_DAY_LABELS.slice(1, 6).join(', ')} typical
      </p>
      <div className="mt-4 text-center">
        <Link href="/" className="text-sm font-bold text-primary underline">
          Back to discover
        </Link>
      </div>
    </div>
  );
}
