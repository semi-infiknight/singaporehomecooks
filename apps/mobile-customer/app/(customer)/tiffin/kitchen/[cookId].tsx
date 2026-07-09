import React, { useState } from 'react';
import { View, ScrollView, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinKitchenHero,
  SHCTiffinMealsPicker,
  SHCTiffinOrderSummary,
  SHCTiffinMenuListItem,
  GourmeatPrimaryButton,
  gourmeatColors,
  shcSpacing,
} from '@shc/ui';
import { useTiffinKitchen, useSubscribeTiffin } from '../../../../hooks/useTiffin';

export default function TiffinKitchenScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const subscribeMut = useSubscribeTiffin();

  const mealsOptions: number[] = kitchen?.meals_per_week_options || [2, 3, 4];
  const [mealsPerWeek, setMealsPerWeek] = useState<number>(mealsOptions[1] || 3);

  React.useEffect(() => {
    if (kitchen?.meals_per_week_options?.length) {
      setMealsPerWeek(kitchen.meals_per_week_options[1] || kitchen.meals_per_week_options[0]);
    }
  }, [kitchen?.meals_per_week_options]);

  const dishes = (kitchen?.dishes || []).map((d: any) => ({
    id: d.id,
    name: d.name,
    price: d.price,
    cuisine: d.cuisine,
  }));

  const handleSubscribe = async () => {
    if (!cookId) return;
    await subscribeMut.mutateAsync({
      cookId,
      mealsPerWeek: mealsPerWeek as 2 | 3 | 4,
    });
    router.replace('/(customer)/tiffin/confirm' as any);
  };

  if (isLoading) {
    return (
      <View style={[styles.screen, styles.centered]}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  if (!kitchen) {
    return (
      <View style={[styles.screen, styles.centered, { padding: shcSpacing.lg }]}>
        <Text style={styles.empty}>This kitchen is not available for tiffin.</Text>
        <GourmeatPrimaryButton label="Back" onPress={() => router.back()} testID="tiffin-kitchen-back" />
      </View>
    );
  }

  return (
    <View style={styles.screen} testID="tiffin-kitchen-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.md,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <GourmeatScreenHeader title="Subscribe" subtitle="STEP 1 · Choose your weekly plan" onBack={() => router.back()} />

        <SHCTiffinKitchenHero
          cookName={kitchen.cook?.display_name || 'Kitchen'}
          tagline={kitchen.tagline || `${kitchen.cook?.area || 'Singapore'} · home-cooked tiffin`}
        />

        <SHCTiffinMealsPicker options={mealsOptions} selected={mealsPerWeek} onSelect={setMealsPerWeek} />
        <SHCTiffinOrderSummary mealsPerWeek={mealsPerWeek} />

        <Text style={styles.sectionTitle}>Full menu</Text>
        <Text style={styles.sectionHint}>Select from these dishes when you build your weekly plan.</Text>
        {dishes.map((d: { id: string; name: string; price?: number; cuisine?: string }) => (
          <SHCTiffinMenuListItem
            key={d.id}
            dish={d}
            subtitle={d.cuisine ? `${d.cuisine} heritage recipe` : 'Home-cooked'}
            onPress={() => router.push(`/(customer)/tiffin/menu?cookId=${cookId}` as any)}
          />
        ))}

        <Text style={styles.collectionHint}>
          Collection days: {(kitchen.collection_days || []).map((d: number) => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][d]).join(', ')}
        </Text>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
        <GourmeatPrimaryButton
          label="Subscribe & select meals"
          onPress={handleSubscribe}
          loading={subscribeMut.isPending}
          testID="tiffin-subscribe-btn"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { alignItems: 'center', justifyContent: 'center' },
  empty: { fontSize: 15, color: gourmeatColors.textLight, marginBottom: shcSpacing.md, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text, marginTop: shcSpacing.md },
  sectionHint: { fontSize: 12, color: gourmeatColors.textLight, marginTop: 4 },
  collectionHint: { fontSize: 12, color: gourmeatColors.primary, fontWeight: '600', marginTop: shcSpacing.md },
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