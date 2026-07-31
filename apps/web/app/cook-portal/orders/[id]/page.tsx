'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import {
  buildOrderChatContext,
  canDownloadCookSettlementInvoice,
  COOK_SETTLEMENT_INVOICE_PROVISIONAL_HINT,
  COOK_SETTLEMENT_INVOICE_UNAVAILABLE_MESSAGE,
  getDishImageUrl,
  getOrderStatusLabel,
  isCookComplianceVerified,
  isCookSettlementInvoiceProvisional,
  resolveOrderCollectionFields,
  shcOrderStatusBadgeLabel,
  shcOrderStatusBadgeVariant,
} from '@shc/utils';
import {
  useCookOrder,
  useCookTransitionOrder,
  useCookChat,
  useComplianceDocs,
  useCookOrderDisputes,
} from '../../../../lib/useCookPortal';
import { getCookOrderInvoice } from '../../../../lib/cook-api-client';
import { downloadPdfBase64InBrowser } from '../../../../lib/download-pdf';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCSkeletonList,
  SHCSectionTitle,
  SHCBadge,
  SHCErrorBanner,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../../components/SHCWebComponents';
import { SHCOrderChatPanel } from '../../../components/SHCOrderChat';

type OrderAction = {
  to: SHCOrderStatus;
  label: string;
  danger?: boolean;
};

const NEXT_ACTIONS: Record<string, OrderAction[]> = {
  cart: [
    { to: 'accepted', label: 'Accept order' },
    { to: 'cancelled', label: 'Decline order', danger: true },
  ],
  paid: [{ to: 'preparing', label: 'Start preparing' }],
  preparing: [{ to: 'ready_for_collection', label: 'Mark ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Mark collected' }],
};

function CookOrderDisputeTray({
  onSubmit,
  isPending,
}: {
  onSubmit: (notes: string) => void;
  isPending: boolean;
}) {
  const [notes, setNotes] = useState('');

  return (
    <div data-testid="cook-order-dispute-tray">
      <p className="text-sm text-muted-foreground">
        Use this for late cancellation, no-show, safety, or collection issues that need ops review.
      </p>
      <textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Tell ops what happened"
        className="w-full mt-3 min-h-[88px] rounded-xl border border-border px-3 py-2 text-sm font-semibold"
        data-testid="cook-dispute-notes-input"
      />
      <GourmeatPrimaryButton
        label={isPending ? 'Reporting…' : 'Report issue'}
        onClick={() => onSubmit(notes.trim())}
        disabled={isPending || notes.trim().length < 5}
        className="mt-3"
        testID="cook-submit-dispute-btn"
      />
    </div>
  );
}

export default function CookOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: order, isLoading, isError, error } = useCookOrder(id);
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const { messages, send, isSending } = useCookChat(id);
  const { disputes, submit: submitDispute, isSubmitting: disputeSubmitting } = useCookOrderDisputes(id);
  const transMut = useCookTransitionOrder();
  const { openTray, dismiss } = useSHCTrayWeb();
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const [transitionErr, setTransitionErr] = useState<{ code?: string; message: string } | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined' || window.location.hash !== '#cook-order-chat') return;
    const el = document.getElementById('cook-order-chat');
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [order]);

  const downloadInvoice = async () => {
    if (!id || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      const res = await getCookOrderInvoice(id);
      downloadPdfBase64InBrowser({
        pdf_base64: res.pdf_base64,
        filename: res.filename || `settlement-${id}.pdf`,
        mime: res.mime || 'application/pdf',
      });
    } catch (e) {
      alert((e as Error).message || 'Could not download settlement invoice.');
    } finally {
      setInvoiceBusy(false);
    }
  };

  const orderRecord = order as Record<string, unknown> | undefined;
  const status = String(orderRecord?.shc_status || '');
  const settlementAvailable = canDownloadCookSettlementInvoice(status);
  const settlementProvisional = isCookSettlementInvoiceProvisional(status);
  const actions = NEXT_ACTIONS[status] || [];
  const items = (orderRecord?.items as Array<{ name?: string; qty?: number; product_id?: string; image_url?: string }>) || [];
  const dishName = items[0]?.name || `Order ${id}`;
  const collection = useMemo(
    () =>
      resolveOrderCollectionFields(
        {
          shc_status: status,
          address_released_at: orderRecord?.address_released_at as string | Date | null | undefined,
          collection_address: orderRecord?.collection_address as string | null | undefined,
          collection_instructions: orderRecord?.collection_instructions as string | null | undefined,
          viewerRole: 'cook',
        },
        new Date()
      ),
    [orderRecord, status]
  );

  const chatContext = useMemo(() => {
    const base = buildOrderChatContext({
      orderId: id,
      status,
      statusLabel: getOrderStatusLabel(status),
      counterpartyName: 'Customer',
      collectionDate: orderRecord?.collection_date ? String(orderRecord.collection_date) : undefined,
      collectionSlot: orderRecord?.collection_slot ? String(orderRecord.collection_slot) : undefined,
      collectionAddress: collection.collection_address,
      collectionInstructions: collection.collection_instructions,
      items,
    });
    return {
      ...base,
      privacyHint: 'Share HDB block / unit in chat when the order is ready for collection.',
    };
  }, [collection.collection_address, collection.collection_instructions, id, items, orderRecord, status]);

  const doTransition = async (to: SHCOrderStatus) => {
    setTransitionErr(null);
    if (to === 'accepted' && !complianceOk) {
      setTransitionErr({
        code: 'SHC-COMPLIANCE-002',
        message: 'SFA and WSQ must be verified before you can accept orders.',
      });
      return;
    }
    try {
      await transMut.mutateAsync({ orderId: id, to });
    } catch (e: any) {
      setTransitionErr({ code: e?.code, message: e?.message || 'Transition failed' });
    }
  };

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    const isDecline = to === 'cancelled';
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayActionWeb
        message={
          isDecline
            ? 'Decline this order? The customer will be notified and the order will not be fulfilled.'
            : `Advance this order to “${label}”? The customer will see the update immediately.`
        }
        primaryLabel={isDecline ? 'Decline' : label}
        onPrimary={() => {
          dismiss();
          void doTransition(to);
        }}
        secondaryLabel="Go back"
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  const openDisputeTray = () => {
    openTray(
      { id: 'cook-order-dispute', title: 'Report an issue', height: 'medium' },
      <CookOrderDisputeTray
        isPending={disputeSubmitting}
        onSubmit={async (notes) => {
          try {
            await submitDispute(notes);
            dismiss();
            openTray(
              { id: 'issue-reported', title: 'Issue reported', height: 'compact' },
              <SHCTrayActionWeb
                message="Ops will review this order and follow up."
                primaryLabel="Got it"
                onPrimary={dismiss}
                testID="cook-issue-reported-tray"
              />
            );
          } catch (e) {
            openTray(
              { id: 'issue-error', title: 'Could not report issue', height: 'compact' },
              <SHCTrayActionWeb message={(e as Error).message || 'Please try again.'} primaryLabel="OK" onPrimary={dismiss} />
            );
          }
        }}
      />
    );
  };

  if (isLoading && !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="cook-order-detail-loading">
        <SHCSkeletonList count={4} rowHeight={64} />
      </div>
    );
  }

  if (isError || !orderRecord) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6" data-testid="cook-order-detail-error">
        <GourmeatScreenHeader title="Order not found" subtitle={id} backHref="/cook-portal/orders" backLabel="← Orders" />
        <p className="text-sm text-muted-foreground mt-4">{(error as Error)?.message || 'Order not found or still loading.'}</p>
        <Link href="/cook-portal/orders" className="inline-block mt-4 text-sm font-semibold text-primary">
          Back to orders
        </Link>
      </div>
    );
  }

  const heroUrl = getDishImageUrl({
    id: items[0]?.product_id,
    name: dishName,
    image_url: items[0]?.image_url,
  });

  return (
    <div className="max-w-2xl mx-auto px-4 py-4" data-testid="cook-order-detail-screen">
      <GourmeatScreenHeader
        title={dishName}
        subtitle={getOrderStatusLabel(status)}
        backHref="/cook-portal/orders"
        backLabel="← Orders"
      />

      <div className="relative w-full h-[140px] rounded-2xl overflow-hidden border-2 border-[var(--shc-border-brutal)] mb-4" data-testid="cook-order-hero">
        <Image src={heroUrl} alt={dishName} fill className="object-cover" sizes="(max-width: 672px) 100vw, 672px" />
      </div>

      {transitionErr ? <SHCErrorBanner code={transitionErr.code} message={transitionErr.message} /> : null}

      <div className="mb-3">
        <SHCBadge variant={shcOrderStatusBadgeVariant(status)}>{shcOrderStatusBadgeLabel(status)}</SHCBadge>
      </div>

      {!complianceOk && status === 'paid' && (
        <GourmeatCard className="mb-3 bg-amber-50 border-amber-200" data-testid="cook-order-compliance-gate">
          <p className="text-sm font-bold">Complete SFA + WSQ verification before accepting this order.</p>
          <Link href="/cook-portal/compliance" className="text-sm font-semibold text-primary mt-2 inline-block">
            Open Compliance →
          </Link>
        </GourmeatCard>
      )}

      <GourmeatCard className="mb-4">
        <p className="font-extrabold">Collection</p>
        <p className="text-sm font-semibold mt-1">
          {String(orderRecord.collection_date || '')} · {String(orderRecord.collection_slot || '')}
        </p>
        <p className="text-sm text-muted-foreground mt-1">
          S${String(orderRecord.total ?? '')} · {items.length || 1} item(s)
        </p>
        {items.map((it, i) => (
          <p key={i} className="text-sm font-semibold mt-1">
            {it.qty || 1}× {it.name}
          </p>
        ))}
        {!!orderRecord.cooking_notes && (
          <p className="text-sm font-semibold mt-3" data-testid="cook-order-cooking-notes">
            Cooking: {String(orderRecord.cooking_notes)}
          </p>
        )}
        {!!orderRecord.collection_notes && (
          <p className="text-sm font-semibold mt-2" data-testid="cook-order-collection-notes">
            Collection: {String(orderRecord.collection_notes)}
          </p>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          Customer address in chat after accept. Use the buttons below to advance fulfilment.
        </p>
      </GourmeatCard>

      {actions.length > 0 && (
        <div className="flex flex-col gap-2 mb-3">
          {actions.map((a) => (
            <GourmeatPrimaryButton
              key={a.to}
              label={transMut.isPending ? 'Updating…' : a.label}
              variant={a.danger ? 'outline' : 'primary'}
              disabled={transMut.isPending || (a.to === 'accepted' && !complianceOk)}
              onClick={() => confirmTransition(a.to, a.label)}
              testID={`cook-portal-order-transition-${a.to}`}
              className={a.danger ? '!border-red-600 !text-red-700' : undefined}
            />
          ))}
        </div>
      )}

      {settlementAvailable ? (
        <div className="mb-3">
          {settlementProvisional ? (
            <p className="text-xs font-semibold text-muted-foreground mb-2" data-testid="cook-settlement-invoice-provisional-hint">
              {COOK_SETTLEMENT_INVOICE_PROVISIONAL_HINT}
            </p>
          ) : null}
          <GourmeatPrimaryButton
            label={invoiceBusy ? 'Preparing PDF…' : 'Download settlement invoice (PDF)'}
            variant="outline"
            onClick={downloadInvoice}
            disabled={invoiceBusy}
            testID="cook-order-download-invoice-btn"
          />
        </div>
      ) : (
        <p className="text-xs font-semibold text-muted-foreground mb-3" data-testid="cook-settlement-invoice-unavailable">
          {COOK_SETTLEMENT_INVOICE_UNAVAILABLE_MESSAGE}
        </p>
      )}

      <div className="mt-6" id="cook-order-chat">
        <SHCSectionTitle subtitle="Coordinate collection with your customer">Order chat</SHCSectionTitle>
        <SHCOrderChatPanel
          viewerRole="cook"
          context={chatContext}
          messages={messages}
          onSend={(body) => send(body)}
          sending={isSending}
        />
      </div>

      {disputes.length > 0 ? (
        <GourmeatCard className="mt-4" testID="cook-order-dispute-submitted">
          <p className="font-extrabold">Issue reported</p>
          <p className="text-sm text-muted-foreground mt-1">
            {String(disputes[0].status || 'open')} · {String(disputes[0].type || 'other')}
          </p>
          {!!disputes[0].notes && <p className="text-sm font-semibold mt-2">{String(disputes[0].notes)}</p>}
        </GourmeatCard>
      ) : (
        <GourmeatPrimaryButton
          label="Report an issue"
          variant="outline"
          onClick={openDisputeTray}
          testID="cook-open-dispute-tray-btn"
          className="mt-4"
        />
      )}

      <p className="text-xs text-muted-foreground text-center mt-6">
        Valid transitions only — invalid moves show SHC-ORDER-001.
      </p>

      <Link href="/cook-portal/orders" className="block text-center text-sm font-semibold text-primary mt-4">
        Back to orders
      </Link>
    </div>
  );
}
