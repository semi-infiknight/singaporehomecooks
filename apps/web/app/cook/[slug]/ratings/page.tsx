'use client';

/**
 * Standalone kitchen ratings — HomelyEats ratings/info wireframe depth.
 */
import React, { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import {
  getCookAvatarUrl,
  kitchenRatingSummary,
  kitchenRatingBuckets,
  kitchenDemoReviews,
  sortKitchenReviews,
  type KitchenReviewSort,
} from '@shc/utils';
import { useCook } from '../../../../lib/useProducts';
import { SHCButton, SHCCard, SHCSkeletonList } from '../../../components/SHCWebComponents';

const REVIEW_SORTS: { id: KitchenReviewSort; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'photos', label: 'With photos' },
];

export default function KitchenRatingsPage() {
  const params = useParams<{ slug: string }>();
  const slug = params?.slug as string;
  const router = useRouter();
  const { data: cook, isLoading } = useCook(slug);
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');

  const ratingSum = useMemo(() => kitchenRatingSummary(cook as any), [cook]);
  const buckets = useMemo(() => kitchenRatingBuckets(ratingSum.rating), [ratingSum.rating]);
  const reviews = useMemo(
    () => sortKitchenReviews(kitchenDemoReviews(String(cook?.id || slug || 'kitchen'), 10), reviewSort),
    [cook?.id, slug, reviewSort]
  );
  const avatar = getCookAvatarUrl(String(cook?.id || slug), cook?.display_name || 'Cook');

  if (isLoading) {
    return (
      <div className="max-w-xl mx-auto px-4 py-8">
        <SHCSkeletonList count={4} rowHeight={72} />
      </div>
    );
  }

  if (!cook) {
    return (
      <div className="max-w-xl mx-auto px-4 py-10">
        <p className="font-bold mb-3">Kitchen not found</p>
        <SHCButton onClick={() => router.push('/')}>Home</SHCButton>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto px-4 py-6 pb-28" data-testid="kitchen-ratings-screen">
      <div className="flex items-center gap-2 mb-4">
        <button
          type="button"
          onClick={() => router.push(`/cook/${slug}`)}
          className="text-2xl font-light leading-none px-1"
          aria-label="Back to kitchen"
        >
          ‹
        </button>
        <h1 className="flex-1 text-center text-lg font-extrabold -ml-6">Ratings & reviews</h1>
      </div>

      <div className="flex items-center gap-3 mb-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden border-2 border-[var(--shc-border-brutal)] shrink-0">
          <Image src={avatar} alt="" fill className="object-cover" sizes="48px" />
        </div>
        <div className="min-w-0">
          <p className="font-black truncate">{cook.display_name}</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {cook.area ? `${cook.area} · ` : ''}HDB collection kitchen
          </p>
        </div>
      </div>

      <SHCCard className="mb-4" data-testid="kitchen-rating-breakdown">
        <div className="flex items-end gap-4 mb-4">
          <div>
            <p className="text-5xl font-black tabular-nums" data-testid="ratings-score">
              {ratingSum.rating.toFixed(1)}
            </p>
            <p className="text-xs font-bold text-muted-foreground">out of 5.0</p>
            <p className="text-sm font-semibold text-muted-foreground mt-1">
              {ratingSum.reviewCount} reviews
            </p>
          </div>
          <div className="flex-1 space-y-1.5">
            {buckets.map((b) => (
              <div key={b.key} className="flex items-center gap-2 text-xs font-semibold">
                <span className="w-20 shrink-0 text-muted-foreground">{b.label}</span>
                <div className="flex-1 h-2.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary"
                    style={{ width: `${Math.round(b.share * 100)}%` }}
                  />
                </div>
                <span className="w-8 text-right tabular-nums text-muted-foreground">
                  {Math.round(b.share * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-xs font-semibold text-muted-foreground leading-relaxed">
          Community samples for this kitchen. Leave a verified review after you collect an order
          (PayNow confirm → collected).
        </p>
      </SHCCard>

      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide mb-3" data-testid="kitchen-review-sorts">
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

      <ul className="space-y-3 mb-6" data-testid="kitchen-reviews-list">
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
            <p className="text-primary font-bold text-sm mt-1">{'★'.repeat(r.rating)}</p>
            <p className="text-sm font-semibold mt-1 leading-relaxed">{r.body}</p>
            {r.hasPhoto ? (
              <span className="inline-block mt-2 text-[10px] font-black uppercase tracking-wide text-muted-foreground">
                Photo review
              </span>
            ) : null}
          </li>
        ))}
      </ul>

      <div className="flex flex-col gap-2">
        <SHCButton className="w-full" onClick={() => router.push(`/cook/${slug}`)} testID="ratings-order-cta">
          View menu & order
        </SHCButton>
        <Link
          href={`/tiffin/kitchen/${cook.id || slug}`}
          className="text-center text-sm font-bold text-primary"
        >
          Or subscribe to tiffin →
        </Link>
      </div>
    </div>
  );
}
