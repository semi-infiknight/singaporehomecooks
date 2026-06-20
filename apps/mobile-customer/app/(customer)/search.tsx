import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCButton,
  SHCButtonText,
  SHCSearchBar,
  SHCFilterChipRow,
  SHCDishCard,
  SHCSearchResultsPanel,
  SHCMindSectionTitle,
  SHCIcon,
  type SHCDishCardData,
  shcColors,
  shcSpacing,
} from '@shc/ui';
import { getDishImageUrl, getOccasionImageUrl, productMatchesOccasion } from '@shc/utils';
import { useProducts, useAddToCart } from '../../hooks/useProducts';
import { useGuestAuthGate } from '../../hooks/useGuestAuthGate';
import { useDiscoverPrefs } from '../../hooks/useDiscoverPrefs';

export default function SearchScreen() {
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [cuisine, setCuisine] = useState('');
  const { halalOnly, maxCal, toggleHalalOnly, setMaxCal } = useDiscoverPrefs();
  const maxC = maxCal ?? 700;
  const router = useRouter();
  const { data: rawResults = [] } = useProducts('');
  const addMut = useAddToCart();
  const { requireAuth } = useGuestAuthGate();

  const results = React.useMemo(() => {
    let list = rawResults as any[];
    const ql = q.trim().toLowerCase();
    if (ql) {
      list = list.filter((p: any) => {
        const name = String(p.name || '').toLowerCase();
        const cook = String(p.cook_name || '').toLowerCase();
        const cuisineName = String(p.cuisine || '').toLowerCase();
        return name.includes(ql) || cook.includes(ql) || cuisineName.includes(ql) || String(p.id || '').toLowerCase().includes(ql);
      });
    }
    if (cuisine) list = list.filter((p: any) => String(p.cuisine || '').toLowerCase().includes(cuisine.toLowerCase()));
    if (occ) list = list.filter((p: any) => productMatchesOccasion(p.occasion_tags, occ));
    if (halalOnly) list = list.filter((p: any) => Boolean(p.halal));
    if (maxC != null) list = list.filter((p: any) => (p.calories as number || 999) <= maxC);
    return list;
  }, [rawResults, q, cuisine, occ, halalOnly, maxC]);

  const goProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const toDish = (p: any): SHCDishCardData => ({
    id: p.id,
    name: p.name,
    cook_name: p.cook_name,
    price: p.price,
    cuisine: p.cuisine,
    rating: p.rating || 4.8,
    image_url: getDishImageUrl({ id: p.id, cuisine: p.cuisine, name: p.name }),
  });

  const occasionChips = [
    { id: 'any', label: 'Any', imageUrl: getOccasionImageUrl(''), active: !occ },
    { id: 'raya', label: 'Hari Raya', imageUrl: getOccasionImageUrl('Hari Raya'), active: occ === 'Hari Raya' },
    { id: 'cny', label: 'CNY', imageUrl: getOccasionImageUrl('Chinese New Year'), active: occ === 'Chinese New Year' },
    { id: 'family', label: 'Family', imageUrl: getOccasionImageUrl('Family Gathering'), active: occ === 'Family Gathering' },
    { id: 'xmas', label: 'Christmas', imageUrl: getOccasionImageUrl('Christmas'), active: occ === 'Christmas' },
  ];

  const filterChips = [
    { id: 'halal', label: 'Halal', iconKey: 'leaf' as const, active: halalOnly, testID: 'halal-filter' },
    { id: 'peranakan', label: 'Peranakan', iconKey: 'restaurant' as const, active: cuisine === 'Peranakan' },
    { id: 'eurasian', label: 'Eurasian', iconKey: 'restaurant' as const, active: cuisine === 'Eurasian' },
    { id: 'light', label: 'Light (<500 cal)', iconKey: 'leaf' as const, active: maxCal === 500 },
    { id: 'moderate', label: '≤550 cal', iconKey: 'restaurant' as const, active: maxCal === 550 },
  ];

  const handleOccasion = (id: string) => {
    const map: Record<string, string> = {
      any: '',
      raya: 'Hari Raya',
      cny: 'Chinese New Year',
      family: 'Family Gathering',
      xmas: 'Christmas',
    };
    setOcc(map[id] ?? '');
  };

  const handleFilter = (id: string) => {
    if (id === 'halal') toggleHalalOnly();
    else if (id === 'peranakan') setCuisine(cuisine === 'Peranakan' ? '' : 'Peranakan');
    else if (id === 'eurasian') setCuisine(cuisine === 'Eurasian' ? '' : 'Eurasian');
    else if (id === 'light') setMaxCal(maxCal === 500 ? undefined : 500);
    else if (id === 'moderate') setMaxCal(maxCal === 550 ? undefined : 550);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 80 }]}
    >
      <View style={styles.header}>
        <SHCIcon name="search" size={24} color={shcColors.primary} active />
        <Text style={styles.title}>Advanced Search</Text>
      </View>

      <SHCSearchBar value={q} onChangeText={setQ} placeholder="Search dishes, cooks…" testID="search-input" />

      <SHCMindSectionTitle>Occasion</SHCMindSectionTitle>
      <SHCFilterChipRow chips={occasionChips} onChipPress={handleOccasion} testID="search-occasion-chips" />

      <SHCMindSectionTitle>Filters</SHCMindSectionTitle>
      <SHCFilterChipRow chips={filterChips} onChipPress={handleFilter} testID="search-filter-chips" />
      <Text style={styles.resultsTitle}>{results.length} results</Text>
      {q.trim() ? (
        <SHCSearchResultsPanel
          query={q}
          dishes={results.map(toDish)}
          onDishPress={goProduct}
          onAddPress={(id) => {
            if (!requireAuth('Browse freely — sign in to add dishes to your cart.')) return;
            addMut.mutate({ productId: id, qty: 1 });
          }}
          testID="search-results-panel"
        />
      ) : (
        <View style={styles.grid}>
          {results.map((p: any) => (
            <View key={p.id} style={styles.gridItem}>
              <SHCDishCard dish={toDish(p)} onPress={() => goProduct(p.id)} testID={`search-dish-${p.id}`} />
            </View>
          ))}
        </View>
      )}
      <SHCButton onPress={() => router.back()} style={{ marginTop: shcSpacing.md }}>
        <SHCButtonText>Back</SHCButtonText>
      </SHCButton>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: shcColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  header: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  title: { fontSize: 24, fontWeight: '900', color: shcColors.text },
  resultsTitle: { fontSize: 13, fontWeight: '700', color: shcColors.textLight, marginTop: shcSpacing.sm, marginBottom: shcSpacing.sm },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: shcSpacing.sm },
  gridItem: { width: '48%' },
});