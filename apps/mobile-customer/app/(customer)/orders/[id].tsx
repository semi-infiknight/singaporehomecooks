import React, { useCallback, useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, StyleSheet, Pressable } from 'react-native';
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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

function OrderReviewTrayContent({
  orderId,
  onSuccess,
  onError,
}: {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');
  const reviewInputRef = useRef<TextInput>(null);
  const qc = useQueryClient();
  const reviewMut = useMutation({
    mutationFn: () => submitReview(orderId, rating, reviewBody || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', orderId] });
      onSuccess();
    },
    onError: (e: any) => onError(e?.message || 'Could not submit review'),
  });

  return (
    <View testID="order-review-tray">
      <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Text
            key={n}
            onPress={() => setRating(n)}
            style={{ fontSize: 28, color: n <= rating ? gourmeatColors.accent : gourmeatColors.textMuted }}
          >
            ★
          </Text>
        ))}
      </View>
      <Pressable
        testID="review-body-input"
        accessibilityLabel="review-body-input"
        collapsable={false}
        onPress={() => reviewInputRef.current?.focus()}
      >
        <TextInput
          ref={reviewInputRef}
          placeholder="Share your experience (optional)"
          value={reviewBody}
          onChangeText={setReviewBody}
          multiline
          style={styles.reviewInput}
          accessibilityLabel="review-body-input"
          accessibilityValue={{ text: reviewBody }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </Pressable>
      <GourmeatPrimaryButton
        label={reviewMut.isPending ? 'Submitting…' : 'Submit review'}
        onPress={() => reviewMut.mutate()}
        disabled={reviewMut.isPending}
        testID="submit-review-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

function OrderDisputeTrayContent({
  orderId,
  onSuccess,
  onError,
}: {
  orderId: string;
  onSuccess: () => void;
  onError: (message: string) => void;
}) {
  const [disputeNotes, setDisputeNotes] = useState('');
  const disputeInputRef = useRef<TextInput>(null);
  const qc = useQueryClient();
  const disputeMut = useMutation({
    mutationFn: () => submitOrderDispute(orderId, { type: 'other', notes: disputeNotes.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['order-disputes', orderId] });
      onSuccess();
    },
    onError: (e: any) => onError(e?.message || 'Please try again.'),
  });

  return (
    <View testID="order-dispute-tray">
      <Text style={styles.hintLine}>Use this for food quality, collection, or safety issues that need ops review.</Text>
      <Pressable
        testID="dispute-notes-input"
        accessibilityLabel="dispute-notes-input"
        collapsable={false}
        onPress={() => disputeInputRef.current?.focus()}
      >
        <TextInput
          ref={disputeInputRef}
          placeholder="Tell ops what happened"
          value={disputeNotes}
          onChangeText={setDisputeNotes}
          multiline
          style={styles.reviewInput}
          accessibilityLabel="dispute-notes-input"
          accessibilityValue={{ text: disputeNotes }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </Pressable>
      <GourmeatPrimaryButton
        label={disputeMut.isPending ? 'Reporting…' : 'Report issue'}
        onPress={() => disputeMut.mutate()}
        disabled={disputeMut.isPending || disputeNotes.trim().length < 5}
        testID="submit-dispute-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

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

  const openReviewTray = useCallback(() => {
    openTray({ id: 'order-review', title: 'Leave a review', height: 'medium' }, () => (
      <OrderReviewTrayContent
        orderId={orderId}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'review-success', title: 'Thank you', height: 'compact' },
            <SHCTrayAction
              message="Your review helps other families find trusted home cooks."
              primaryLabel="Done"
              onPrimary={dismiss}
              testID="review-success-tray"
            />
          );
        }}
        onError={(message) => {
          openTray(
            { id: 'review-error', title: 'Review failed', height: 'compact' },
            <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} />
          );
        }}
      />
    ));
  }, [dismiss, openTray, orderId]);

  const openDisputeTray = useCallback(() => {
    openTray({ id: 'order-dispute', title: 'Report an issue', height: 'medium' }, () => (
      <OrderDisputeTrayContent
        orderId={orderId}
        onSuccess={() => {
          dismiss();
          openTray(
            { id: 'dispute-success', title: 'Issue reported', height: 'compact' },
            <SHCTrayAction
              message="Ops will review this order and follow up with you."
              primaryLabel="Got it"
              onPrimary={dismiss}
              secondaryLabel="Message your cook"
              onSecondary={() => {
                dismiss();
                router.push(`/(shared)/chat/${orderId}` as any);
              }}
              testID="dispute-success-tray"
            />
          );
        }}
        onError={(message) => {
          openTray(
            { id: 'dispute-error', title: 'Could not report issue', height: 'compact' },
            <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} />
          );
        }}
      />
    ));
  }, [dismiss, openTray, orderId, router]);

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
  reviewInput: {
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    borderRadius: gourmeatRadii.md,
    padding: 10,
    marginTop: 8,
    minHeight: 72,
    backgroundColor: gourmeatColors.surfaceAlt,
    color: gourmeatColors.text,
  },
});