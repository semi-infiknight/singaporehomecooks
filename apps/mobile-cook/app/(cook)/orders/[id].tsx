import React from 'react';
import { Text, TextInput, View, ScrollView, StyleSheet, Pressable, Alert, Linking } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  GourmeatScreenHeader,
  GourmeatCard,
  GourmeatPrimaryButton,
  OrderStatusBadge,
  SHCFoodImage,
  SHCErrorBanner,
  gourmeatColors,
  shcSpacing,
  useSHCTray,
  SHCTrayAction,
  SHCSkeletonList,
  contentPadForTabBar,
} from '@shc/ui';
import { getOrderStatusLabel, getDishImageUrl, isCookComplianceVerified, canDownloadCookSettlementInvoice, COOK_SETTLEMENT_INVOICE_PROVISIONAL_HINT, COOK_SETTLEMENT_INVOICE_UNAVAILABLE_MESSAGE, isCookSettlementInvoiceProvisional } from '@shc/utils';
import { useOrder, useTransitionOrder, useComplianceDocs } from '../../../hooks/useOrder';
import { getOrderDisputes, getOrderInvoiceDownloadUrl, submitOrderDispute } from '../../../lib/api-client';
import { SHCOrderStatus } from '@shc/types';

function CookOrderDisputeTrayContent({
  onSubmit,
  isPending,
}: {
  onSubmit: (notes: string) => void;
  isPending: boolean;
}) {
  const [disputeNotes, setDisputeNotes] = React.useState('');

  return (
    <View testID="cook-order-dispute-tray">
      <Text style={styles.hint}>Use this for late cancellation, no-show, safety, or collection issues that need ops review.</Text>
      <TextInput
        value={disputeNotes}
        onChangeText={setDisputeNotes}
        placeholder="Tell ops what happened"
        placeholderTextColor={gourmeatColors.textMuted}
        multiline
        style={styles.disputeInput}
        testID="cook-dispute-notes-input"
      />
      <GourmeatPrimaryButton
        label={isPending ? 'Reporting…' : 'Report issue'}
        onPress={() => onSubmit(disputeNotes.trim())}
        disabled={isPending || disputeNotes.trim().length < 5}
        testID="cook-submit-dispute-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const NEXT_ACTIONS: Record<string, { to: SHCOrderStatus; label: string; variant?: 'primary' | 'outline' | 'danger' }[]> = {
  paid: [
    { to: 'accepted', label: 'Accept order' },
    { to: 'cancelled', label: 'Decline order', variant: 'danger' },
  ],
  accepted: [{ to: 'preparing', label: 'Prepare' }],
  preparing: [{ to: 'ready_for_collection', label: 'Ready' }],
  ready_for_collection: [{ to: 'collected', label: 'Collected' }],
};

export default function CookManageOrder() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const id = Array.isArray(params.id) ? params.id[0] : params.id;
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const qc = useQueryClient();
  const { data: order, isLoading: orderLoading, isError: orderError, error: orderErr } = useOrder(id || '');
  const { data: complianceDocs = [] } = useComplianceDocs();
  const complianceOk = isCookComplianceVerified(complianceDocs as any[]);
  const transMut = useTransitionOrder();
  const [err, setErr] = React.useState<any>(null);
  const [invoiceBusy, setInvoiceBusy] = React.useState(false);
  const { openTray, dismiss } = useSHCTray();

  const { data: disputes } = useQuery({
    queryKey: ['order-disputes', id],
    queryFn: () => getOrderDisputes(id || ''),
    enabled: !!id,
  });
  const disputeList = (disputes as any[]) ?? [];

  const disputeMut = useMutation({
    mutationFn: (notes: string) => submitOrderDispute(id || '', { type: 'other', notes }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-disputes', id] });
      dismiss();
      openTray(
        { id: 'issue-reported', title: 'Issue reported', height: 'compact' },
        <SHCTrayAction
          message="Ops will review this order and follow up."
          primaryLabel="Got it"
          onPrimary={dismiss}
          testID="cook-issue-reported-tray"
        />
      );
    },
    onError: (e: any) => {
      openTray(
        { id: 'issue-error', title: 'Could not report issue', height: 'compact' },
        <SHCTrayAction message={e?.message || 'Please try again.'} primaryLabel="OK" onPrimary={dismiss} />
      );
    },
  });

  const doTransition = async (to: SHCOrderStatus) => {
    if (!id) return;
    setErr(null);
    if (to === 'accepted' && !complianceOk) {
      setErr({
        code: 'SHC-COMPLIANCE-002',
        message: 'SFA and WSQ must be verified before you can accept orders.',
      });
      return;
    }
    try {
      await transMut.mutateAsync({ orderId: id, to });
    } catch (e: any) {
      setErr({ code: e?.code, message: e?.message || 'Transition failed' });
    }
  };

  const confirmTransition = (to: SHCOrderStatus, label: string) => {
    const isDecline = to === 'cancelled';
    openTray(
      { id: 'order-status-confirm', title: label, height: 'compact' },
      <SHCTrayAction
        message={
          isDecline
            ? 'Decline this order? The customer will be notified and the order will not be fulfilled.'
            : `Advance this order to “${label}”? The customer will see the update immediately.`
        }
        primaryLabel={isDecline ? 'Decline' : label}
        onPrimary={() => {
          dismiss();
          doTransition(to);
        }}
        secondaryLabel="Go back"
        onSecondary={dismiss}
        testID="order-status-confirm-tray"
      />
    );
  };

  const openDisputeTray = () => {
    openTray({ id: 'cook-order-dispute', title: 'Report an issue', height: 'medium' }, () => (
      <CookOrderDisputeTrayContent onSubmit={(notes) => disputeMut.mutate(notes)} isPending={disputeMut.isPending} />
    ));
  };

  const downloadInvoice = async () => {
    if (!id || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      const res = await getOrderInvoiceDownloadUrl(id);
      if (!res.download_url) throw new Error('No invoice download URL from server');
      await Linking.openURL(res.download_url);
    } catch (e: any) {
      Alert.alert('Invoice', e?.message || 'Could not open settlement PDF.');
    } finally {
      setInvoiceBusy(false);
    }
  };

  if (!id) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: gourmeatColors.textLight }}>Missing order id</Text>
        <GourmeatPrimaryButton label="Back to orders" onPress={() => router.replace('/(cook)/orders')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  if (orderLoading && !order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top, paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={4} rowHeight={64} />
      </View>
    );
  }

  if (orderError || !order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top, paddingHorizontal: 16 }]}>
        <Text style={{ color: gourmeatColors.textLight, textAlign: 'center' }}>
          {(orderErr as Error)?.message || 'Order not found or still loading.'}
        </Text>
        <GourmeatPrimaryButton label="Back to orders" onPress={() => router.replace('/(cook)/orders')} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const actions = NEXT_ACTIONS[order.shc_status] || [];
  const dishName = order.items?.[0]?.name;
  const settlementAvailable = canDownloadCookSettlementInvoice(String(order.shc_status || ''));
  const settlementProvisional = isCookSettlementInvoiceProvisional(String(order.shc_status || ''));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }}
      testID="cook-order-detail-screen"
    >
      <GourmeatScreenHeader
        title={dishName || `Order ${order.id}`}
        subtitle={getOrderStatusLabel(String(order.shc_status || ''))}
        onBack={() => router.back()}
      />

      <SHCFoodImage
        uri={getDishImageUrl({
          id: order.items?.[0]?.product_id,
          name: dishName,
          image_url: order.items?.[0]?.image_url,
        })}
        height={140}
        rounded={16}
        testID="cook-order-hero"
      />

      {err && <SHCErrorBanner code={err.code} message={err.message} />}

      <OrderStatusBadge status={order.shc_status} />

      {!complianceOk && order.shc_status === 'paid' && (
        <GourmeatCard style={{ marginBottom: shcSpacing.sm, backgroundColor: '#FEF3C7' }} testID="cook-order-compliance-gate">
          <Text style={styles.hint}>Complete SFA + WSQ verification before accepting this order.</Text>
          <GourmeatPrimaryButton
            label="Open Compliance"
            size="sm"
            variant="outline"
            onPress={() => router.push('/(cook)/compliance' as any)}
            style={{ marginTop: 8 }}
          />
        </GourmeatCard>
      )}

      <GourmeatCard>
        <Text style={styles.cardTitle}>Collection</Text>
        <Text style={styles.cardBody}>
          {order.collection_date} · {order.collection_slot}
        </Text>
        <Text style={styles.cardMeta}>S${order.total} · {order.items?.length || 1} item(s)</Text>
        {(order.items || []).map((it: any, i: number) => (
          <Text key={i} style={styles.itemLine}>
            {it.qty}× {it.name}
          </Text>
        ))}
        {!!(order as any).cooking_notes && (
          <Text style={styles.cardBody} testID="cook-order-cooking-notes">
            Cooking: {(order as any).cooking_notes}
          </Text>
        )}
        {!!(order as any).collection_notes && (
          <Text style={styles.cardBody} testID="cook-order-collection-notes">
            Collection: {(order as any).collection_notes}
          </Text>
        )}
        <Text style={styles.hint}>
          Customer address in chat after accept. Use the buttons below to advance fulfilment.
        </Text>
      </GourmeatCard>

      {actions.length > 0 && (
        <View style={styles.actions}>
          {actions.map((a) => (
            <GourmeatPrimaryButton
              key={a.to}
              label={transMut.isPending ? 'Updating…' : a.label}
              variant={a.variant === 'danger' ? 'outline' : a.variant || 'primary'}
              onPress={() => confirmTransition(a.to, a.label)}
              disabled={transMut.isPending || (a.to === 'accepted' && !complianceOk)}
              testID={`cook-order-transition-${a.to}`}
            />
          ))}
        </View>
      )}

      {settlementAvailable ? (
        <View style={styles.invoiceBlock}>
          {settlementProvisional ? (
            <Text style={styles.hint} testID="cook-settlement-invoice-provisional-hint">
              {COOK_SETTLEMENT_INVOICE_PROVISIONAL_HINT}
            </Text>
          ) : null}
          <GourmeatPrimaryButton
            label={invoiceBusy ? 'Opening PDF…' : 'Open settlement invoice (PDF)'}
            variant="outline"
            onPress={downloadInvoice}
            loading={invoiceBusy}
            testID="cook-order-download-invoice-btn"
          />
        </View>
      ) : (
        <Text style={styles.hint} testID="cook-settlement-invoice-unavailable">
          {COOK_SETTLEMENT_INVOICE_UNAVAILABLE_MESSAGE}
        </Text>
      )}

      <GourmeatPrimaryButton
        label="Chat with customer"
        variant="outline"
        onPress={() => router.push(`/(shared)/chat/${order.id}` as any)}
        testID="cook-order-chat-btn"
      />

      {disputeList.length > 0 ? (
        <GourmeatCard testID="cook-order-dispute-submitted">
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
          testID="cook-open-dispute-tray-btn"
        />
      )}

      <Text style={styles.footer}>Valid transitions only — invalid moves show SHC-ORDER-001.</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight },
  itemLine: { marginTop: 4, fontSize: 13, color: gourmeatColors.text },
  hint: { marginTop: shcSpacing.sm, fontSize: 12, color: gourmeatColors.textLight, lineHeight: 18 },
  invoiceBlock: { marginTop: shcSpacing.sm, gap: 8 },
  actions: { gap: 8, marginTop: shcSpacing.md, marginBottom: shcSpacing.sm },
  disputeInput: {
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    padding: 10,
    marginTop: shcSpacing.sm,
    minHeight: 76,
    backgroundColor: gourmeatColors.surfaceAlt,
    color: gourmeatColors.text,
  },
  disputeStatus: {
    marginTop: shcSpacing.sm,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    backgroundColor: gourmeatColors.surfaceAlt,
    padding: shcSpacing.sm,
  },
  disputeTitle: { fontSize: 13, fontWeight: '800', color: gourmeatColors.text },
  footer: { fontSize: 11, marginTop: shcSpacing.md, color: gourmeatColors.textMuted },
});