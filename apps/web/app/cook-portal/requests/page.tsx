'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import {
  CUSTOM_REQUEST_COPY,
  parseCookQuoteDisplay,
  parseCustomRequestDisplay,
  getDishImageUrl,
  getOccasionImageUrl,
} from '@shc/utils';
import { useOpenRequests, useCookMyBids } from '../../../lib/useCookPortal';
import { GourmeatCookHeader, GourmeatEmptyState, SHCBadge } from '../../components/SHCWebComponents';

export default function CookCustomRequestsPage() {
  const { data: openReqs = [], isLoading } = useOpenRequests();
  const { data: myBids = [] } = useCookMyBids();
  const reqList = Array.isArray(openReqs) ? openReqs : [];

  const myBidByRequestId = useMemo(() => {
    const map = new Map<string, Record<string, unknown>>();
    for (const bid of myBids as Array<Record<string, unknown>>) {
      const requestId = String(bid.request_id || '');
      if (!requestId) continue;
      const status = String(bid.status || 'pending');
      if (status === 'pending' || status === 'accepted') map.set(requestId, bid);
    }
    return map;
  }, [myBids]);

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-custom-requests-screen">
      <Link href="/cook-portal/dashboard" className="text-sm font-black text-primary">
        ← Home
      </Link>
      <GourmeatCookHeader title={CUSTOM_REQUEST_COPY.cookBoardTitle} />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading requests…</p>
      ) : reqList.length === 0 ? (
        <GourmeatEmptyState
          title="No open requests"
          body="When customers post custom dish requests, any home cook can browse and send a bid."
        />
      ) : (
        reqList.map((r) => {
          const parsed = parseCustomRequestDisplay(r as Record<string, unknown>);
          const savedBidRaw = myBidByRequestId.get(String((r as { id?: string }).id || ''));
          const bidSent = !!savedBidRaw;
          const heroUri =
            (parsed.occasion && getOccasionImageUrl(parsed.occasion)) ||
            getDishImageUrl({ name: parsed.lines[0]?.name || parsed.summary });
          const firstLine = parsed.lines[0];
          const moreCount = parsed.lines.length - 1;
          return (
            <Link
              key={String((r as { id?: string }).id)}
              href={`/cook-portal/requests/${encodeURIComponent(String((r as { id?: string }).id))}`}
              className="block mb-3 rounded-2xl border-2 border-[var(--shc-border-brutal)] overflow-hidden bg-card shadow-[var(--shc-shadow-brutal-sm)]"
              data-testid={`cook-open-request-${(r as { id?: string }).id}`}
            >
              <div className="flex min-h-[96px]">
                <img src={heroUri} alt="" className="w-24 h-24 object-cover shrink-0" />
                <div className="flex-1 p-3">
                  <div className="flex justify-between gap-2">
                    <p className="font-black text-sm line-clamp-2">
                      {firstLine?.name || parsed.summary}
                      {moreCount > 0 ? ` +${moreCount} more` : ''}
                    </p>
                    <SHCBadge variant={bidSent ? 'warning' : 'warning'}>
                      {bidSent ? CUSTOM_REQUEST_COPY.bidSentLabel : 'Open'}
                    </SHCBadge>
                  </div>
                  <p className="text-xs font-bold text-primary mt-2">
                    {bidSent ? 'View your bid →' : 'Tap to quote dishes →'}
                  </p>
                </div>
              </div>
            </Link>
          );
        })
      )}
    </div>
  );
}
