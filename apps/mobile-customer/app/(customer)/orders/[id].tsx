import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCard,
  GourmeatPrimaryButton,
  OrderStatusBadge,
  SHCOrderTimeline,
  SHCFoodImage,
  gourmeatColors,
  gourmeatRadii,
  shcSpacing,
  OrderTrackingTraySection,
} from '@shc/ui';
import {
  getDishImageUrl,
  getOrderStatusLabel,
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
} from '@shc/utils';
import { useOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
import {
  getOrderDisputes,
  getOrderInvoice,
  getReview,
  submitOrderDispute,
  submitReview,
} from '../../../lib/api-client';
import { shareInvoicePdf } from '../../../lib/share-invoice-pdf';
import type { SHCOrderStatus } from '@shc/types';

type OrderDisplay = Record<string, unknown> & {
  id: string;
  shc_status: SHCOrderStatus | string;
  items?: Array<{ product_id?: string; productId?: string; name?: string; qty?: number }>;
  total?: number | string;
  collection_date?: string;
  collection_slot?: string;
  collection_instructions?: string;
  address_released_at?: string;
};

type OrderReview = { rating: number; body?: string };
type OrderDispute = { status?: string; type?: string; notes?: string };

export default function OrderTracking() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const orderId = id || '';
  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const { data: orderRaw, isFetching } = useOrder(orderId);
  const order = useMemo(
    () => resolveOrderForDisplay<OrderDisplay>(orderRaw as OrderDisplay | undefined, orderId, { maestroE2e }),
    [orderRaw, orderId, maestroE2e]
  );
  const { user } = useAuth();
  const { data: existingReviewRaw } = useQuery({
    queryKey: ['review', orderId],
    queryFn: () => getReview(orderId),
    enabled: !!orderId,
  });
  const existingReview = useMemo(
    () => resolveReviewForDisplay<OrderReview | null | undefined>(existingReviewRaw as OrderReview | null | undefined, orderId, { maestroE2e }),
    [existingReviewRaw, orderId, maestroE2e]
  );

  const { data: disputesRaw = [] } = useQuery({
    queryKey: ['order-disputes', orderId],
    queryFn: () => getOrderDisputes(orderId),
    enabled: !!orderId,
    placeholderData: [],
  });
  const disputes = useMemo(
    () => resolveDisputesForDisplay<OrderDispute>(disputesRaw as OrderDispute[], orderId, { maestroE2e }),
    [disputesRaw, orderId, maestroE2e]
  );
  const [invoiceBusy, setInvoiceBusy] = useState(false);

  const downloadInvoice = async () => {
    if (!orderId || invoiceBusy) return;
    setInvoiceBusy(true);
    try {
      const res = await getOrderInvoice(orderId);
      await shareInvoicePdf(res, `invoice-${orderId}.pdf`);
    } catch (e: any) {
      Alert.alert('Invoice', e?.message || 'Could not download tax invoice PDF. Sign in and try again.');
    } finally {
      setInvoiceBusy(false);
    }
  };

  if (!order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: gourmeatColors.textLight }}>Loading order…</Text>
      </View>
    );
  }

  const status = order.shc_status as SHCOrderStatus;
  const live = isActiveOrderStatus(status);
  const addrReleased = !!order.address_released_at || order.shc_status !== 'paid';
  const firstItem = (order.items || [])[0];
  const heroUri = getDishImageUrl({ id: firstItem?.product_id || firstItem?.productId, name: firstItem?.name });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingBottom: 120, paddingHorizontal: shcSpacing.md }}
      testID="order-tracking-screen"
    >
      <Pressable onPress={() => router.back()} style={{ marginBottom: shcSpacing.sm }}>
        <Text style={{ fontSize: 14, fontWeight: '700', color: gourmeatColors.primary }}>← All orders</Text>
      </Pressable>

      <SHCFoodImage uri={heroUri} height={160} rounded={gourmeatRadii.lg} />

      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{getOrderStatusLabel(status)}</Text>
          <Text style={styles.subtitle}>Order {order.id}</Text>
        </View>
        <OrderStatusBadge status={order.shc_status} />
      </View>

      {live && isFetching && <Text style={styles.liveHint}>Refreshing status…</Text>}

      <GourmeatCard>
        <SHCOrderTimeline status={status} live={live} />
      </GourmeatCard>

      <GourmeatCard>
        <Text style={styles.cardTitle}>Collection</Text>
        <Text style={styles.cardBody}>
          {order.collection_date} · {order.collection_slot}
        </Text>
        <Text style={styles.cardMeta}>S${order.total} · {user?.name || 'Guest'}</Text>
        {(order.items || []).map((it: any, i: number) => (
          <Text key={i} style={styles.itemLine}>
            {it.qty}× {it.name}
          </Text>
        ))}
        {addrReleased && order.shc_status !== 'cart' ? (
          <Text style={styles.addressLine}>
            HDB address: {order.collection_instructions || 'Check chat for block & unit.'}
          </Text>
        ) : (
          <Text style={styles.hintLine}>Address released ~2h before your slot, after payment confirms.</Text>
        )}
      </GourmeatCard>

      <GourmeatPrimaryButton
        label={invoiceBusy ? 'Preparing invoice…' : 'Download tax invoice (PDF)'}
        variant="outline"
        onPress={downloadInvoice}
        loading={invoiceBusy}
        testID="order-download-invoice-btn"
        style={{ marginBottom: shcSpacing.sm }}
      />
      <GourmeatPrimaryButton label="Message your cook" onPress={() => router.push(`/(shared)/chat/${order.id}` as any)} />

      {existingReview && (
        <GourmeatCard testID="order-review-submitted">
          <Text style={styles.cardTitle}>Your review</Text>
          <Text style={{ color: gourmeatColors.accent, fontSize: 18 }}>{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</Text>
          {existingReview.body ? <Text style={styles.cardBody}>{existingReview.body}</Text> : null}
        </GourmeatCard>
      )}

      <OrderTrackingTraySection
        orderId={orderId}
        order={order}
        existingReview={existingReview}
        disputes={disputes}
        submitReview={submitReview}
        submitOrderDispute={submitOrderDispute}
        onMessageCook={() => router.push(`/(shared)/chat/${orderId}` as any)}
      />

      {disputes.length > 0 && (
        <GourmeatCard testID="order-dispute-submitted">
          <Text style={styles.cardTitle}>Issue reported</Text>
          <Text style={styles.cardMeta}>
            {disputes[0].status || 'open'} · {disputes[0].type || 'other'}
          </Text>
          {!!disputes[0].notes && <Text style={styles.cardBody}>{disputes[0].notes}</Text>}
        </GourmeatCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginTop: shcSpacing.md },
  title: { fontSize: 22, fontWeight: '800', color: gourmeatColors.text },
  subtitle: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 },
  liveHint: { fontSize: 11, fontWeight: '700', color: gourmeatColors.success, marginTop: shcSpacing.xs },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight, fontWeight: '600' },
  itemLine: { marginTop: 4, fontSize: 13, color: gourmeatColors.text },
  addressLine: { marginTop: shcSpacing.sm, fontSize: 12, fontWeight: '700', color: gourmeatColors.primary },
  hintLine: { marginTop: shcSpacing.sm, fontSize: 11, color: gourmeatColors.textLight },
});