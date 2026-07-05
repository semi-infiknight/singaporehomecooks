'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useOrder,
  useChat,
  useOrderDisputes,
  useReview,
} from '../../../lib/useOrder';
import { useAuth } from '../../../lib/useAuth';
import { submitReview, submitOrderDispute } from '../../../lib/api-client';
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
import {
  getOrderStatusLabel,
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
  orderTrayActions,
} from '@shc/utils';
import {
  openOrderReviewTray,
  openOrderDisputeTray,
} from '@shc/ui/order-tray-opener-core';
import {
  SHCOrderReviewTrayContentWeb,
  SHCOrderDisputeTrayContentWeb,
} from '../../../lib/order-tray-content-web';
import type { SHCOrderStatus } from '@shc/types';

type OrderDisplay = Record<string, unknown> & {
  shc_status?: SHCOrderStatus | string;
  collection_date?: string;
  collection_slot?: string;
  total?: number | string;
  cook_name?: string;
  paynow_reference?: string;
};

type OrderReview = { rating: number; body?: string };
type OrderDispute = { status?: string; type?: string; notes?: string };

export default function TrackOrder() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const maestroE2e = process.env.NEXT_PUBLIC_MAESTRO_E2E === '1';
  const { data: orderRaw, isLoading, isFetching } = useOrder(id);
  const order = useMemo(
    () => resolveOrderForDisplay<OrderDisplay>(orderRaw as OrderDisplay | undefined, id, { maestroE2e }),
    [orderRaw, id, maestroE2e]
  );
  const { messages, send } = useChat(id);
  const { user } = useAuth();
  const { review: existingReviewRaw } = useReview(id);
  const existingReview = useMemo(
    () => resolveReviewForDisplay<OrderReview | null | undefined>(existingReviewRaw as OrderReview | null | undefined, id, { maestroE2e }),
    [existingReviewRaw, id, maestroE2e]
  );
  const { disputes: disputesRaw = [] } = useOrderDisputes(id);
  const disputes = useMemo(
    () => resolveDisputesForDisplay<OrderDispute>(disputesRaw as OrderDispute[], id, { maestroE2e }),
    [disputesRaw, id, maestroE2e]
  );
  const { openTray, dismiss } = useSHCTrayWeb();
  const [msg, setMsg] = useState('');

  const trayFns = useMemo(
    () => ({
      openTray,
      dismiss,
      renderSuccess: ({
        message,
        primaryLabel,
        testID,
        secondaryLabel,
        onSecondary,
      }: {
        message: string;
        primaryLabel: string;
        testID: string;
        secondaryLabel?: string;
        onSecondary?: () => void;
      }) => (
        <SHCTrayActionWeb
          message={message}
          primaryLabel={primaryLabel}
          onPrimary={dismiss}
          secondaryLabel={secondaryLabel}
          onSecondary={onSecondary}
          testID={testID}
        />
      ),
      renderError: ({ id, message }: { id: string; message: string }) => (
        <SHCTrayActionWeb
          message={message}
          primaryLabel="OK"
          onPrimary={dismiss}
          testID={id === 'dispute-error' ? 'dispute-error-tray' : 'review-error-tray'}
        />
      ),
    }),
    [dismiss, openTray]
  );

  const openReviewTray = useCallback(() => {
    if (!id) return;
    openOrderReviewTray(id, submitReview, trayFns, SHCOrderReviewTrayContentWeb);
  }, [id, trayFns]);

  const openDisputeTray = useCallback(() => {
    if (!id) return;
    openOrderDisputeTray(id, submitOrderDispute, trayFns, SHCOrderDisputeTrayContentWeb, {
      onMessageCook: () => {
        dismiss();
        document.getElementById('order-chat-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      },
    });
  }, [dismiss, id, trayFns]);

  if ((!maestroE2e && isLoading) || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label="Loading order…" />
      </div>
    );
  }

  const status = (order.shc_status || 'pending') as SHCOrderStatus;
  const { showReviewBtn: showReviewForm, showDisputeBtn: showDisputeForm } = orderTrayActions({
    order,
    review: existingReview,
    disputes,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="order-tracking-screen">
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

      <div id="order-chat-section">
        <SHCSectionTitle subtitle="Message your cook about dietary needs or arrival time">Chat</SHCSectionTitle>
      </div>
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
          <p className="text-[#FFB800] text-lg mt-2">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</p>
          {existingReview.body ? <p className="text-sm text-[#5C5144] mt-2">{existingReview.body}</p> : null}
        </SHCCard>
      )}

      {showReviewForm && (
        <SHCButton className="mt-6 w-full" onClick={openReviewTray} data-testid="open-review-tray-btn">
          Leave a review
        </SHCButton>
      )}

      {!showDisputeForm ? (
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