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
import { shapeTiffinLedgerForUi } from '@shc/utils';
import {
  useTiffinSubscription,
  useCancelTiffin,
  useSubscribeTiffin,
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
  const ledger = shapeTiffinLedgerForUi((subData as any)?.ledger, sub);

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: 120 }}
      testID="tiffin-manage-screen"
    >
      <GourmeatScreenHeader
        title="Manage subscription"
        subtitle={kitchen?.cook?.display_name || 'Kitchen'}
        onBack={() => router.push('/(customer)/tiffin/subscriptions' as any)}
      />

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

      {/* Primary: Pause · Recharge */}
      <View style={styles.actions}>
        {isPaused ? (
          <GourmeatPrimaryButton
            label="Resume"
            onPress={() => resumeMut.mutate()}
            loading={resumeMut.isPending}
            testID="tiffin-resume-btn"
          />
        ) : (
          <GourmeatPrimaryButton
            label="Pause"
            variant="outline"
            onPress={() => router.push('/(customer)/tiffin/pause' as any)}
            testID="tiffin-pause-btn"
          />
        )}
        <GourmeatPrimaryButton
          label="Recharge"
          onPress={() => router.push('/(customer)/tiffin/recharge' as any)}
          testID="tiffin-recharge-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label="Edit weekly plan"
          variant="outline"
          onPress={() => router.push('/(customer)/tiffin/planner' as any)}
          testID="tiffin-manage-planner-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label="Meal calendar"
          variant="outline"
          onPress={() => router.push('/(customer)/tiffin/calendar' as any)}
          testID="tiffin-open-calendar-btn"
          style={{ marginTop: shcSpacing.sm }}
        />
        <GourmeatPrimaryButton
          label="Collection address"
          variant="outline"
          onPress={() => router.push('/(customer)/location' as any)}
          testID="tiffin-change-address"
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

      <Text style={styles.section}>Recent transactions</Text>
      <View style={styles.ledger} testID="tiffin-ledger-preview">
        {ledger.map((row) => (
          <View key={row.id} style={styles.ledgerRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.ledgerLabel}>{row.label}</Text>
              <Text style={styles.hint}>{row.dateLabel}</Text>
            </View>
            <Text style={styles.ledgerAmt}>{row.amountLabel}</Text>
          </View>
        ))}
        <Text style={[styles.hint, { marginTop: 8 }]}>
          PayNow recharges post here. Skip/pause use flex (no charge).
        </Text>
        <GourmeatPrimaryButton
          label="Recharge again"
          onPress={() => router.push('/(customer)/tiffin/recharge' as any)}
          style={{ marginTop: shcSpacing.sm }}
          testID="tiffin-ledger-recharge-btn"
        />
      </View>

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
  ledger: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    padding: shcSpacing.md,
  },
  ledgerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
  },
  ledgerLabel: { fontSize: 13, fontWeight: '700', color: gourmeatColors.text },
  ledgerAmt: { fontSize: 13, fontWeight: '900', color: gourmeatColors.primary },
});
