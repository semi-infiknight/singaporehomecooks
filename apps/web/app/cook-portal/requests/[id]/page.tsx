'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  CUSTOM_REQUEST_COPY,
  customRequestStatusLabel,
  getDishImageUrl,
  getOccasionImageUrl,
  parseCookQuoteDisplay,
  parseCustomRequestDisplay,
  shcGuestCountBadgeLabel,
} from '@shc/utils';
import { useCookRequestQuoteDraft } from '../../../../lib/cook-request-quote-draft';
import { useCookCustomRequest, useCookMyBids, useCreateBid } from '../../../../lib/useCookPortal';
import {
  CookQuoteBuilderWeb,
  CookRequestDishRowWeb,
  CookSavedQuoteWeb,
  GourmeatCookHeader,
  SHCBadge,
  SHCMetaBadge,
  SHCSkeletonOrderList,
} from '../../../components/SHCWebComponents';

export default function CookCustomRequestDetailPage() {
  const params = useParams<{ id: string }>();
  const requestId = String(params.id || '');
  const { data: raw, isLoading } = useCookCustomRequest(requestId);
  const { data: myBids = [] } = useCookMyBids();
  const createBid = useCreateBid();
  const { lines, message, setMessage } = useCookRequestQuoteDraft();
  const [editing, setEditing] = useState(false);
  const [bidError, setBidError] = useState('');

  const parsed = useMemo(
    () => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null),
    [raw]
  );

  const savedBidRaw = useMemo(() => {
    return (myBids as Array<Record<string, unknown>>).find(
      (bid) =>
        String(bid.request_id || '') === requestId &&
        ['pending', 'accepted'].includes(String(bid.status || 'pending'))
    );
  }, [myBids, requestId]);

  const savedBid = useMemo(() => {
    if (!savedBidRaw || !parsed) return null;
    return parseCookQuoteDisplay(savedBidRaw, parsed.lines);
  }, [savedBidRaw, parsed]);

  const showBuilder = !savedBid || editing;
  const heroUri =
    parsed &&
    ((parsed.occasion && getOccasionImageUrl(parsed.occasion)) ||
      getDishImageUrl({ name: parsed.lines[0]?.name || parsed.summary }));

  const handleQuote = async (payload: {
    line_items: typeof lines;
    message?: string;
    price_cents: number;
  }) => {
    setBidError('');
    try {
      await createBid.mutateAsync({
        requestId,
        priceCents: payload.price_cents,
        message: payload.message,
        lineItems: payload.line_items.map((l) => ({
          request_line_id: l.request_line_id,
          included: l.included,
          servings: l.servings,
          price_cents: l.price_cents,
        })),
      });
      setEditing(false);
    } catch (e) {
      setBidError((e as Error).message || 'Could not send bid. Please try again.');
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-custom-request-detail">
      <Link href="/cook-portal/requests" className="text-sm font-black text-primary">
        ← Requests
      </Link>
      <GourmeatCookHeader title="Request detail" />

      {isLoading || !parsed || !raw ? (
        <SHCSkeletonOrderList count={4} variant="row" />
      ) : (
        <>
          {heroUri ? (
            <img
              src={heroUri}
              alt=""
              className="w-full h-44 object-cover rounded-2xl border-2 border-[var(--shc-border-brutal)] mt-3"
              data-testid="request-detail-hero"
            />
          ) : null}
          <div className="mt-3 flex flex-wrap gap-2 items-center">
            <SHCBadge variant={parsed.status === 'matched' ? 'success' : 'warning'}>
              {customRequestStatusLabel(parsed.status)}
            </SHCBadge>
            {parsed.guest_count ? (
              <SHCMetaBadge kind="party_size">{shcGuestCountBadgeLabel(parsed.guest_count)}</SHCMetaBadge>
            ) : null}
            {parsed.date ? <SHCMetaBadge kind="date">{parsed.date}</SHCMetaBadge> : null}
          </div>

          <p className="text-sm font-extrabold text-foreground mt-6 mb-3">Dishes to quote</p>
          {parsed.lines.map((line) => {
            const qLine = lines.find((l) => l.request_line_id === line.id);
            return (
              <CookRequestDishRowWeb
                key={line.id}
                line={line}
                quoteLine={qLine}
                href={`/cook-portal/requests/${encodeURIComponent(requestId)}/line/${encodeURIComponent(line.id)}`}
                testID={`cook-request-dish-${line.id}`}
              />
            );
          })}

          {bidError ? (
            <p className="text-sm font-bold text-red-600 mt-3" data-testid="custom-request-quote-error">
              {bidError}
            </p>
          ) : null}

          {showBuilder ? (
            <div className="mt-4" data-testid={`quote-builder-section-${requestId}`}>
              <CookQuoteBuilderWeb
                request={raw as Record<string, unknown>}
                lines={lines}
                message={message}
                onMessageChange={setMessage}
                hideDishRows
                busy={createBid.isPending}
                initialQuote={savedBidRaw}
                submitLabel={savedBid ? CUSTOM_REQUEST_COPY.updateQuote : CUSTOM_REQUEST_COPY.sendQuote}
                onSubmit={handleQuote}
                testID={`quote-builder-${requestId}`}
              />
            </div>
          ) : savedBid ? (
            <CookSavedQuoteWeb
              quote={savedBid}
              requestLines={parsed.lines}
              onEdit={() => setEditing(true)}
              testID={`cook-saved-quote-${requestId}`}
            />
          ) : null}
        </>
      )}
    </div>
  );
}
