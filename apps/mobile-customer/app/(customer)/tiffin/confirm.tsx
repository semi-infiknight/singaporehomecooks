import React, { useMemo } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinConfirmBanner,
  SHCTiffinUpcomingWeeks,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { useTiffinSubscription } from '../../../hooks/useTiffin';

function formatWeekLabel(iso: string) {
  const d = new Date(`${iso}T12:00:00.000Z`);
  return d.toLocaleDateString('en-SG', { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function TiffinConfirmScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();

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
      <View style={styles.centered}>
        <ActivityIndicator color={gourmeatColors.primary} />
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
          subtitle="You can make changes until midnight before each collection day."
        />
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