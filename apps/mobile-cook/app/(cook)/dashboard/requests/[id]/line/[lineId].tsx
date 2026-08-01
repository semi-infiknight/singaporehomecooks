/**
 * Per-dish quote screen — set price for one dish in a custom request.
 */
import React, { useMemo } from 'react';
import { View, Text, ScrollView, StyleSheet, Pressable, TextInput } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GourmeatScreenHeader, SHCFoodImage, SHCMetaBadge, gourmeatColors, shcSpacing, shcBorders, shcRadii, contentPadForTabBar } from '@shc/ui';
import { formatBidCentsAsDollars, parseBidDollarsToCents, parseCustomRequestDisplay, shcServingsBadgeLabel } from '@shc/utils';
import { getDishImageUrl } from '@shc/utils';
import { useCustomRequest } from '../../../../../../hooks/useOrder';
import { useCookRequestQuoteDraft } from '../../../../../../lib/cook-request-quote-draft';

export default function CookCustomRequestDishDetail() {
  const { id, lineId } = useLocalSearchParams<{ id: string; lineId: string }>();
  const requestId = String(id || '');
  const dishLineId = String(lineId || '');
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: raw } = useCustomRequest(requestId);
  const { lines, updateLine } = useCookRequestQuoteDraft();

  const parsed = useMemo(
    () => (raw ? parseCustomRequestDisplay(raw as Record<string, unknown>) : null),
    [raw]
  );
  const line = parsed?.lines.find((l) => l.id === dishLineId);
  const qLine = lines.find((l) => l.request_line_id === dishLineId);
  const priceLabel =
    qLine?.included && (qLine.price_cents || 0) > 0 ? formatBidCentsAsDollars(qLine.price_cents) : '';

  if (!line) {
    return (
      <View style={[styles.screen, { padding: shcSpacing.md }]}>
        <Text style={styles.back} onPress={() => router.back()}>
          ← Back
        </Text>
        <Text style={{ fontWeight: '700', marginTop: shcSpacing.md }}>Dish not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingBottom: contentPadForTabBar(insets.bottom) + shcSpacing.lg,
        paddingHorizontal: shcSpacing.md,
      }}
      testID={`cook-request-dish-screen-${dishLineId}`}
    >
      <Pressable onPress={() => router.back()} style={{ marginBottom: shcSpacing.sm }}>
        <Text style={styles.back}>← Request</Text>
      </Pressable>
      <GourmeatScreenHeader title={line.name} subtitle="Set your price for this dish" />

      <SHCFoodImage uri={getDishImageUrl({ name: line.name })} height={200} rounded={shcRadii.lg} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: shcSpacing.md }}>
        <SHCMetaBadge kind="portion_min">{shcServingsBadgeLabel(line.servings)}</SHCMetaBadge>
      </View>
      {line.notes ? (
        <Text style={styles.notes}>{line.notes}</Text>
      ) : null}

      <Text style={styles.label}>Your price (S$)</Text>
      <TextInput
        placeholder="e.g. 45"
        placeholderTextColor={gourmeatColors.textLight}
        keyboardType="decimal-pad"
        value={priceLabel}
        onChangeText={(text) => {
          const parsedPrice = parseBidDollarsToCents(text);
          updateLine(dishLineId, {
            price_cents: parsedPrice.ok ? parsedPrice.cents : 0,
            included: parsedPrice.ok && parsedPrice.cents > 0,
            name: line.name,
            servings: line.servings,
          });
        }}
        style={styles.priceInput}
        testID={`quote-price-${dishLineId}`}
      />

      {qLine?.included ? (
        <Pressable
          onPress={() => updateLine(dishLineId, { included: false, price_cents: 0 })}
          style={{ marginTop: shcSpacing.md }}
          testID={`quote-skip-${dishLineId}`}
        >
          <Text style={styles.skip}>Skip this dish in my bid</Text>
        </Pressable>
      ) : (
        <Pressable
          onPress={() => updateLine(dishLineId, { included: true, name: line.name, servings: line.servings })}
          style={{ marginTop: shcSpacing.md }}
        >
          <Text style={styles.include}>Include in my bid</Text>
        </Pressable>
      )}

      <Pressable onPress={() => router.back()} style={styles.doneBtn} testID="cook-request-dish-done">
        <Text style={styles.doneText}>Done — back to request</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  back: { fontWeight: '800', color: gourmeatColors.primary, fontSize: 14 },
  notes: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: shcSpacing.sm, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '800', color: gourmeatColors.text, marginTop: shcSpacing.lg, marginBottom: 6 },
  priceInput: {
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    borderRadius: shcRadii.md,
    padding: shcSpacing.md,
    fontSize: 22,
    fontWeight: '900',
    color: gourmeatColors.text,
    backgroundColor: gourmeatColors.surface,
  },
  skip: { fontSize: 13, fontWeight: '800', color: gourmeatColors.textLight },
  include: { fontSize: 13, fontWeight: '800', color: gourmeatColors.primary },
  doneBtn: {
    marginTop: shcSpacing.xl,
    paddingVertical: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.primary,
    alignItems: 'center',
  },
  doneText: { color: gourmeatColors.onPrimary, fontWeight: '900', fontSize: 15 },
});
