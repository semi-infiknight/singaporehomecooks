import React from 'react';
import { View, Text, ScrollView, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinManageSettings,
  SHCTiffinOrderLineItem,
  TIFFIN_DAY_LABELS,
  tiffinWeeklySubtotal,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { useTiffinSubscription, useCancelTiffin, useSubscribeTiffin } from '../../../hooks/useTiffin';

export default function TiffinManageScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: subData, isLoading } = useTiffinSubscription();
  const cancelMut = useCancelTiffin();
  const subscribeMut = useSubscribeTiffin();

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];

  const handleCancel = async () => {
    await cancelMut.mutateAsync();
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
    router.replace('/(customer)/tiffin' as any);
    return null;
  }

  const currentSlots = (subData as any)?.slots_current_week || [];
  const nextSlots = (subData as any)?.slots_next_week || [];

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: 120 }}
      testID="tiffin-manage-screen"
    >
      <GourmeatScreenHeader title="Account settings" subtitle="Tiffin subscription" onBack={() => router.back()} />

      <SHCTiffinManageSettings
        cookName={kitchen?.cook?.display_name || 'Kitchen'}
        mealsPerWeek={sub.meals_per_week}
        mealsOptions={kitchen?.meals_per_week_options || [2, 3, 4]}
        collectionDayLabel={(kitchen?.collection_days || []).map((d: number) => TIFFIN_DAY_LABELS[d]).join(', ')}
        weeklyTotal={`S$${tiffinWeeklySubtotal(sub.meals_per_week).toFixed(2)} per week`}
        onChangeMeals={(n) => {
          if (sub.cook_id) subscribeMut.mutate({ cookId: sub.cook_id, mealsPerWeek: n as 2 | 3 | 4 });
        }}
        onManage={() => router.push('/(customer)/tiffin/planner' as any)}
        onCancel={handleCancel}
      />

      <View style={{ marginTop: shcSpacing.lg }}>
        <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.sm }}>
          This week
        </Text>
        {currentSlots.map((slot: any) => {
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
        })}
        {nextSlots.length > 0 ? (
          <>
            <Text style={{ fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginVertical: shcSpacing.sm }}>
              Next week
            </Text>
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
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
});