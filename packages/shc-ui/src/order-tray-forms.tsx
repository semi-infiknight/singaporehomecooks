// Shipped order review/dispute tray forms — shared mobile + integration tests.
// @ts-nocheck
import React, { useRef } from 'react';
import { View, Text, TextInput, Pressable, StyleSheet } from 'react-native';
import { GourmeatPrimaryButton } from './gourmeat';
import { gourmeatColors, gourmeatRadii } from './theme';
import type { OrderTrayLabels } from './order-tray-opener-core';
import { DEFAULT_TRAY_LABELS } from './order-tray-opener-core';

type TrayFormLabels = Pick<
  OrderTrayLabels,
  | 'reviewPlaceholder'
  | 'reviewSubmit'
  | 'reviewSubmitting'
  | 'disputeHint'
  | 'disputePlaceholder'
  | 'disputeSubmit'
  | 'disputeSubmitting'
>;

export function SHCOrderReviewTrayForm({
  rating,
  onRatingChange,
  reviewBody,
  onReviewBodyChange,
  onSubmit,
  isPending,
  labels = DEFAULT_TRAY_LABELS,
}: {
  rating: number;
  onRatingChange: (n: number) => void;
  reviewBody: string;
  onReviewBodyChange: (text: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
  labels?: TrayFormLabels;
}) {
  const reviewInputRef = useRef<TextInput>(null);

  return (
    <View testID="order-review-tray">
      <View style={styles.starRow}>
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
      <Pressable
        testID="review-body-input"
        accessibilityLabel="review-body-input"
        collapsable={false}
        onPress={() => reviewInputRef.current?.focus()}
      >
        <TextInput
          ref={reviewInputRef}
          placeholder={labels.reviewPlaceholder}
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
        label={isPending ? labels.reviewSubmitting : labels.reviewSubmit}
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
  labels = DEFAULT_TRAY_LABELS,
}: {
  disputeNotes: string;
  onDisputeNotesChange: (text: string) => void;
  onSubmit: () => void;
  isPending?: boolean;
  labels?: TrayFormLabels;
}) {
  const disputeInputRef = useRef<TextInput>(null);
  const canSubmit = disputeNotes.trim().length >= 5;

  return (
    <View testID="order-dispute-tray">
      <Text style={styles.hintLine}>{labels.disputeHint}</Text>
      <Pressable
        testID="dispute-notes-input"
        accessibilityLabel="dispute-notes-input"
        collapsable={false}
        onPress={() => disputeInputRef.current?.focus()}
      >
        <TextInput
          ref={disputeInputRef}
          placeholder={labels.disputePlaceholder}
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
        label={isPending ? labels.disputeSubmitting : labels.disputeSubmit}
        onPress={onSubmit}
        disabled={!!isPending || !canSubmit}
        testID="submit-dispute-btn"
        style={{ marginTop: 10 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  starRow: { flexDirection: 'row', marginTop: 8, gap: 4 },
  hintLine: { fontSize: 12, marginTop: 4, color: gourmeatColors.textLight },
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
