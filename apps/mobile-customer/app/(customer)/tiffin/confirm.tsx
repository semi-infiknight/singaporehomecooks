/**
 * Post-subscribe confirm — trust steps + pick meals (Wave 4).
 */
import React, { useMemo } from 'react';
import { View, ScrollView, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinConfirmBanner,
  SHCTiffinUpcomingWeeks,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
  SHCSkeletonList,
} from '@shc/ui';
import { subscribeConfirmSteps, subscribeTrustChips } from '@shc/utils';
import { useTiffinSubscription } from '../../../hooks/useTiffin';

function formatWeekLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function TiffinConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();

  const kitchen = (subData as any)?.kitchen;
  const cookName = kitchen?.cook?.display_name || 'your kitchen';
  const steps = subscribeConfirmSteps();
  const trust = subscribeTrustChips({
    area: kitchen?.cook?.area,
    cookName,
  });

  const weeks = useMemo(() => {
    const current = (subData as any)?.current_week;
    const next = (subData as any)?.next_week;
    const list = [current, next].filter(Boolean) as string[];
    if (current) {
      const d = new Date(`${current}T12:00:00.000Z`);
      d.setUTCDate(d.getUTCDate() + 14);
      list.push(d.toISOString().slice(0, 10));
    }
    return list.map((w) => ({ week_start: w, label: formatWeekLabel(w) }));
  }, [subData]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={4} rowHeight={64} />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="tiffin-confirm-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.xl,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <SHCTiffinConfirmBanner
          subtitle={`${cookName} · changes until midnight before each collection day.`}
        />

        <Text style={styles.section}>What happens next</Text>
        {steps.map((s) => (
          <View key={s.id} style={styles.card} testID={`tiffin-confirm-step-${s.id}`}>
            <Text style={styles.cardTitle}>{s.title}</Text>
            <Text style={styles.cardBody}>{s.body}</Text>
          </View>
        ))}

        <Text style={styles.section}>Your plan guarantees</Text>
        {trust.map((c) => (
          <View key={c.id} style={styles.card} testID={`subscribe-trust-${c.id}`}>
            <Text style={styles.cardTitle}>✓ {c.label}</Text>
            <Text style={styles.cardBody}>{c.detail}</Text>
          </View>
        ))}

        <SHCTiffinUpcomingWeeks weeks={weeks} selectedWeek={(subData as any)?.current_week} />
      </ScrollView>
      <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
        <GourmeatPrimaryButton
          label="Pick my meals"
          onPress={() => router.replace('/(customer)/tiffin/planner' as any)}
          testID="tiffin-pick-meals-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: {
    fontSize: 14,
    fontWeight: '800',
    color: gourmeatColors.text,
    marginTop: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  card: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.sm,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: gourmeatColors.text },
  cardBody: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4, lineHeight: 17 },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
    backgroundColor: gourmeatColors.surface,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
});
