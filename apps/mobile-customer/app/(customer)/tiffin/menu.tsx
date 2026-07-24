import React, { useMemo, useState } from 'react';
import { View, ScrollView, Text, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  GourmeatScreenHeader,
  SHCTiffinMenuListItem,
  SHCRecipeStoryPreview,
  gourmeatColors,
  shcSpacing,
  SHCSkeletonList,
  contentPadSafe,
} from '@shc/ui';
import { useTiffinKitchen } from '../../../hooks/useTiffin';
import { VirtualRowFlashList } from '../../../components/VirtualLists';

const CUISINE_FILTERS = ['All', 'Peranakan', 'Chinese', 'Malay', 'Indian', 'Western'];

export default function TiffinMenuScreen() {
  const { cookId } = useLocalSearchParams<{ cookId: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: kitchen, isLoading } = useTiffinKitchen(cookId || '');
  const [filter, setFilter] = useState('All');
  const [expandedRecipeId, setExpandedRecipeId] = useState<string | null>(null);
  const cookName = kitchen?.cook?.display_name || 'Kitchen';

  const dishes = useMemo(() => {
    const all = (kitchen?.dishes || []).map((d: any) => ({
      id: d.id,
      name: d.name,
      price: d.price,
      cuisine: d.cuisine,
      description: d.description,
      ingredients: d.ingredients,
      min_qty: d.min_qty,
      image_url: d.image_url,
    }));
    if (filter === 'All') return all;
    return all.filter((d: { cuisine?: string }) => String(d.cuisine || '').toLowerCase().includes(filter.toLowerCase()));
  }, [kitchen, filter]);

  const ListHeader = (
    <>
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
    </>
  );

  if (isLoading) {
    return (
      <View style={[styles.centered, { paddingHorizontal: shcSpacing.md }]}>
        <SHCSkeletonList count={4} rowHeight={64} />
      </View>
    );
  }

  return (
    <View
      style={[styles.screen, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadSafe(insets.bottom) }]}
      testID="tiffin-menu-screen"
    >
      <VirtualRowFlashList
        data={dishes}
        keyExtractor={(d) => d.id}
        ListHeaderComponent={ListHeader}
        contentContainerStyle={{ paddingHorizontal: shcSpacing.md }}
        testID="tiffin-menu-list"
        renderItem={(d: {
          id: string;
          name: string;
          price?: number;
          cuisine?: string;
          description?: string;
          ingredients?: Array<{ name: string; quantity?: number; unit?: string }>;
          min_qty?: number;
          image_url?: string;
        }) => (
          <View style={{ marginBottom: shcSpacing.sm }} testID={`tiffin-menu-wrap-${d.id}`}>
            <SHCTiffinMenuListItem
              dish={d}
              subtitle={d.cuisine || 'Home-cooked'}
              onPress={() => router.push(`/(customer)/product/${d.id}` as any)}
              testID={`tiffin-menu-item-${d.id}`}
            />
            <SHCRecipeStoryPreview
              dish={d}
              cookName={cookName}
              expanded={expandedRecipeId === d.id}
              onToggle={() => setExpandedRecipeId((cur) => (cur === d.id ? null : d.id))}
              onOpenDish={() => router.push(`/(customer)/product/${d.id}` as any)}
              testID={`tiffin-menu-recipe-${d.id}`}
            />
          </View>
        )}
      />
    </View>
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
