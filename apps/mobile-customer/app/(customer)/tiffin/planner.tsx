import React, { useState, useMemo } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SHCTiffinPlannerScreen, gourmeatColors, type TiffinPlanSlotDraft } from '@shc/ui';
import { useTiffinSubscription, useSaveTiffinPlan, useSaveTiffinNextWeek } from '../../../hooks/useTiffin';

export default function TiffinPlannerScreen() {
  const router = useRouter();
  const { mode } = useLocalSearchParams<{ mode?: string }>();
  const isNextWeek = mode === 'next-week';
  const { data: subData, isLoading } = useTiffinSubscription();
  const savePlan = useSaveTiffinPlan();
  const saveNextWeek = useSaveTiffinNextWeek();

  const sub = (subData as any)?.subscription;
  const kitchen = (subData as any)?.kitchen;
  const mealsPerWeek = sub?.meals_per_week || 3;
  const collectionDays: number[] = kitchen?.collection_days || [1, 2, 3, 4, 5];
  const defaultSlot = kitchen?.default_collection_slot || '18:00-19:00';

  const initialSlots: TiffinPlanSlotDraft[] = useMemo(() => {
    const source = isNextWeek
      ? (subData as any)?.slots_next_week
      : (subData as any)?.slots_current_week;
    return (source || []).map((s: any) => ({
      day_of_week: s.day_of_week,
      product_id: s.product_id,
      collection_slot: s.collection_slot || defaultSlot,
    }));
  }, [subData, isNextWeek, defaultSlot]);

  const [slots, setSlots] = useState<TiffinPlanSlotDraft[]>(initialSlots);
  const [editingDay, setEditingDay] = useState<number | null>(null);

  React.useEffect(() => {
    setSlots(initialSlots);
  }, [JSON.stringify(initialSlots)]);

  const dishes = (kitchen?.dishes || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    cuisine: d.cuisine,
  }));

  const handleSelectDay = (day: number) => {
    if (!collectionDays.includes(day)) return;
    if (slots.length >= mealsPerWeek && !slots.find((s) => s.day_of_week === day)) {
      return;
    }
    setEditingDay(day);
  };

  const handleSelectDish = (day: number, productId: string) => {
    setSlots((prev) => {
      const withoutDay = prev.filter((s) => s.day_of_week !== day);
      const next = [...withoutDay, { day_of_week: day, product_id: productId, collection_slot: defaultSlot }];
      if (next.length > mealsPerWeek) {
        return next.slice(-mealsPerWeek);
      }
      return next;
    });
    setEditingDay(null);
  };

  const handleSave = async () => {
    if (isNextWeek) {
      await saveNextWeek.mutateAsync(slots);
    } else {
      await savePlan.mutateAsync({ slots, as_recurring_template: true });
    }
    router.replace('/(customer)/tiffin/manage' as any);
  };

  if (isLoading || !sub) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <SHCTiffinPlannerScreen
      title={isNextWeek ? 'Plan next week' : 'Your weekly menu'}
      subtitle={
        isNextWeek
          ? 'Override just the coming week — your usual plan resumes after.'
          : 'Pick your repeating weekly meals. Same cycle every week until you change it.'
      }
      weekLabel={
        isNextWeek
          ? `Week of ${(subData as any)?.next_week || ''}`
          : `Week of ${(subData as any)?.current_week || ''}`
      }
      mealsPerWeek={mealsPerWeek}
      collectionDays={collectionDays}
      slots={slots}
      dishes={dishes}
      editingDay={editingDay}
      onSelectDay={handleSelectDay}
      onSelectDish={handleSelectDish}
      onClosePicker={() => setEditingDay(null)}
      onSave={handleSave}
      saveLabel={isNextWeek ? 'Save next week' : 'Save weekly plan'}
      saveTestID={isNextWeek ? 'tiffin-save-next-week-btn' : 'tiffin-save-plan-btn'}
      saving={savePlan.isPending || saveNextWeek.isPending}
      mode={isNextWeek ? 'next-week' : 'template'}
      testID="tiffin-planner-screen"
    />
  );
}

const styles = StyleSheet.create({
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: gourmeatColors.background },
});