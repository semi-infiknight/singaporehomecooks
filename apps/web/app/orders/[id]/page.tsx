'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  useOrder,
  useChat,
  useOrderDisputes,
  useReview,
} from '../../../lib/useOrder';
import { submitReview, submitOrderDispute, getOrderInvoice, createOrderPayNow, getOrder } from '../../../lib/api-client';
import { downloadPdfBase64InBrowser } from '../../../lib/download-pdf';
import { OrderTrackingTraySectionWeb } from '../../../lib/order-tray-section-web';
import {
  SHCCard,
  SHCButton,
  SHCSectionTitle,
  GourmeatScreenHeader,
  OrderTimeline,
  SHCSkeletonList,
  PayNowPanel,
} from '../../components/SHCWebComponents';
import {
  getOrderStatusLabel,
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
  orderTrackingBanner,
  orderDeliveredRateCopy,
  buildOrderChatContext,
  ORDER_COLLECTION_PRIVACY_HINT,
} from '@shc/utils';
import { SHCOrderChatPanel } from '../../components/SHCOrderChat';
import type { SHCOrderStatus } from '@shc/types';

type OrderDisplay = Record<string, unknown> & {
  shc_status?: SHCOrderStatus | string;
  collection_date?: string;
  collection_slot?: string;
  total?: number | string;
  cook_name?: string;
  paynow_reference?: string;
  is_corporate?: boolean;
  collection_address?: string;
  collection_instructions?: string;
  collection_address_released?: boolean;
};

type OrderReview = { rating: number; body?: string };
type OrderDispute = { status?: string; type?: string; notes?: string };

export default function TrackOrder() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const maestroE2e = process.env.NEXT_PUBLIC_MAESTRO_E2E === '1';
  const { data: orderRaw, isLoading, isFetching, refetch } = useOrder(id);
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
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [paySession, setPaySession] = useState<
    (Awaited<ReturnType<typeof createOrderPayNow>> & { error?: string }) | null
  >(null);
  const [paySessionLoading, setPaySessionLoading] = useState(false);
  const [waitingForPayment, setWaitingForPayment] = useState(false);

  const loadPayNowSession = useCallback(async (oid: string) => {
    setPaySessionLoading(true);
    try {
      const s = await createOrderPayNow(oid);
      setPaySession(s);
    } catch (e) {
      setPaySession({ provider: 'hitpay_error', order_id: oid, error: (e as Error).message } as any);
    } finally {
      setPaySessionLoading(false);
    }
  }, []);

  const chatContext = useMemo(() => {
    if (!order) return null;
    const base = buildOrderChatContext({
      orderId: id,
      status: String(order.shc_status || ''),
      statusLabel: getOrderStatusLabel(String(order.shc_status || '')),
      counterpartyName: String(order.cook_name || 'Your cook'),
      collectionDate: order.collection_date ? String(order.collection_date) : undefined,
      collectionSlot: order.collection_slot ? String(order.collection_slot) : undefined,
      items: (order.items as Array<{ name?: string }>) || [],
    });
    return {
      ...base,
      collectionAddress: order.collection_address ? String(order.collection_address) : undefined,
      collectionInstructions: order.collection_instructions
        ? String(order.collection_instructions)
        : undefined,
      privacyHint: order.collection_address_released ? undefined : ORDER_COLLECTION_PRIVACY_HINT,
    };
  }, [id, order]);

  const downloadInvoice = async () => {
    if (!id || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      const res = await getOrderInvoice(id);
      downloadPdfBase64InBrowser({
        pdf_base64: res.pdf_base64,
        filename: res.filename || `invoice-${id}.pdf`,
        mime: res.mime || 'application/pdf',
      });
    } catch (e) {
      alert((e as Error).message || 'Could not download invoice. Sign in and try again.');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const orderStatus = order?.shc_status ? String(order.shc_status) : '';
  const awaitingPayNow = orderStatus === 'cart';
  const payAutoStart = searchParams?.get('pay') === '1';

  useEffect(() => {
    if (!id || !awaitingPayNow) return;
    if ((payAutoStart || paySession === null) && !paySessionLoading) {
      void loadPayNowSession(id);
      setWaitingForPayment(true);
    }
  }, [awaitingPayNow, payAutoStart, id, loadPayNowSession, paySession, paySessionLoading]);

  useEffect(() => {
    if (!id || !waitingForPayment || !awaitingPayNow) return;
    const timer = setInterval(async () => {
      try {
        const fresh = await getOrder(id);
        const next = String((fresh as { shc_status?: string })?.shc_status || '');
        if (['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'].includes(next)) {
          setWaitingForPayment(false);
          void refetch();
        }
      } catch {
        /* retry poll */
      }
    }, 4000);
    return () => clearInterval(timer);
  }, [id, waitingForPayment, awaitingPayNow, refetch]);

  if ((!maestroE2e && isLoading) || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="order-tracking-skeleton">
        <div className="shc-skeleton h-40 w-full rounded-2xl mb-4" />
        <SHCSkeletonList count={4} rowHeight={56} />
      </div>
    );
  }

  const status = (order.shc_status || 'pending') as SHCOrderStatus;
  const trackBanner = orderTrackingBanner(
    String(status),
    order.collection_slot ? String(order.collection_slot) : undefined
  );
  const rateCopy = orderDeliveredRateCopy();
  const isDelivered = status === 'collected' || status === 'completed';
  const isPaid = ['paid', 'accepted', 'preparing', 'ready_for_collection', 'collected', 'completed'].includes(
    String(status)
  );
  const isCorporate = Boolean(order.is_corporate);

  return (
    <div className="max-w-2xl mx-auto px-4 py-10" data-testid="order-tracking-screen">
      <GourmeatScreenHeader
        title={getOrderStatusLabel(status)}
        subtitle={`Order ${id}`}
        backHref="/orders"
        backLabel="← All orders"
      />

      <div
        className={`rounded-2xl px-4 py-3 mb-4 font-extrabold text-sm ${
          trackBanner.tone === 'done'
            ? 'bg-green-600 text-white'
            : trackBanner.tone === 'active'
              ? 'bg-green-600 text-white'
              : 'bg-secondary text-foreground'
        }`}
        data-testid="order-tracking-banner"
      >
        {trackBanner.title}
        {trackBanner.subtitle ? (
          <p className="text-xs font-semibold opacity-90 mt-0.5">{trackBanner.subtitle}</p>
        ) : null}
      </div>

      {isActiveOrderStatus(status) && isFetching && (
        <p className="text-[11px] font-bold text-[var(--shc-success)] mb-3">Refreshing status…</p>
      )}

      <SHCCard className="mb-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border">
        <OrderTimeline status={status} live={isActiveOrderStatus(status)} />
      </SHCCard>

      {awaitingPayNow ? (
        <SHCCard className="mb-6" data-testid="order-paynow-panel">
          <p className="font-black mb-2">Complete PayNow to confirm</p>
          <p className="text-sm text-muted-foreground font-semibold mb-4">
            Your quote was accepted — pay now so your cook can start preparing.
          </p>
          <PayNowPanel
            amount={Number(order.total) || 0}
            reference={id}
            session={paySession}
            loadingSession={paySessionLoading}
            onRetry={() => void loadPayNowSession(id)}
            waitingForPayment={waitingForPayment}
          />
        </SHCCard>
      ) : null}

      <div className="mb-6">
        {isCorporate ? (
          <p className="text-xs font-extrabold text-primary mb-2" data-testid="order-corporate-badge">
            Corporate / group order — tax invoice for finance teams
          </p>
        ) : null}
        <SHCButton
          variant="outline"
          testID="order-download-invoice-btn"
          onClick={downloadInvoice}
          disabled={invoiceBusy || !isPaid}
        >
          {invoiceBusy
            ? 'Preparing PDF…'
            : isCorporate
              ? 'Download corporate tax invoice (PDF)'
              : 'Download tax invoice (PDF)'}
        </SHCButton>
        {!isPaid ? (
          <p className="text-[11px] font-semibold text-muted-foreground mt-2">
            Invoice available after PayNow payment is confirmed.
          </p>
        ) : null}
      </div>

      {isDelivered && (
        <SHCCard className="mb-6" data-testid="order-delivered-rate">
          <p className="font-black text-lg mb-1">{rateCopy.title}</p>
          <p className="text-sm font-semibold text-muted-foreground mb-3">{rateCopy.subtitle}</p>
          <div className="flex gap-2 text-2xl mb-4" aria-hidden>
            {'★☆☆☆☆'.split('').map((s, i) => (
              <span key={i} className="text-primary opacity-40">
                ★
              </span>
            ))}
          </div>
          <SHCButton onClick={() => (window.location.href = '/')} testID="order-continue-browsing">
            {rateCopy.cta}
          </SHCButton>
        </SHCCard>
      )}

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
          {order.collection_address_released ? (
            <>
              {order.collection_address ? (
                <span className="block font-semibold text-foreground">{String(order.collection_address)}</span>
              ) : null}
              {order.collection_instructions ? (
                <span className="block mt-1">{String(order.collection_instructions)}</span>
              ) : null}
              {!order.collection_address && !order.collection_instructions
                ? 'Check order chat for collection details from your cook.'
                : null}
            </>
          ) : (
            ORDER_COLLECTION_PRIVACY_HINT
          )}
        </p>
      </SHCCard>

      <div id="order-chat-section" className="mb-6">
        <SHCSectionTitle subtitle="Message your cook about dietary needs or arrival time">Order chat</SHCSectionTitle>
        {chatContext ? (
          <SHCOrderChatPanel
            viewerRole="customer"
            context={chatContext}
            messages={messages}
            onSend={(body) => send({ body, from: 'customer' })}
            isLoading={false}
          />
        ) : null}
      </div>

      {existingReview && (
        <SHCCard className="mt-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border" data-testid="order-review-submitted">
          <SHCSectionTitle>Your review</SHCSectionTitle>
          <p className="text-[#FFB800] text-lg mt-2">{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</p>
          {existingReview.body ? <p className="text-sm text-[#5C5144] mt-2">{existingReview.body}</p> : null}
        </SHCCard>
      )}

      <OrderTrackingTraySectionWeb
        orderId={id}
        order={order}
        existingReview={existingReview}
        disputes={disputes}
        submitReview={submitReview}
        submitOrderDispute={submitOrderDispute}
        onMessageCook={() => {
          router.push(`/chat/${id}`);
        }}
      />

      {disputes.length > 0 && (
        <SHCCard className="mt-6 rounded-2xl shadow-[var(--shc-shadow-card)] border border-border" data-testid="order-dispute-submitted">
          <SHCSectionTitle>Issue reported</SHCSectionTitle>
          <p className="mt-1 text-xs font-semibold text-[#5C5144]">
            {disputes[0].status || 'open'} · {disputes[0].type || 'other'}
          </p>
          {disputes[0].notes && <p className="mt-2 text-sm text-[#5C5144]">{disputes[0].notes}</p>}
        </SHCCard>
      )}
    </div>
  );
}