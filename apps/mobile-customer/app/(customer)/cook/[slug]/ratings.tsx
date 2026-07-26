/**
 * Standalone kitchen ratings — HomelyEats ratings depth.
 */
import React, { useMemo, useState } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, Image } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
  shcRadii,
  SHCSkeletonList,
  SHCSkeletonBone,
  contentPadSafe,
} from '@shc/ui';
import {
  getCookAvatarUrl,
  kitchenRatingSummary,
  kitchenRatingBuckets,
  kitchenRatingBucketsFromReviews,
  kitchenReviewFromApi,
  sortKitchenReviews,
  type KitchenReviewSort,
} from '@shc/utils';
import { useCook, useCookReviews } from '../../../../hooks/useProducts';

const REVIEW_SORTS: { id: KitchenReviewSort; label: string }[] = [
  { id: 'recent', label: 'Most recent' },
  { id: 'highest', label: 'Highest' },
  { id: 'lowest', label: 'Lowest' },
  { id: 'photos', label: 'With photos' },
];

export default function KitchenRatingsScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: cook, isLoading } = useCook(String(slug || ''));
  const { data: reviewsPayload } = useCookReviews(String(slug || ''), { limit: 50 });
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');

  const ratingSum = useMemo(() => kitchenRatingSummary(cook as any), [cook]);
  const buckets = useMemo(() => {
    const fromReviews = kitchenRatingBucketsFromReviews(reviewsPayload?.reviews || []);
    if (fromReviews) return fromReviews;
    if (ratingSum) return kitchenRatingBuckets(ratingSum.rating);
    return [];
  }, [reviewsPayload?.reviews, ratingSum]);
  const reviews = useMemo(
    () =>
      sortKitchenReviews(
        (reviewsPayload?.reviews || []).map(kitchenReviewFromApi),
        reviewSort
      ),
    [reviewsPayload?.reviews, reviewSort]
  );
  const avatar = getCookAvatarUrl(String(cook?.id || slug), cook?.display_name || 'Cook');

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.sm,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: contentPadSafe(insets.bottom),
      }}
      testID="kitchen-ratings-screen"
    >
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          testID="ratings-back"
        >
          <Text style={styles.back}>‹</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Ratings & reviews</Text>
        <View style={{ width: 28 }} />
      </View>

      {isLoading || !cook ? (
        <View testID="kitchen-ratings-skeleton">
          <View style={{ flexDirection: 'row', gap: shcSpacing.md, marginBottom: shcSpacing.md }}>
            <SHCSkeletonBone width={56} height={56} radius={shcRadii.pill} />
            <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
              <SHCSkeletonBone height={16} width="60%" />
              <SHCSkeletonBone height={12} width="40%" />
            </View>
          </View>
          <SHCSkeletonList count={4} rowHeight={72} />
        </View>
      ) : (
        <>
          <View style={styles.cookRow}>
            <Image source={{ uri: avatar }} style={styles.avatar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.cookName}>{cook.display_name}</Text>
              <Text style={styles.meta}>
                {cook.area ? `${cook.area} · ` : ''}HDB collection kitchen
              </Text>
            </View>
          </View>

          <View style={styles.breakdown} testID="kitchen-rating-breakdown">
            {ratingSum ? (
              <>
                <View style={styles.scoreCol}>
                  <Text style={styles.score} testID="ratings-score">
                    {ratingSum.rating.toFixed(1)}
                  </Text>
                  <Text style={styles.meta}>out of 5.0</Text>
                  {ratingSum.reviewCount != null ? (
                    <Text style={styles.meta}>{ratingSum.reviewCount} reviews</Text>
                  ) : null}
                </View>
                <View style={{ flex: 1, gap: 6 }}>
                  {buckets.map((b) => (
                    <View key={b.key} style={styles.bucketRow}>
                      <Text style={styles.bucketLabel}>{b.label}</Text>
                      <View style={styles.bucketTrack}>
                        <View style={[styles.bucketFill, { width: `${Math.round(b.share * 100)}%` }]} />
                      </View>
                      <Text style={styles.bucketPct}>{Math.round(b.share * 100)}%</Text>
                    </View>
                  ))}
                </View>
              </>
            ) : (
              <Text style={styles.meta}>No ratings yet for this kitchen.</Text>
            )}
          </View>

          <Text style={styles.hint}>
            {reviews.length > 0
              ? 'Verified reviews from customers who collected their orders.'
              : 'No reviews yet. Leave one after you collect an order.'}
          </Text>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sortRow}>
            {REVIEW_SORTS.map((s) => {
              const on = reviewSort === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => setReviewSort(s.id)}
                  style={[styles.sortChip, on && styles.sortChipOn]}
                >
                  <Text style={[styles.sortText, on && styles.sortTextOn]}>{s.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {reviews.length === 0 ? (
            <Text style={styles.meta} testID="kitchen-reviews-empty">
              No written reviews yet for this kitchen.
            </Text>
          ) : (
            reviews.map((r) => (
              <View key={r.id} style={styles.reviewCard} testID={`kitchen-review-${r.id}`}>
                <View style={styles.reviewHead}>
                  <Text style={styles.author}>{r.author}</Text>
                  <Text style={styles.meta}>
                    {r.daysAgo === 1 ? '1 day ago' : `${r.daysAgo} days ago`}
                  </Text>
                </View>
                <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
                <Text style={styles.body}>{r.body}</Text>
                {r.hasPhoto ? <Text style={styles.photoTag}>Photo review</Text> : null}
              </View>
            ))
          )}

          <GourmeatPrimaryButton
            label="View menu & order"
            onPress={() => router.push(`/(customer)/cook/${slug}` as any)}
            testID="ratings-order-cta"
            style={{ marginTop: shcSpacing.md }}
          />
          <GourmeatPrimaryButton
            label="Subscribe to tiffin"
            variant="outline"
            onPress={() =>
              router.push(`/(customer)/tiffin/kitchen/${cook.id || slug}` as any)
            }
            style={{ marginTop: shcSpacing.sm }}
          />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: shcSpacing.sm },
  back: { fontSize: 28, fontWeight: '300', color: gourmeatColors.text, width: 28 },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '800',
    color: gourmeatColors.text,
  },
  cookRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: shcSpacing.md },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
  },
  cookName: { fontSize: 16, fontWeight: '900', color: gourmeatColors.text },
  meta: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 },
  breakdown: {
    flexDirection: 'row',
    gap: 12,
    backgroundColor: gourmeatColors.surface,
    borderRadius: shcRadii.lg,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
  },
  scoreCol: { width: 72 },
  score: { fontSize: 40, fontWeight: '900', color: gourmeatColors.text },
  bucketRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bucketLabel: { width: 70, fontSize: 10, fontWeight: '700', color: gourmeatColors.textLight },
  bucketTrack: {
    flex: 1,
    height: 8,
    borderRadius: 4,
    backgroundColor: gourmeatColors.border,
    overflow: 'hidden',
  },
  bucketFill: { height: '100%', backgroundColor: gourmeatColors.primary, borderRadius: 4 },
  bucketPct: { width: 32, fontSize: 10, fontWeight: '700', color: gourmeatColors.textLight, textAlign: 'right' },
  hint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: shcSpacing.sm, lineHeight: 17 },
  sortRow: { marginBottom: shcSpacing.sm, maxHeight: 40 },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    marginRight: 8,
    backgroundColor: gourmeatColors.surface,
  },
  sortChipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  sortText: { fontSize: 12, fontWeight: '800', color: gourmeatColors.text },
  sortTextOn: { color: '#fff' },
  reviewCard: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  reviewHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  author: { fontSize: 14, fontWeight: '900', color: gourmeatColors.text },
  stars: { color: gourmeatColors.primary, fontWeight: '800', marginTop: 4 },
  body: { fontSize: 13, fontWeight: '600', color: gourmeatColors.text, marginTop: 6, lineHeight: 18 },
  photoTag: {
    marginTop: 8,
    fontSize: 10,
    fontWeight: '900',
    color: gourmeatColors.textLight,
    textTransform: 'uppercase',
  },
});
