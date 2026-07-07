'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  useOrder,
  useChat,
  useOrderDisputes,
  useReview,
} from '../../../lib/useOrder';
import { submitReview, submitOrderDispute } from '../../../lib/api-client';
import { OrderTrackingTraySectionWeb } from '../../../lib/order-tray-section-web';
import {
  SHCCard,
  SHCButton,
  SHCSectionTitle,
  GourmeatScreenHeader,
  SHCLoading,
  OrderTimeline,
} from '../../components/SHCWebComponents';
import {
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
} from '@shc/utils';
import { useShcI18n, getLocalizedOrderStatus, formatOrderRef, getLocalizedOrderTimeline, getOrderTrayLabels } from '@shc/i18n';
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
  const { t, locale } = useShcI18n();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const maestroE2e = process.env.NEXT_PUBLIC_MAESTRO_E2E === '1';
  const { data: orderRaw, isLoading, isFetching } = useOrder(id);
  const order = useMemo(
    () => resolveOrderForDisplay<OrderDisplay>(orderRaw as OrderDisplay | undefined, id, { maestroE2e }),
    [orderRaw, id, maestroE2e]
  );
  const { messages, send } = useChat(id);
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
  const [msg, setMsg] = useState('');

  if ((!maestroE2e && isLoading) || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-10">
        <SHCLoading label={t('orders.detail.loading')} />
      </div>
    );
  }

  const status = (order.shc_status || 'pending') as SHCOrderStatus;
  const timelineSteps = getLocalizedOrderTimeline(locale);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="order-tracking-screen">
      <GourmeatScreenHeader
        title={getLocalizedOrderStatus(locale, status)}
        subtitle={formatOrderRef(locale, id)}
        backHref="/orders"
        backLabel={t('orders.detail.back')}
      />

      {isActiveOrderStatus(status) && isFetching && (
        <p className="text-[11px] font-bold text-[var(--shc-success)] mb-3">{t('orders.detail.refreshing')}</p>
      )}

      <SHCCard className="mb-6" variant="customer">
        <OrderTimeline
          status={status}
          live={isActiveOrderStatus(status)}
          steps={timelineSteps}
          liveLabel={t('orders.timeline.live')}
          cancelledLabel={getLocalizedOrderStatus(locale, status)}
        />
      </SHCCard>

      <SHCCard className="mb-6" variant="customer">
        <div className="grid sm:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">{t('orders.detail.collection')}</span>
            <p className="font-medium mt-0.5">
              {order.collection_date} · {order.collection_slot}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('orders.detail.total')}</span>
            <p className="font-medium mt-0.5 tabular-nums">S${order.total}</p>
          </div>
          <div>
            <span className="text-muted-foreground">{t('orders.detail.cook')}</span>
            <p className="font-medium mt-0.5">{order.cook_name}</p>
          </div>
          {order.paynow_reference && (
            <div>
              <span className="text-muted-foreground">{t('orders.detail.paynow_ref')}</span>
              <p className="font-medium mt-0.5 font-mono text-xs">{order.paynow_reference}</p>
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground mt-4 pt-4 border-t border-border/60">{t('orders.detail.address_hint')}</p>
      </SHCCard>

      <div id="order-chat-section">
        <SHCSectionTitle subtitle={t('orders.detail.chat_subtitle')}>{t('orders.detail.chat_title')}</SHCSectionTitle>
      </div>
      <div className="border border-border bg-card rounded-xl overflow-hidden shadow-[var(--shc-shadow-card)]">
        <div className="h-56 overflow-y-auto p-4 space-y-3 text-sm">
          {messages.length === 0 && (
            <p className="text-muted-foreground text-center py-8">{t('orders.detail.no_messages')}</p>
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
        <div className="flex gap-2 p-3 border-t border-border bg-secondary">
          <input
            value={msg}
            onChange={(e) => setMsg(e.target.value)}
            className="shc-input flex-1 py-2"
            placeholder={t('orders.detail.message_placeholder')}
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
            {t('orders.detail.send')}
          </SHCButton>
        </div>
      </div>

      {existingReview && (
        <SHCCard className="mt-6" variant="customer" data-testid="order-review-submitted">
          <SHCSectionTitle>{t('orders.detail.your_review')}</SHCSectionTitle>
          <p className="text-[var(--shc-accent)] text-lg mt-2">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</p>
          {existingReview.body ? <p className="text-sm text-muted-foreground mt-2">{existingReview.body}</p> : null}
        </SHCCard>
      )}

      <OrderTrackingTraySectionWeb
        orderId={id}
        order={order}
        existingReview={existingReview}
        disputes={disputes}
        submitReview={submitReview}
        submitOrderDispute={submitOrderDispute}
        labels={getOrderTrayLabels(locale)}
        onMessageCook={() => {
          document.getElementById('order-chat-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }}
      />

      {disputes.length > 0 && (
        <SHCCard className="mt-6" variant="customer" data-testid="order-dispute-submitted">
          <SHCSectionTitle>{t('orders.detail.issue_reported')}</SHCSectionTitle>
          <p className="mt-1 text-xs font-semibold text-muted-foreground">
            {disputes[0].status === 'open'
              ? t('orders.detail.dispute_open')
              : disputes[0].status || t('orders.detail.dispute_open')}{' '}
            · {disputes[0].type || t('orders.detail.dispute_other')}
          </p>
          {disputes[0].notes && <p className="mt-2 text-sm text-muted-foreground">{disputes[0].notes}</p>}
        </SHCCard>
      )}
    </div>
  );
}