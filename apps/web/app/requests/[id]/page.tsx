'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  CUSTOM_REQUEST_COPY,
  formatQuoteTotal,
  parseCustomRequestDisplay,
  shcGuestCountBadgeLabel,
  shcServingsBadgeLabel,
  getDishImageUrl,
} from '@shc/utils';
import { useCustomRequest, useBids, useAcceptBid } from '../../../lib/useOrder';
import {
  GourmeatScreenHeader,
  SHCBadge,
  SHCMetaBadge,
  SHCButton,
  SHCSkeletonList,
  SHCCard,
} from '../../components/SHCWebComponents';
import Image from 'next/image';

export default function CustomRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const { data: raw, isLoading } = useCustomRequest(id);
  const { data: bids = [] } = useBids(id);
  const acceptQuote = useAcceptBid();
  const parsed = useMemo(() => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null), [raw]);
  const pendingQuotes = (bids as any[]).filter((b) => b.status === 'pending');

  return (
    <div className="max-w-lg mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="custom-request-detail">
      <Link href="/orders" className="text-sm font-bold text-primary mb-3 inline-block">
        ← Orders
      </Link>
      <GourmeatScreenHeader title="Request detail" subtitle={CUSTOM_REQUEST_COPY.customerSectionHint} />

      {isLoading || !parsed ? (
        <SHCSkeletonList count={4} rowHeight={72} />
      ) : (
        <>
          <div className="relative w-full h-44 rounded-2xl overflow-hidden mb-4 border-2 border-[var(--shc-border-brutal)]">
            <Image
              src={getDishImageUrl({ name: parsed.lines[0]?.name || parsed.summary })}
              alt=""
              fill
              className="object-cover"
              sizes="400px"
            />
          </div>
          <SHCBadge variant={parsed.status === 'matched' ? 'success' : 'warning'}>
            {parsed.status === 'open' ? 'Waiting for quotes' : parsed.status}
          </SHCBadge>
          <div className="flex flex-wrap gap-2 mt-3 mb-4">
            {parsed.guest_count ? <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge> : null}
            {parsed.budget_cents != null ? (
              <SHCMetaBadge kind="price">Budget {formatQuoteTotal(parsed.budget_cents)}</SHCMetaBadge>
            ) : null}
            {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
          </div>

          <p className="font-extrabold mb-2">Dishes requested</p>
          <ul className="space-y-2 mb-6">
            {parsed.lines.map((line) => (
              <li key={line.id} className="flex gap-3 items-center rounded-xl border-2 border-[var(--shc-border-brutal)] p-3 bg-card">
                <div className="relative w-14 h-14 shrink-0 rounded-xl overflow-hidden">
                  <Image src={getDishImageUrl({ name: line.name })} alt="" fill className="object-cover" sizes="56px" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{line.name}</p>
                  <p className="text-xs text-muted-foreground font-semibold">{shcServingsBadgeLabel(line.servings)}</p>
                </div>
              </li>
            ))}
          </ul>

          <p className="font-extrabold mb-2">
            Cook {CUSTOM_REQUEST_COPY.quoteNounPlural} ({pendingQuotes.length})
          </p>
          {pendingQuotes.length === 0 ? (
            <SHCCard>
              <p className="text-sm text-muted-foreground font-semibold">{CUSTOM_REQUEST_COPY.noQuotesYet}</p>
            </SHCCard>
          ) : (
            <ul className="space-y-3">
              {pendingQuotes.map((quote: any) => (
                <li key={quote.id} className="rounded-xl border-2 border-[var(--shc-border-brutal)] p-4 bg-card">
                  <div className="flex justify-between gap-3">
                    <div>
                      <p className="font-black">{quote.cook_name || 'Home cook'}</p>
                      {quote.message ? <p className="text-sm text-muted-foreground mt-1">{quote.message}</p> : null}
                    </div>
                    <p className="font-black text-primary tabular-nums">{formatQuoteTotal(quote.price_cents)}</p>
                  </div>
                  <SHCButton
                    className="mt-3 w-full"
                    onClick={() => acceptQuote.mutate(quote.id)}
                    disabled={acceptQuote.isPending}
                    data-testid={`accept-quote-${quote.id}`}
                  >
                    {acceptQuote.isPending ? 'Accepting…' : CUSTOM_REQUEST_COPY.acceptQuote}
                  </SHCButton>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
