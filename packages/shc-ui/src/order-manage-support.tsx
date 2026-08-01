/**
 * Customer order manage — invoice, chat, dispute (mirrors cook order detail actions).
 */
// @ts-nocheck
import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, Alert, Linking } from 'react-native';
import { gourmeatColors, shcSpacing } from './theme';
import { GourmeatPrimaryButton, GourmeatCard } from './gourmeat';
import { useSHCTray, SHCTrayAction } from './tray';
import { SHCOrderDisputeTrayContent } from './order-tray-content';
import type { SubmitDisputeFn } from './order-tray-opener-core';

export type OrderManageSupportDispute = { status?: string; type?: string; notes?: string };

export function CustomerOrderManageSupportActions({
  orderId,
  isCorporate = false,
  invoiceEnabled = true,
  onDownloadInvoice,
  onChat,
  submitOrderDispute,
  disputes = [],
  testID = 'order-manage-support-actions',
}: {
  orderId: string;
  isCorporate?: boolean;
  invoiceEnabled?: boolean;
  onDownloadInvoice: (orderId: string) => Promise<void>;
  onChat: (orderId: string) => void;
  submitOrderDispute: SubmitDisputeFn;
  disputes?: OrderManageSupportDispute[];
  testID?: string;
}) {
  const { openTray, dismiss } = useSHCTray();
  const [invoiceBusy, setInvoiceBusy] = useState(false);
  const disputeList = disputes ?? [];
  const hasDispute = disputeList.length > 0;

  const invoiceLabel = useMemo(() => {
    if (invoiceBusy) return 'Opening PDF…';
    return isCorporate ? 'Open corporate dish invoice (PDF)' : 'Open dish invoice (PDF)';
  }, [invoiceBusy, isCorporate]);

  const downloadInvoice = useCallback(async () => {
    if (!orderId || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      await onDownloadInvoice(orderId);
    } catch (e: any) {
      Alert.alert('Invoice', e?.message || 'Could not open tax invoice PDF.');
    } finally {
      setInvoiceBusy(false);
    }
  }, [invoiceBusy, onDownloadInvoice, orderId]);

  const openDisputeTray = useCallback(() => {
    openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
      <SHCOrderDisputeTrayContent
        orderId={orderId}
        submitDisputeFn={submitOrderDispute}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'issue-reported', title: 'Issue reported', height: 'compact' },
            <SHCTrayAction
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
            <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} testID="dispute-error-tray" />
          );
        }}
      />
    ));
  }, [dismiss, openTray, orderId, submitOrderDispute]);

  if (!orderId) return null;

  return (
    <View style={styles.wrap} testID={testID}>
      <GourmeatPrimaryButton
        label={invoiceLabel}
        variant="outline"
        onPress={downloadInvoice}
        loading={invoiceBusy}
        disabled={!invoiceEnabled}
        testID="order-manage-download-invoice-btn"
        style={styles.btn}
      />
      {!invoiceEnabled ? (
        <Text style={styles.hint}>Invoice available after PayNow payment is confirmed.</Text>
      ) : null}

      <GourmeatPrimaryButton
        label="Chat with cook"
        variant="outline"
        onPress={() => onChat(orderId)}
        testID="order-manage-chat-btn"
        style={styles.btn}
      />

      {hasDispute ? (
        <GourmeatCard testID="order-manage-dispute-submitted">
          <Text style={styles.cardTitle}>Issue reported</Text>
          <Text style={styles.cardMeta}>
            {disputeList[0].status || 'open'} · {disputeList[0].type || 'other'}
          </Text>
          {!!disputeList[0].notes && <Text style={styles.cardBody}>{disputeList[0].notes}</Text>}
        </GourmeatCard>
      ) : (
        <GourmeatPrimaryButton
          label="Report an issue"
          variant="outline"
          onPress={openDisputeTray}
          testID="order-manage-open-dispute-btn"
          style={styles.btn}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: shcSpacing.md, gap: shcSpacing.sm },
  btn: { marginBottom: 0 },
  hint: { fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.xs },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight, fontWeight: '600' },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
});

/** Mobile helper — open signed invoice URL in browser. */
export async function openOrderInvoiceUrl(getUrl: (id: string) => Promise<{ download_url?: string }>, orderId: string) {
  const res = await getUrl(orderId);
  if (!res.download_url) throw new Error('No invoice download URL from server');
  await Linking.openURL(res.download_url);
}
