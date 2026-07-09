/**
 * HomelyEats Pause plan — flex days.
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
} from '@shc/ui';
import { pauseDayOptions, applyPause } from '@shc/business-rules';
import { useTiffinSubscription, usePauseTiffin } from '../../../hooks/useTiffin';

export default function TiffinPauseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();
  const pauseMut = usePauseTiffin();
  const [days, setDays] = useState(1);
  const [error, setError] = useState('');

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const flexLeft = Number(sub?.flex_remaining ?? 0);
  const options = pauseDayOptions(flexLeft);

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
        <GourmeatScreenHeader title="Pause plan" onBack={() => router.back()} />
        <GourmeatPrimaryButton label="Browse kitchens" onPress={() => router.replace('/(customer)/tiffin' as any)} />
      </View>
    );
  }

  if (options.length === 0) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: shcSpacing.lg, paddingTop: insets.top + 24 }}
        testID="tiffin-pause-no-flex"
      >
        <GourmeatScreenHeader title="No flex days left" onBack={() => router.back()} />
        <Text style={styles.meta}>Recharge for a new period to get flex days back.</Text>
        <GourmeatPrimaryButton
          label="Recharge plan"
          onPress={() => router.push('/(customer)/tiffin/recharge' as any)}
          style={{ marginTop: shcSpacing.md }}
        />
      </ScrollView>
    );
  }

  const preview = applyPause({
    flexRemaining: flexLeft,
    pauseDays: days,
    expiresOn: sub.expires_on,
  });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: 120,
      }}
      testID="tiffin-pause-screen"
    >
      <GourmeatScreenHeader
        title="Pause plan"
        subtitle={kitchen?.cook?.display_name || 'Kitchen'}
        onBack={() => router.back()}
      />

      <GourmeatCard>
        <Text style={styles.flexNum}>{flexLeft}</Text>
        <Text style={styles.meta}>Flex days remaining</Text>
        <Text style={[styles.meta, { marginTop: 8 }]}>
          Pausing holds collections and extends expiry so you don’t lose paid meals.
        </Text>
      </GourmeatCard>

      <Text style={styles.section}>Pause for how many days?</Text>
      <View style={styles.row} testID="pause-days-picker">
        {options.map((d) => {
          const on = days === d;
          return (
            <Pressable
              key={d}
              onPress={() => setDays(d)}
              style={[styles.dayChip, on && styles.chipOn]}
              testID={`pause-days-${d}`}
            >
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{d}</Text>
            </Pressable>
          );
        })}
      </View>

      <GourmeatCard style={{ marginTop: shcSpacing.md }}>
        <Text style={styles.bold}>What happens</Text>
        <Text style={styles.meta}>Until {preview.pausedUntil}</Text>
        <Text style={styles.meta}>Flex after: {preview.flexRemaining}</Text>
        {preview.expiresOn ? <Text style={styles.meta}>Expiry → {preview.expiresOn}</Text> : null}
      </GourmeatCard>

      {error ? <Text style={styles.err}>{error}</Text> : null}

      <GourmeatPrimaryButton
        label={pauseMut.isPending ? 'Pausing…' : `Pause for ${days} day${days > 1 ? 's' : ''}`}
        loading={pauseMut.isPending}
        onPress={async () => {
          setError('');
          try {
            await pauseMut.mutateAsync(days);
            router.replace('/(customer)/tiffin/manage' as any);
          } catch (e: any) {
            setError(e?.message || 'Pause failed');
          }
        }}
        testID="pause-confirm-btn"
        style={{ marginTop: shcSpacing.lg }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
  section: { fontSize: 14, fontWeight: '800', marginTop: shcSpacing.md, marginBottom: shcSpacing.sm, color: gourmeatColors.text },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayChip: {
    minWidth: 48,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
  },
  chipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  chipText: { fontWeight: '900', color: gourmeatColors.text },
  chipTextOn: { color: '#fff' },
  flexNum: { fontSize: 32, fontWeight: '900', color: gourmeatColors.primary },
  meta: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4, lineHeight: 18 },
  bold: { fontSize: 15, fontWeight: '900', color: gourmeatColors.text },
  err: { color: '#B91C1C', fontWeight: '700', marginTop: 12 },
});
