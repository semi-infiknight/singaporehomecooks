'use client';

import React, { useCallback, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useOrder, useChat, useOrderDisputes, useReview } from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import {
  SHCCard,
  SHCButton,
  SHCSectionTitle,
  GourmeatScreenHeader,
  SHCLoading,
  OrderTimeline,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../components/SHCWebComponents';
import { getOrderStatusLabel, isActiveOrderStatus } from '@shc/utils';
import { canSubmitReview } from '@shc/business-rules';
import type { SHCOrderStatus } from '@shc/types';

function OrderReviewTrayContentWeb({
  orderId,
  onSuccess,
  onError,
}: {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const { submit: reviewMut } = useReview(orderId);

  return (
    <div data-testid="order-review-tray">
      <div className="flex gap-1 mt-3">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setRating(n)}
            className={`text-2xl ${n <= rating ? 'text-amber-500' : 'text-muted-foreground/40'}`}
            aria-label={`${n} stars`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        value={reviewBody}
        onChange={(e) => setReviewBody(e.target.value)}
        placeholder="Share your experience (optional)"
        className="shc-input w-full mt-3 min-h-[72px] py-2"
        data-testid="review-body-input"
      />
      <SHCButton
        className="mt-3"
        disabled={reviewMut.isPending}
        onClick={() =>
          reviewMut.mutate(
            { rating, body: reviewBody || undefined },
            {
              onSuccess: () => onSuccess(),
              onError: (e: Error) => onError(e?.message || 'Could not submit review'),
            }
          )
        }
        data-testid="submit-review-btn"
      >
        {reviewMut.isPending ? 'Submitting…' : 'Submit review'}
      </SHCButton>
    </div>
  );
}

function OrderDisputeTrayContentWeb({
  orderId,
  onSuccess,
  onError,
}: {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [disputeNotes, setDisputeNotes] = useState('');
  const { submit: disputeMut } = useOrderDisputes(orderId);

  return (
    <div data-testid="order-dispute-tray">
      <p className="text-sm text-muted-foreground mt-1">
        Use this if food quality, collection, or safety needs ops review.
      </p>
      <textarea
        value={disputeNotes}
        onChange={(e) => setDisputeNotes(e.target.value)}
        placeholder="Tell ops what happened. Include timing, dish condition, or collection issue."
        className="shc-input w-full mt-3 min-h-[88px] py-2"
        data-testid="dispute-notes-input"
      />
      <SHCButton
        className="mt-3"
        variant="outline"
        disabled={disputeMut.isPending || disputeNotes.trim().length < 5}
        onClick={() =>
          disputeMut.mutate(
            { type: 'other', notes: disputeNotes.trim() },
            {
              onSuccess: () => onSuccess(),
              onError: (e: Error) => onError(e?.message || 'Please try again'),
            }
          )
        }
        data-testid="submit-dispute-btn"
      >
        {disputeMut.isPending ? 'Reporting…' : 'Report issue'}
      </SHCButton>
    </div>
  );
}

export default function TrackOrder() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: order, isLoading, isFetching } = useOrder(id);
  const { messages, send } = useChat(id);
  const { user } = useAuth();
  const { review: existingReview } = useReview(id);
  const { disputes } = useOrderDisputes(id);
  const { openTray, dismiss } = useSHCTrayWeb();
  const [msg, setMsg] = useState('');

  const openReviewTray = useCallback(() => {
    if (!id) return;
    openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
      <OrderReviewTrayContentWeb
        orderId={id}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'review-success', title: 'Thank you', height: 'compact' },
            <SHCTrayActionWeb
              message="Your review helps other families find trusted home cooks."
              primaryLabel="Done"
              onPrimary={dismiss}
              testID="review-success-tray"
            />
          );
        }}
        onError={(message) => {
          openTray(
            { id: 'review-error', title: 'Review failed', height: 'compact' },
            <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="review-error-tray" />
          );
        }}
      />
    ));
  }, [dismiss, id, openTray]);

  const openDisputeTray = useCallback(() => {
    if (!id) return;
    openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
      <OrderDisputeTrayContentWeb
        orderId={id}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'dispute-success', title: 'Issue reported', height: 'compact' },
            <SHCTrayActionWeb
              message="Ops will review this order and follow up with you."
              primaryLabel="Done"
              onPrimary={dismiss}
              testID="dispute-success-tray"
            />
          );
        }}
        onError={(message) => {
          openTray(
            { id: 'dispute-error', title: 'Could not report issue', height: 'compact' },
            <SHCTrayActionWeb message={message} primaryLabel="OK" onPrimary={dismiss} testID="dispute-error-tray" />
          );
        }}
      />
    ));
  }, [dismiss, id, openTray]);

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label="Loading order…" />
      </div>
    );
  }

  const status = (order.shc_status || 'pending') as SHCOrderStatus;
  const showReviewForm = canSubmitReview(status) && !existingReview;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <GourmeatScreenHeader
        title={getOrderStatusLabel(status)}
        subtitle={`Order ${id}`}
        backHref="/orders"
        backLabel="← All orders"
      />

      {isActiveOrderStatus(status) && isFetching && (
        <p className="text-[11px] font-bold text-[var(--shc-success)] mb-3">Refreshing status…</p>
      )}

      <SHCCard className="mb-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border">
        <OrderTimeline status={status} live={isActiveOrderStatus(status)} />
      </SHCCard>

      <SHCCard className="mb-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-[#5C5144]">Collection</span>
            <p className="font-medium mt-0.5">
              {order.collection_date} · {order.collection_slot}
            </p>
          </div>
          <div>
            <span className="text-[#5C5144]">Total</span>
            <p className="font-medium mt-0.5 tabular-nums">S${order.total}</p>
          </div>
          <div>
            <span className="text-[#5C5144]">Cook</span>
            <p className="font-medium mt-0.5">{order.cook_name}</p>
          </div>
          {order.paynow_reference && (
            <div>
              <span className="text-[#5C5144]">PayNow ref</span>
              <p className="font-medium mt-0.5 font-mono text-xs">{order.paynow_reference}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-[#5C5144] mt-4 pt-4 border-t border-[#E8D5B7]/60">
          Your collection address will be shared about 2 hours before your slot, after payment is confirmed.
        </p>
      </SHCCard>

      <SHCSectionTitle subtitle="Message your cook about dietary needs or arrival time">Chat</SHCSectionTitle>
      <div className="border border-[#E8D5B7] bg-white rounded-xl overflow-hidden">
        <div className="h-56 overflow-y-auto p-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <p className="text-[#5C5144] text-center py-8">No messages yet. Say hello to your cook.</p>
          )}
          {messages.map((m: { sender_actor?: string; body?: string }, i: number) => (
            <div
              key={i}
              className={`max-w-[85%] p-3 rounded-lg ${
                m.sender_actor === 'cook'
                  ? 'bg-secondary text-foreground mr-auto'
                  : 'bg-primary text-primary-foreground ml-auto'
              }`}
            >
              {m.body}
            </div>
          ))}
        </div>
        <div className="flex gap-2 p-3 border-t border-[#E8D5B7] bg-[#FAF7F2]">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="shc-input flex-1 py-2"
            placeholder="Type a message…"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && msg.trim()) {
                send({ body: msg, from: 'customer' });
                setMsg('');
              }
            }}
          />
          <SHCButton
            size="sm"
            onClick={() => {
              if (msg.trim()) {
                send({ body: msg, from: 'customer' });
                setMsg('');
              }
            }}
          >
            Send
          </SHCButton>
        </div>
      </div>

      {existingReview && (
        <SHCCard className="mt-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border" data-testid="order-review-submitted">
          <SHCSectionTitle>Your review</SHCSectionTitle>
          <p className="text-amber-500 text-lg mt-2">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</p>
          {existingReview.body ? <p className="text-sm text-[#5C5144] mt-2">{existingReview.body}</p> : null}
        </SHCCard>
      )}

      {showReviewForm && (
        <SHCButton className="mt-6 w-full" onClick={openReviewTray} data-testid="open-review-tray-btn">
          Leave a review
        </SHCButton>
      )}

      {disputes.length > 0 ? (
        <SHCCard className="mt-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border" data-testid="order-dispute-submitted">
          <SHCSectionTitle>Issue reported</SHCSectionTitle>
          <p className="mt-1 text-xs font-semibold text-[#5C5144]">
            {disputes[0].status || 'open'} · {disputes[0].type || 'other'}
          </p>
          {disputes[0].notes && <p className="mt-2 text-sm text-[#5C5144]">{disputes[0].notes}</p>}
        </SHCCard>
      ) : (
        <SHCButton className="mt-6 w-full" variant="outline" onClick={openDisputeTray} data-testid="open-dispute-tray-btn">
          Report an issue
        </SHCButton>
      )}
    </div>
  );
}