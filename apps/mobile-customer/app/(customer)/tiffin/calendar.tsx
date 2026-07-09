import React, { useMemo, useState } from 'react';
import { View, ScrollView, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinCalendarStrip,
  SHCTiffinOrderStatusCard,
  SHCTiffinEmptyState,
  gourmeatColors,
  shcSpacing,
  TIFFIN_DAY_LABELS,
} from '@shc/ui';
import { addDaysIso, weekStartMonday } from '@shc/business-rules';
import { useTiffinMealOrders, useTiffinSubscription, useSkipTiffinMeal } from '../../../hooks/useTiffin';

export default function TiffinCalendarScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const from = weekStartMonday();
  const to = addDaysIso(from, 20);
  const { data: subData } = useTiffinSubscription();
  const { data: mealData, isLoading } = useTiffinMealOrders(from, to);
  const skipMut = useSkipTiffinMeal();

  const meals = ((mealData as any)?.meals || []) as Array<{
    collection_date: string;
    status: string;
    product_id: string;
    collection_slot?: string;
    customizable?: boolean;
    day_of_week: number;
  }>;
  const kitchen = (subData as any)?.kitchen;
  const dishes = kitchen?.dishes || [];
  const [selected, setSelected] = useState(meals[0]?.collection_date || from);

  const days = useMemo(() => {
    const out: { date: string; label: string; hasMeal?: boolean }[] = [];
    let c = from;
    while (c <= to) {
      const d = new Date(`${c}T12:00:00.000Z`);
      out.push({
        date: c,
        label: TIFFIN_DAY_LABELS[d.getUTCDay()],
        hasMeal: meals.some((m) => m.collection_date === c),
      });
      c = addDaysIso(c, 1);
    }
    return out;
  }, [from, to, meals]);

  const dayMeals = meals.filter((m) => m.collection_date === selected);

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.md,
        paddingHorizontal: shcSpacing.md,
        paddingBottom: 120,
      }}
      testID="tiffin-calendar-screen"
    >
      <GourmeatScreenHeader
        title="My tiffin meals"
        subtitle="HomelyEats-style calendar — each day is one collection"
        onBack={() => router.back()}
      />

      <SHCTiffinCalendarStrip days={days} selectedDate={selected} onSelect={setSelected} />

      {dayMeals.length === 0 ? (
        <SHCTiffinEmptyState
          title="No meal this day"
          subtitle="Your weekly plan does not include this collection day."
        />
      ) : (
        dayMeals.map((m) => {
          const dish = dishes.find((d: any) => d.id === m.product_id);
          return (
            <SHCTiffinOrderStatusCard
              key={m.collection_date + m.product_id}
              cookName={kitchen?.cook?.display_name || 'Kitchen'}
              planTitle={dish?.name || m.product_id}
              status={m.status as any}
              timeslot={m.collection_slot}
              menuLines={dish?.name ? [dish.name] : undefined}
              customizable={m.customizable}
              onManage={() => router.push('/(customer)/tiffin/manage' as any)}
              onSkip={
                m.status === 'scheduled'
                  ? () =>
                      skipMut.mutate({
                        collectionDate: m.collection_date,
                        collectionSlot: m.collection_slot,
                      })
                  : undefined
              }
            />
          );
        })
      )}

      {skipMut.isError ? (
        <Text style={styles.err}>{String((skipMut.error as any)?.message || 'Skip failed')}</Text>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  err: { color: '#C62828', marginTop: shcSpacing.md, fontWeight: '600' },
});
