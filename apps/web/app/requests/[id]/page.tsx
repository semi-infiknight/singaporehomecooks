'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { CUSTOM_REQUEST_COPY, parseCustomRequestDisplay, shcGuestCountBadgeLabel, shcServingsBadgeLabel, getDishImageUrl } from '@shc/utils';
import { useCustomRequest, useBids, useAcceptBid } from '../../../lib/useOrder';
import {
  GourmeatScreenHeader,
  SHCBadge,
  SHCMetaBadge,
  SHCSkeletonList,
  SHCCard,
  CookQuoteCardWeb,
} from '../../components/SHCWebComponents';
import Image from 'next/image';

function extractOrderId(res: unknown): string | null {
  if (!res || typeof res !== 'object') return null;
  const r = res as Record<string, unknown>;
  if (typeof r.order_id === 'string' && r.order_id) return r.order_id;
  const order = r.order as Record<string, unknown> | undefined;
  if (order && typeof order.id === 'string') return order.id;
  return null;
}

export default function CustomRequestDetailPage() {
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const id = params?.id || '';
  const { data: raw, isLoading } = useCustomRequest(id);
  const { data: bids = [] } = useBids(id);
  const acceptQuote = useAcceptBid();
  const parsed = useMemo(() => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null), [raw]);
  const pendingQuotes = (bids as any[]).filter((b) => b.status === 'pending');

  const handleAccept = async (quoteId: string, acceptedLineIds: string[]) => {
    const res = await acceptQuote.mutateAsync({
      bidId: quoteId,
      accepted_line_ids: acceptedLineIds,
    });
    const orderId = extractOrderId(res);
    if (orderId) {
      router.push(`/orders/${orderId}?pay=1`);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-6 shc-tab-bar-pad" data-testid="custom-request-detail">
      <Link href="/orders" className="text-sm font-bold text-primary mb-3 inline-block">
        ← Orders
      </Link>
      <GourmeatScreenHeader title="Request detail" />

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
                <CookQuoteCardWeb
                  key={quote.id}
                  quote={quote}
                  cookName={quote.cook_name}
                  requestLines={parsed.lines}
                  accepting={acceptQuote.isPending && (acceptQuote.variables as { bidId?: string })?.bidId === quote.id}
                  onAccept={(acceptedLineIds) => handleAccept(quote.id, acceptedLineIds)}
                  testID={`quote-${quote.id}`}
                />
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
