// Shipped order review/dispute tray forms — shared mobile + integration tests.
// @ts-nocheck
import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { REVIEW_DIMENSIONS, type ReviewDimensionId, type ReviewDimensionScores } from '@shc/utils';
import { GourmeatPrimaryButton } from './gourmeat';
import { gourmeatColors, gourmeatRadii } from './theme';

export function SHCOrderReviewTrayForm({
  rating,
  onRatingChange,
  reviewBody,
  onReviewBodyChange,
  dimensionScores = {},
  onDimensionChange,
  onSubmit,
  isPending,
}: {
  rating: number;
  onRatingChange: (n: number) => void;
  reviewBody: string;
  onReviewBodyChange: (text: string) => void;
  dimensionScores?: ReviewDimensionScores;
  onDimensionChange?: (id: ReviewDimensionId, score: number) => void;
  onSubmit: () => void;
  isPending?: boolean;
}) {
  const reviewInputRef = useRef<TextInput>(null);

  return (
    <View testID="order-review-tray">
      <Text style={styles.sectionLabel}>Overall</Text>
      <View style={styles.starRow} testID="review-overall-stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <Text
            key={n}
            onPress={() => onRatingChange(n)}
            style={{ fontSize: 28, color: n <= rating ? gourmeatColors.accent : gourmeatColors.textMuted }}
          >
            ★
          </Text>
        ))}
      </View>

      <Text style={[styles.sectionLabel, { marginTop: 12 }]}>How was everything?</Text>
      <Text style={styles.hintLine}>
        Rate taste, communication, presentation, quantity, oily & spicy after you have eaten.
      </Text>
      {REVIEW_DIMENSIONS.map((dim) => {
        const score = dimensionScores[dim.id] ?? 0;
        return (
          <View key={dim.id} style={styles.dimRow} testID={`review-dim-${dim.id}`}>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={styles.dimLabel}>{dim.label}</Text>
              {dim.hint ? <Text style={styles.dimHint}>{dim.hint}</Text> : null}
            </View>
            <View style={styles.starRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Text
                  key={n}
                  onPress={() => onDimensionChange?.(dim.id, n)}
                  testID={`review-dim-${dim.id}-${n}`}
                  style={{
                    fontSize: 20,
                    color: n <= score ? gourmeatColors.accent : gourmeatColors.textMuted,
                  }}
                >
                  ★
                </Text>
              ))}
            </View>
          </View>
        );
      })}

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
          onChangeText={onReviewBodyChange}
          multiline
          style={styles.reviewInput}
          accessibilityLabel="review-body-input"
          accessibilityValue={{ text: reviewBody }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </Pressable>
      <GourmeatPrimaryButton
        label={isPending ? 'Submitting…' : 'Submit review'}
        onPress={onSubmit}
        disabled={!!isPending}
        testID="submit-review-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

export function SHCOrderDisputeTrayForm({
  disputeNotes,
  onDisputeNotesChange,
  onSubmit,
  isPending,
}: {
  disputeNotes: string;
  onDisputeNotesChange: (text: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
}) {
  const disputeInputRef = useRef<TextInput>(null);
  const canSubmit = disputeNotes.trim().length >= 5;

  return (
    <View testID="order-dispute-tray">
      <Text style={styles.hintLine}>
        Use this for food quality, collection, or safety issues that need ops review.
      </Text>
      <Pressable
        testID="dispute-notes-input"
        accessibilityLabel="dispute-notes-input"
        collapsable={false}
        onPress={() => disputeInputRef.current?.focus()}
      >
        <TextInput
          ref={disputeInputRef}
          placeholder="Tell ops what happened. Include timing, dish condition, or collection issue."
          value={disputeNotes}
          onChangeText={onDisputeNotesChange}
          multiline
          style={styles.reviewInput}
          accessibilityLabel="dispute-notes-input"
          accessibilityValue={{ text: disputeNotes }}
          placeholderTextColor={gourmeatColors.textMuted}
        />
      </Pressable>
      <GourmeatPrimaryButton
        label={isPending ? 'Reporting…' : 'Report issue'}
        onPress={onSubmit}
        disabled={!!isPending || !canSubmit}
        testID="submit-dispute-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: { flexDirection: 'row', marginTop: 4, gap: 2, alignItems: 'center' },
  sectionLabel: { fontSize: 12, fontWeight: '800', color: gourmeatColors.text, marginTop: 4 },
  hintLine: { fontSize: 12, marginTop: 4, marginBottom: 6, color: '#5C5144' },
  dimRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: gourmeatColors.border,
  },
  dimLabel: { fontSize: 13, fontWeight: '700', color: gourmeatColors.text },
  dimHint: { fontSize: 10, color: gourmeatColors.textMuted, marginTop: 1 },
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