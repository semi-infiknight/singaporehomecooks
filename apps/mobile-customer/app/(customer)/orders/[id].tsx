import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatCard,
  GourmeatPrimaryButton,
  GourmeatScreenHeader,
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
  isActiveOrderStatus,
  resolveOrderForDisplay,
  resolveReviewForDisplay,
  resolveDisputesForDisplay,
} from '@shc/utils';
import { useShcI18n, getLocalizedOrderStatus, formatOrderRef, getLocalizedOrderTimeline, getOrderTrayLabels, getCustomerOrderDetailCopy } from '@shc/i18n';
import { useOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery } from '@tanstack/react-query';
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
  const { t, locale } = useShcI18n();
  const orderCopy = getCustomerOrderDetailCopy(locale);
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

  if (!order) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]}>
        <Text style={{ color: gourmeatColors.textLight }}>{t('orders.detail.loading')}</Text>
      </View>
    );
  }

  const status = order.shc_status as SHCOrderStatus;
  const live = isActiveOrderStatus(status);
  const addrReleased = !!order.address_released_at || order.shc_status !== 'paid';
  const firstItem = (order.items || [])[0];
  const heroUri = getDishImageUrl({ id: firstItem?.product_id || firstItem?.productId, name: firstItem?.name });
  const timelineSteps = getLocalizedOrderTimeline(locale);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingBottom: 120, paddingHorizontal: shcSpacing.md }}
      testID="order-tracking-screen"
    >
      <GourmeatScreenHeader
        title={getLocalizedOrderStatus(locale, status)}
        subtitle={formatOrderRef(locale, order.id)}
        onBack={() => router.back()}
        backLabel={t('orders.detail.back')}
        testID="order-detail-header"
      />

      <SHCFoodImage uri={heroUri} height={160} rounded={gourmeatRadii.lg} />

      <View style={styles.badgeRow}>
        <OrderStatusBadge status={order.shc_status} />
      </View>

      {live && isFetching && <Text style={styles.liveHint}>{t('orders.detail.refreshing')}</Text>}

      <GourmeatCard>
        <SHCOrderTimeline
          status={status}
          live={live}
          steps={timelineSteps}
          liveLabel={t('orders.timeline.live')}
          cancelledLabel={getLocalizedOrderStatus(locale, status)}
        />
      </GourmeatCard>

      <GourmeatCard>
        <Text style={styles.cardTitle}>{t('orders.detail.collection')}</Text>
        <Text style={styles.cardBody}>
          {order.collection_date} · {order.collection_slot}
        </Text>
        <Text style={styles.cardMeta}>{orderCopy.totalMeta(order.total ?? '', user?.name || orderCopy.guest)}</Text>
        {(order.items || []).map((it: any, i: number) => (
          <Text key={i} style={styles.itemLine}>
            {orderCopy.itemLine(it.qty ?? 1, it.name ?? '')}
          </Text>
        ))}
        {addrReleased && order.shc_status !== 'cart' ? (
          <Text style={styles.addressLine}>
            {t('orders.detail.hdb_address').replace(
              '{address}',
              order.collection_instructions || t('orders.detail.hdb_fallback')
            )}
          </Text>
        ) : (
          <Text style={styles.hintLine}>{t('orders.detail.address_released_hint')}</Text>
        )}
      </GourmeatCard>

      <GourmeatPrimaryButton label={t('orders.detail.message_cook')} onPress={() => router.push(`/(shared)/chat/${order.id}` as any)} />

      {existingReview && (
        <GourmeatCard testID="order-review-submitted">
          <Text style={styles.cardTitle}>{t('orders.detail.your_review')}</Text>
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
        labels={getOrderTrayLabels(locale)}
        onMessageCook={() => router.push(`/(shared)/chat/${orderId}` as any)}
      />

      {disputes.length > 0 && (
        <GourmeatCard testID="order-dispute-submitted">
          <Text style={styles.cardTitle}>{t('orders.detail.issue_reported')}</Text>
          <Text style={styles.cardMeta}>{orderCopy.disputeMeta(disputes[0].status, disputes[0].type)}</Text>
          {!!disputes[0].notes && <Text style={styles.cardBody}>{disputes[0].notes}</Text>}
        </GourmeatCard>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, padding: shcSpacing.md, backgroundColor: gourmeatColors.background },
  badgeRow: { flexDirection: 'row', marginTop: shcSpacing.sm, marginBottom: shcSpacing.xs },
  liveHint: { fontSize: 11, fontWeight: '700', color: gourmeatColors.success, marginBottom: shcSpacing.xs },
  cardTitle: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text },
  cardBody: { marginTop: 6, fontSize: 14, fontWeight: '600', color: gourmeatColors.text },
  cardMeta: { marginTop: 4, fontSize: 12, color: gourmeatColors.textLight, fontWeight: '600' },
  itemLine: { marginTop: 4, fontSize: 13, color: gourmeatColors.text },
  addressLine: { marginTop: shcSpacing.sm, fontSize: 12, fontWeight: '700', color: gourmeatColors.primary },
  hintLine: { marginTop: shcSpacing.sm, fontSize: 11, color: gourmeatColors.textLight },
});