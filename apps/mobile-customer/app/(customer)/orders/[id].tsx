import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Alert, StyleSheet, Pressable } from 'react-native';
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
} from '@shc/ui';
import { getDishImageUrl, getOrderStatusLabel, isActiveOrderStatus } from '@shc/utils';
import { useOrder } from '../../../hooks/useOrder';
import { useAuth } from '../../../hooks/useAuth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getReview, submitReview } from '../../../lib/api-client';
import { canSubmitReview } from '@shc/business-rules';
import type { SHCOrderStatus } from '@shc/types';

export default function OrderTracking() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: order, isFetching } = useOrder(id || '');
  const { user } = useAuth();
  const qc = useQueryClient();
  const [rating, setRating] = useState(5);
  const [reviewBody, setReviewBody] = useState('');

  const { data: existingReview } = useQuery({
    queryKey: ['review', id],
    queryFn: () => getReview(id || ''),
    enabled: !!id,
  });

  const reviewMut = useMutation({
    mutationFn: () => submitReview(id || '', rating, reviewBody || undefined),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['review', id] });
      Alert.alert('Thank you', 'Your review helps other families find trusted home cooks.');
    },
    onError: (e: any) => Alert.alert('Review failed', e?.message || 'Could not submit review'),
  });

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
  const showReviewForm = canSubmitReview(status) && !existingReview;
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
        <GourmeatCard testID="order-review-form">
          <Text style={styles.cardTitle}>Leave a review</Text>
          <View style={{ flexDirection: 'row', marginTop: 8, gap: 4 }}>
            {[1, 2, 3, 4, 5].map((n) => (
              <Text key={n} onPress={() => setRating(n)} style={{ fontSize: 28, color: n <= rating ? gourmeatColors.accent : gourmeatColors.textMuted }}>
                ★
              </Text>
            ))}
          </View>
          <TextInput
            placeholder="Share your experience (optional)"
            value={reviewBody}
            onChangeText={setReviewBody}
            multiline
            style={styles.reviewInput}
            testID="review-body-input"
            placeholderTextColor={gourmeatColors.textMuted}
          />
          <GourmeatPrimaryButton
            label={reviewMut.isPending ? 'Submitting…' : 'Submit review'}
            onPress={() => reviewMut.mutate()}
            disabled={reviewMut.isPending}
            testID="submit-review-btn"
            style={{ marginTop: 10 }}
          />
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