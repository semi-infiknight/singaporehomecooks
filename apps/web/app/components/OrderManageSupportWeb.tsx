'use client';

import React, { useCallback, useMemo, useState } from 'react';
import { SHCButton, SHCTrayActionWeb, useSHCTrayWeb } from '../../lib/shc-tray-web';
import { SHCCard } from './SHCWebComponents';
import { SHCOrderDisputeTrayContentWeb } from '../../lib/order-tray-content-web';
import type { SubmitDisputeFn } from '@shc/ui/order-tray-opener-core';

export type OrderManageSupportDispute = { status?: string; type?: string; notes?: string };

export function OrderManageSupportWeb({
  orderId,
  isCorporate = false,
  invoiceEnabled = true,
  onDownloadInvoice,
  onChat,
  submitOrderDispute,
  disputes = [],
}: {
  orderId: string;
  isCorporate?: boolean;
  invoiceEnabled?: boolean;
  onDownloadInvoice: (orderId: string) => Promise<void>;
  onChat: (orderId: string) => void;
  submitOrderDispute: SubmitDisputeFn;
  disputes?: OrderManageSupportDispute[];
}) {
  const { openTray, dismiss } = useSHCTrayWeb();
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const disputeList = disputes ?? [];
  const hasDispute = disputeList.length > 0;

  const invoiceLabel = useMemo(() => {
    if (invoiceBusy) return 'Preparing PDF…';
    return isCorporate ? 'Download corporate dish invoice (PDF)' : 'Download dish invoice (PDF)';
  }, [invoiceBusy, isCorporate]);

  const downloadInvoice = useCallback(async () => {
    if (!orderId || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      await onDownloadInvoice(orderId);
    } catch (e: unknown) {
      alert((e as Error)?.message || 'Could not download tax invoice PDF.');
    } finally {
      setInvoiceBusy(false);
    }
  }, [invoiceBusy, onDownloadInvoice, orderId]);

  const openDisputeTray = useCallback(() => {
    openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
      <SHCOrderDisputeTrayContentWeb
        orderId={orderId}
        submitDisputeFn={submitOrderDispute}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'issue-reported', title: 'Issue reported', height: 'compact' },
            <SHCTrayActionWeb
              message="Ops will review this order and follow up."
              primaryLabel="Got it"
              onPrimary={dismiss}
              testID="order-issue-reported-tray"
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
  }, [dismiss, openTray, orderId, submitOrderDispute]);

  if (!orderId) return null;

  return (
    <div className="mt-6 space-y-3" data-testid="order-manage-support-actions">
      <SHCButton
        variant="outline"
        className="w-full"
        testID="order-manage-download-invoice-btn"
        onClick={downloadInvoice}
        disabled={invoiceBusy || !invoiceEnabled}
      >
        {invoiceLabel}
      </SHCButton>
      {!invoiceEnabled ? (
        <p className="text-[11px] font-semibold text-muted-foreground">
          Invoice available after PayNow payment is confirmed.
        </p>
      ) : null}

      <SHCButton
        variant="outline"
        className="w-full"
        testID="order-manage-chat-btn"
        onClick={() => onChat(orderId)}
      >
        Chat with cook
      </SHCButton>

      {hasDispute ? (
        <SHCCard data-testid="order-manage-dispute-submitted">
          <p className="font-black text-sm mb-1">Issue reported</p>
          <p className="text-xs font-semibold text-muted-foreground">
            {disputeList[0].status || 'open'} · {disputeList[0].type || 'other'}
          </p>
          {disputeList[0].notes ? (
            <p className="text-sm font-semibold mt-2">{disputeList[0].notes}</p>
          ) : null}
        </SHCCard>
      ) : (
        <SHCButton
          variant="outline"
          className="w-full"
          testID="order-manage-open-dispute-btn"
          onClick={openDisputeTray}
        >
          Report an issue
        </SHCButton>
      )}
    </div>
  );
}
