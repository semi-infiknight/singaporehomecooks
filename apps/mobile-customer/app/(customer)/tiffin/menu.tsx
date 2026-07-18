import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinMenuListItem,
  gourmeatColors,
  shcSpacing,
  SHCSkeletonList,
  contentPadSafe,
} from '@shc/ui';
import { useTiffinKitchen } from '../../../hooks/useTiffin';

const CUISINE_FILTERS = ['All', 'Peranakan', 'Chinese', 'Malay', 'Indian', 'Western'];

export default function TiffinMenuScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const [filter, setFilter] = useState('All');

  const dishes = useMemo(() => {
    const all = (kitchen?.dishes || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      cuisine: d.cuisine,
      description: d.description || d.heritage_note,
    }));
    if (filter === 'All') return all;
    return all.filter((d: { cuisine?: string }) => String(d.cuisine || '').toLowerCase().includes(filter.toLowerCase()));
  }, [kitchen, filter]);

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={4} rowHeight={64} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{ paddingTop: insets.top + shcSpacing.md, paddingHorizontal: shcSpacing.md, paddingBottom: contentPadSafe(insets.bottom) }}
      testID="tiffin-menu-screen"
    >
      <GourmeatScreenHeader
        title={kitchen?.cook?.display_name || 'Menu'}
        subtitle="Culinary inspiration"
        onBack={() => router.back()}
      />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: shcSpacing.md }}>
        {CUISINE_FILTERS.map((c) => (
          <Text
            key={c}
            onPress={() => setFilter(c)}
            style={[styles.filterChip, filter === c && styles.filterChipActive]}
          >
            {c}
          </Text>
        ))}
      </ScrollView>
      {dishes.map((d: { id: string; name: string; price?: number; cuisine?: string; description?: string }) => (
        <SHCTiffinMenuListItem
          key={d.id}
          dish={d}
          subtitle={d.description || d.cuisine}
          onPress={() => router.push(`/(customer)/product/${d.id}` as any)}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: gourmeatColors.surfaceAlt,
    marginRight: 8,
    fontSize: 12,
    fontWeight: '600',
    color: gourmeatColors.textLight,
    overflow: 'hidden',
  },
  filterChipActive: { backgroundColor: gourmeatColors.primaryLight, color: gourmeatColors.primary },
});