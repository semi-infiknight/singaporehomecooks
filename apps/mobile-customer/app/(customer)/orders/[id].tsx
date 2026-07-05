import React, { useCallback, useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable } from 'react-native';
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
  useSHCTray,
  SHCTrayAction,
  openOrderReviewTray,
  openOrderDisputeTray,
} from '@shc/ui';
import {
  getDishImageUrl,
  getOrderStatusLabel,
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
  orderTrayActions,
} from '@shc/utils';
import { useOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getOrderDisputes, getReview, submitOrderDispute, submitReview } from '../../../lib/api-client';
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
  const { openTray, dismiss } = useSHCTray();
  const qc = useQueryClient();

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
        <SHCTrayAction
          message={message}
          primaryLabel={primaryLabel}
          onPrimary={dismiss}
          secondaryLabel={secondaryLabel}
          onSecondary={onSecondary}
          testID={testID}
        />
      ),
      renderError: ({ id, message }: { id: string; message: string }) => (
        <SHCTrayAction
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
    openOrderReviewTray(orderId, submitReview, trayFns);
  }, [orderId, trayFns]);

  const openDisputeTray = useCallback(() => {
    openOrderDisputeTray(orderId, submitOrderDispute, trayFns, {
      onMessageCook: () => {
        dismiss();
        router.push(`/(shared)/chat/${orderId}` as any);
      },
    });
  }, [dismiss, orderId, router, trayFns]);

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
  const { showReviewBtn: showReviewForm, showDisputeBtn: showDisputeForm } = orderTrayActions({
    order,
    review: existingReview,
    disputes,
  });
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

      <GourmeatPrimaryButton label="Message your cook" onPress={() => router.push(`/(shared)/chat/${order.id}` as any)} />

      {existingReview && (
        <GourmeatCard testID="order-review-submitted">
          <Text style={styles.cardTitle}>Your review</Text>
          <Text style={{ color: gourmeatColors.accent, fontSize: 18 }}>{'★'.repeat(existingReview.rating)}{'☆'.repeat(5 - existingReview.rating)}</Text>
          {existingReview.body ? <Text style={styles.cardBody}>{existingReview.body}</Text> : null}
        </GourmeatCard>
      )}

      {showReviewForm && (
        <GourmeatPrimaryButton
          label="Leave a review"
          onPress={openReviewTray}
          testID="open-review-tray-btn"
          style={{ marginBottom: shcSpacing.sm }}
        />
      )}

      {!showDisputeForm ? (
        <GourmeatCard testID="order-dispute-submitted">
          <Text style={styles.cardTitle}>Issue reported</Text>
          <Text style={styles.cardMeta}>
            {disputes[0].status || 'open'} · {disputes[0].type || 'other'}
          </Text>
          {!!disputes[0].notes && <Text style={styles.cardBody}>{disputes[0].notes}</Text>}
        </GourmeatCard>
      ) : (
        <GourmeatPrimaryButton
          label="Report an issue"
          variant="outline"
          onPress={openDisputeTray}
          testID="open-dispute-tray-btn"
        />
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