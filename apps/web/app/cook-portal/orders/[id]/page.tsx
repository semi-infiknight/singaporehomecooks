'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { SHCOrderStatus } from '@shc/types';
import { buildOrderChatContext, getOrderStatusLabel, isCookComplianceVerified } from '@shc/utils';
import { useCookOrder, useCookTransitionOrder, useCookChat, useComplianceDocs } from '../../../../lib/useCookPortal';
import { getCookOrderInvoice } from '../../../../lib/cook-api-client';
import { downloadPdfBase64InBrowser } from '../../../../lib/download-pdf';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  SHCSkeletonList,
  SHCSectionTitle,
  useSHCTrayWeb,
  SHCTrayActionWeb,
} from '../../../components/SHCWebComponents';
import { SHCOrderChatPanel } from '../../../components/SHCOrderChat';

const NEXT: Record<string, { to: SHCOrderStatus; label: string }[]> = {
  paid: [{ to: 'accepted', label: 'Accept order' }],
  accepted: [{ to: 'preparing', label: 'Start preparing' }],
  preparing: [{ to: 'ready_for_collection', label: 'Mark ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Mark collected' }],
};

export default function CookOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params?.id as string;
  const { data: order, isLoading } = useCookOrder(id);
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const { messages, send, isSending } = useCookChat(id);
  const transMut = useCookTransitionOrder();
  const { openTray, dismiss } = useSHCTrayWeb();
  const [invoiceBusy, setInvoiceBusy] = useState(false);

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

  if (isLoading || !order) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SHCSkeletonList count={4} rowHeight={64} />
      </div>
    );
  }

  const status = String(order.shc_status || '');
  const actions = NEXT[status] || [];
  const chatContext = useMemo(
    () =>
      buildOrderChatContext({
        orderId: id,
        status,
        statusLabel: getOrderStatusLabel(status),
        counterpartyName: 'Customer',
        collectionDate: order.collection_date ? String(order.collection_date) : undefined,
        collectionSlot: order.collection_slot ? String(order.collection_slot) : undefined,
        collectionInstructions: order.collection_instructions ? String(order.collection_instructions) : undefined,
        items: (order.items as Array<{ name?: string }>) || [],
      }),
    [id, order, status]
  );

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    if (to === 'accepted' && !complianceOk) {
      alert('SFA and WSQ must be verified before you can accept orders.');
      return;
    }
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayActionWeb
        message={`Advance this order to “${label}”? The customer will see the update immediately.`}
        primaryLabel={label}
        onPrimary={async () => {
          dismiss();
          try {
            await transMut.mutateAsync({ orderId: id, to });
          } catch (e) {
            openTray(
              { id: 'order-status-error', title: 'Update failed', height: 'compact' },
              <SHCTrayActionWeb message={(e as Error).message} primaryLabel="OK" onPrimary={dismiss} testID="order-status-error-tray" />
            );
          }
        }}
        secondaryLabel="Cancel"
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-4">
      <GourmeatScreenHeader
        title={getOrderStatusLabel(status)}
        subtitle={`Order ${id}`}
        backHref="/cook-portal/orders"
        backLabel="← Orders"
      />

      <GourmeatCard className="mb-4">
        <p className="font-extrabold">{String((order.items as { name?: string }[])?.[0]?.name || 'Order')}</p>
        <p className="text-sm text-muted-foreground mt-1">
          {order.collection_date} · {order.collection_slot}
        </p>
        <p className="text-lg font-extrabold text-primary mt-2">S${order.total}</p>
        <p className="text-xs text-muted-foreground mt-2">Cook: {order.cook_name}</p>
      </GourmeatCard>

      {!complianceOk && status === 'paid' && (
        <GourmeatCard className="mb-3 bg-amber-50 border-amber-200" data-testid="cook-order-compliance-gate">
          <p className="text-sm font-bold">Complete SFA + WSQ verification before accepting this order.</p>
          <Link href="/cook-portal/compliance" className="text-sm font-semibold text-primary mt-2 inline-block">
            Open Compliance →
          </Link>
        </GourmeatCard>
      )}

      <div className="flex flex-wrap gap-2 mb-3">
        {actions.map((a) => (
          <GourmeatPrimaryButton
            key={a.to}
            label={transMut.isPending ? 'Updating…' : a.label}
            disabled={transMut.isPending || (a.to === 'accepted' && !complianceOk)}
            onClick={() => confirmTransition(a.to, a.label)}
            testID={`cook-portal-order-transition-${a.to}`}
          />
        ))}
      </div>

      <GourmeatPrimaryButton
        label={invoiceBusy ? 'Preparing PDF…' : 'Download settlement invoice (PDF)'}
        variant="outline"
        onClick={downloadInvoice}
        disabled={invoiceBusy}
        testID="cook-order-download-invoice-btn"
      />

      <div className="mt-6" id="cook-order-chat">
        <SHCSectionTitle subtitle="Coordinate collection with your customer">Order chat</SHCSectionTitle>
        <SHCOrderChatPanel
          viewerRole="cook"
          context={{
            ...chatContext,
            privacyHint: 'Share HDB block / unit when the order is ready for collection.',
          }}
          messages={messages}
          onSend={(body) => send(body)}
          sending={isSending}
        />
      </div>

      <Link href="/cook-portal/orders" className="block text-center text-sm font-semibold text-primary mt-8">
        Back to orders
      </Link>
    </div>
  );
}