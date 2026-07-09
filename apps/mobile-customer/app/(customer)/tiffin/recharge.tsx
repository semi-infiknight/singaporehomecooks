/**
 * HomelyEats Recharge plan.
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  GourmeatPrimaryButton,
  GourmeatCard,
  gourmeatColors,
  shcSpacing,
  tiffinWeeklySubtotal,
} from '@shc/ui';
import { rechargeWeekOptions, applyRecharge, defaultFlexQuota } from '@shc/business-rules';
import { useTiffinSubscription, useRechargeTiffin } from '../../../hooks/useTiffin';

export default function TiffinRechargeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();
  const rechargeMut = useRechargeTiffin();
  const [weeks, setWeeks] = useState(4);
  const [error, setError] = useState('');

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingTop: insets.top }]}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  if (!sub) {
    return (
      <View style={[styles.screen, { padding: shcSpacing.lg, paddingTop: insets.top + 24 }]}>
        <GourmeatScreenHeader title="Recharge plan" subtitle="No active subscription" onBack={() => router.back()} />
        <GourmeatPrimaryButton label="Browse kitchens" onPress={() => router.replace('/(customer)/tiffin' as any)} />
      </View>
    );
  }

  const preview = applyRecharge({
    mealsPerWeek: sub.meals_per_week,
    weeks,
    flexQuota: sub.flex_quota ?? defaultFlexQuota(sub.meals_per_week),
    flexRemaining: sub.flex_remaining ?? 0,
    deliveriesLeft: sub.deliveries_left ?? 0,
    expiresOn: sub.expires_on,
  });
  const estimate = tiffinWeeklySubtotal(sub.meals_per_week) * weeks;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: 120,
      }}
      testID="tiffin-recharge-screen"
    >
      <GourmeatScreenHeader
        title="Recharge plan"
        subtitle={kitchen?.cook?.display_name || 'Kitchen'}
        onBack={() => router.back()}
      />

      <GourmeatCard>
        <Text style={styles.meta}>
          {sub.meals_per_week} meals/wk · exp {sub.expires_on?.slice?.(0, 10) || '—'}
        </Text>
        <Text style={styles.meta}>
          Deliveries {sub.deliveries_left ?? '—'} · Flex {sub.flex_remaining ?? '—'}/{sub.flex_quota ?? '—'}
        </Text>
      </GourmeatCard>

      <Text style={styles.section}>How many weeks?</Text>
      <View style={styles.row} testID="recharge-weeks-picker">
        {rechargeWeekOptions().map((w) => {
          const on = weeks === w;
          return (
            <Pressable
              key={w}
              onPress={() => setWeeks(w)}
              style={[styles.chip, on && styles.chipOn]}
              testID={`recharge-weeks-${w}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{w} wk</Text>
            </Pressable>
          );
        })}
      </View>

      <GourmeatCard style={{ marginTop: shcSpacing.md }}>
        <Text style={styles.bold}>After recharge</Text>
        <Text style={styles.meta}>+{preview.mealsAdded} meals · flex {preview.flexRemaining}</Text>
        <Text style={styles.meta}>Expiry {preview.expiresOn}</Text>
        <Text style={styles.price}>S${estimate.toFixed(2)} · PayNow</Text>
      </GourmeatCard>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <GourmeatPrimaryButton
        label={rechargeMut.isPending ? 'Recharging…' : `Recharge ${weeks} week${weeks > 1 ? 's' : ''}`}
        loading={rechargeMut.isPending}
        onPress={async () => {
          setError('');
          try {
            await rechargeMut.mutateAsync(weeks);
            router.replace('/(customer)/tiffin/manage' as any);
          } catch (e: any) {
            setError(e?.message || 'Recharge failed');
          }
        }}
        testID="recharge-confirm-btn"
        style={{ marginTop: shcSpacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
  section: { fontSize: 14, fontWeight: '800', marginTop: shcSpacing.md, marginBottom: shcSpacing.sm, color: gourmeatColors.text },
  row: { flexDirection: 'row', gap: 8 },
  chip: {
    flex: 1,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
  },
  chipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  chipText: { fontWeight: '900', color: gourmeatColors.text },
  chipTextOn: { color: '#fff' },
  meta: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4 },
  bold: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  price: { fontSize: 16, fontWeight: '900', color: gourmeatColors.primary, marginTop: 8 },
  err: { color: '#B91C1C', fontWeight: '700', marginTop: 12 },
});
