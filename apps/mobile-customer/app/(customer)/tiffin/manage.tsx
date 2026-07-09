import React, { useState } from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinPlanMetrics,
  SHCTiffinOrderLineItem,
  SHCTiffinEmptyState,
  TIFFIN_DAY_LABELS,
  tiffinWeeklySubtotal,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import {
  useTiffinSubscription,
  useCancelTiffin,
  useSubscribeTiffin,
  usePauseTiffin,
  useResumeTiffin,
} from '../../../hooks/useTiffin';

const CANCEL_REASONS = [
  'Moving away',
  'Too expensive',
  'Quality concerns',
  'Trying another kitchen',
  'Other',
];

export default function TiffinManageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();
  const cancelMut = useCancelTiffin();
  const subscribeMut = useSubscribeTiffin();
  const pauseMut = usePauseTiffin();
  const resumeMut = useResumeTiffin();
  const [showReasons, setShowReasons] = useState(false);

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];

  const handleCancel = async (reason: string) => {
    await cancelMut.mutateAsync(reason);
    router.replace('/(customer)/tiffin' as any);
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  if (!sub) {
    return (
      <ScrollView
        style={styles.screen}
        contentContainerStyle={{ padding: shcSpacing.lg, paddingTop: insets.top + 24, flexGrow: 1 }}
        testID="tiffin-manage-empty"
      >
        <SHCTiffinEmptyState
          illustration="no_active_sub"
          title="You have no active subscriptions."
          actionLabel="Subscribe now"
          onAction={() => router.replace('/(customer)/tiffin' as any)}
          testID="tiffin-manage-empty-state"
        />
        <GourmeatPrimaryButton
          label="My Subscriptions"
          variant="outline"
          onPress={() => router.push('/(customer)/tiffin/subscriptions' as any)}
          style={{ marginTop: shcSpacing.md }}
          testID="tiffin-open-subscriptions"
        />
      </ScrollView>
    );
  }

  const currentSlots = (subData as any)?.slots_current_week || [];
  const nextSlots = (subData as any)?.slots_next_week || [];
  const isPaused = sub.status === 'paused';

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: 120 }}
      testID="tiffin-manage-screen"
    >
      <GourmeatScreenHeader title="Manage tiffin" subtitle="Subscription settings" onBack={() => router.back()} />

      <Text style={styles.kitchenName}>{kitchen?.cook?.display_name || 'Kitchen'}</Text>
      <Text style={styles.meta}>
        {sub.meals_per_week} meals/wk · S${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)}/wk · {sub.status}
      </Text>

      <SHCTiffinPlanMetrics
        deliveriesLeft={sub.deliveries_left}
        flexLeft={sub.flex_remaining}
        flexQuota={sub.flex_quota}
        expiresOn={sub.expires_on}
        balanceLabel={`${sub.meals_per_week}/wk`}
      />

      <View style={styles.actions}>
        {isPaused ? (
          <GourmeatPrimaryButton
            label="Resume subscription"
            onPress={() => resumeMut.mutate()}
            loading={resumeMut.isPending}
            testID="tiffin-resume-btn"
          />
        ) : (
          <GourmeatPrimaryButton
            label="Pause 1 flex day"
            variant="outline"
            onPress={() => pauseMut.mutate(1)}
            loading={pauseMut.isPending}
            testID="tiffin-pause-btn"
          />
        )}
        <GourmeatPrimaryButton
          label="Edit weekly plan"
          onPress={() => router.push('/(customer)/tiffin/planner' as any)}
          testID="tiffin-manage-planner-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label="Override next week"
          variant="outline"
          onPress={() => router.push('/(customer)/tiffin/planner?mode=next-week' as any)}
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label="View meal calendar"
          variant="outline"
          onPress={() => router.push('/(customer)/tiffin/calendar' as any)}
          testID="tiffin-open-calendar-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
      </View>

      <Text style={styles.section}>Change meals per week</Text>
      <View style={styles.mealsRow}>
        {(kitchen?.meals_per_week_options || [2, 3, 4]).map((n: number) => (
          <GourmeatPrimaryButton
            key={n}
            label={String(n)}
            variant={n === sub.meals_per_week ? 'primary' : 'outline'}
            onPress={() => {
              if (sub.cook_id) subscribeMut.mutate({ cookId: sub.cook_id, mealsPerWeek: n as 2 | 3 | 4 });
            }}
            style={{ flex: 1 }}
          />
        ))}
      </View>

      <Text style={styles.section}>This week</Text>
      {currentSlots.length === 0 ? (
        <Text style={styles.hint}>No meals planned — pick your weekly menu.</Text>
      ) : (
        currentSlots.map((slot: any) => {
          const dish = dishes.find((d: any) => d.id === slot.product_id);
          if (!dish) return null;
          return (
            <SHCTiffinOrderLineItem
              key={slot.day_of_week}
              dish={{ id: dish.id, name: dish.name, price: dish.price }}
              dayLabel={TIFFIN_DAY_LABELS[slot.day_of_week]}
              onEdit={() => router.push('/(customer)/tiffin/planner' as any)}
            />
          );
        })
      )}

      {nextSlots.length > 0 ? (
        <>
          <Text style={styles.section}>Next week</Text>
          {nextSlots.map((slot: any) => {
            const dish = dishes.find((d: any) => d.id === slot.product_id);
            if (!dish) return null;
            return (
              <SHCTiffinOrderLineItem
                key={`next-${slot.day_of_week}`}
                dish={{ id: dish.id, name: dish.name, price: dish.price }}
                dayLabel={TIFFIN_DAY_LABELS[slot.day_of_week]}
                onEdit={() => router.push('/(customer)/tiffin/planner?mode=next-week' as any)}
              />
            );
          })}
        </>
      ) : null}

      <Text style={[styles.section, { marginTop: shcSpacing.xl }]}>Danger zone</Text>
      {!showReasons ? (
        <GourmeatPrimaryButton
          label="Cancel subscription"
          variant="outline"
          onPress={() => setShowReasons(true)}
          testID="tiffin-cancel-btn"
        />
      ) : (
        <View style={styles.reasons}>
          <Text style={styles.hint}>Why are you cancelling? (HomelyEats feedback step)</Text>
          {CANCEL_REASONS.map((r) => (
            <GourmeatPrimaryButton
              key={r}
              label={r}
              variant="outline"
              onPress={() => handleCancel(r)}
              loading={cancelMut.isPending}
              testID={`tiffin-cancel-reason-${r.slice(0, 8)}`}
              style={{ marginTop: shcSpacing.xs }}
            />
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
  kitchenName: { fontSize: 20, fontWeight: '800', color: gourmeatColors.text },
  meta: { fontSize: 13, color: gourmeatColors.textLight, marginBottom: shcSpacing.md, marginTop: 4 },
  section: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginTop: shcSpacing.lg, marginBottom: shcSpacing.sm },
  hint: { fontSize: 13, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  actions: { marginBottom: shcSpacing.md },
  mealsRow: { flexDirection: 'row', gap: 8 },
  reasons: { marginTop: shcSpacing.sm },
});
