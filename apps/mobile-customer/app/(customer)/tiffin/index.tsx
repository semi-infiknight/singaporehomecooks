import React, { useMemo, useState } from 'react';
import {
  View,
  ScrollView,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCTiffinHeroBanner,
  SHCTiffinKitchenCard,
  SHCTiffinEmptyState,
  SHCTiffinFilterChips,
  SHCTiffinCategoryRow,
  SHCSkeletonKitchenList,
  gourmeatColors,
  shcSpacing,
  GourmeatPrimaryButton,
  tiffinPricePerServing,
} from '@shc/ui';
import { kitchenDishPriceDollars, kitchenOpenStatus } from '@shc/utils';
import { useTiffinKitchens, useTiffinSubscription } from '../../../hooks/useTiffin';
import { useCustomerLocation } from '../../../hooks/useCustomerLocation';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'nearest', label: 'Nearest' },
  { id: 'halal', label: 'Halal' },
  { id: 'popular', label: 'Top rated' },
];

const CATEGORIES = [
  { id: 'all', label: 'All', emoji: '🏠' },
  { id: 'Peranakan', label: 'Peranakan', emoji: '🦞' },
  { id: 'Malay', label: 'Malay', emoji: '🍛' },
  { id: 'Indian', label: 'Indian', emoji: '🫓' },
  { id: 'Chinese', label: 'Chinese', emoji: '🥟' },
  { id: 'Eurasian', label: 'Eurasian', emoji: '🍲' },
];

export default function TiffinBrowseScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: kitchens = [], isLoading } = useTiffinKitchens();
  const { data: subData } = useTiffinSubscription();
  const { active: location, locationLabel } = useCustomerLocation();
  const hasSub = Boolean((subData as any)?.subscription);

  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [category, setCategory] = useState('all');

  const filtered = useMemo(() => {
    let list = [...(kitchens as any[])];
    const q = query.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (k) =>
          (k.cook?.display_name || '').toLowerCase().includes(q) ||
          (k.tagline || '').toLowerCase().includes(q) ||
          (k.cook?.area || '').toLowerCase().includes(q) ||
          (k.dishes || []).some((d: any) => (d.name || d.cuisine || '').toLowerCase().includes(q))
      );
    }
    if (category !== 'all') {
      list = list.filter((k) =>
        (k.dishes || []).some((d: any) => (d.cuisine || '').toLowerCase() === category.toLowerCase())
      );
    }
    if (filter === 'popular') {
      list.sort((a, b) => (b.subscriber_count || 0) - (a.subscriber_count || 0));
    }
    if (filter === 'nearest' && location) {
      // soft preference: area string match first
      list.sort((a, b) => {
        const aMatch = (a.cook?.area || '').includes(locationLabel || '') ? 0 : 1;
        const bMatch = (b.cook?.area || '').includes(locationLabel || '') ? 0 : 1;
        return aMatch - bMatch;
      });
    }
    return list;
  }, [kitchens, query, filter, category, location, locationLabel]);

  /** Browse-first (Jakob’s Law): open kitchen detail without login; subscribe still auth-gated on kitchen page. */
  const openKitchen = (cookId: string) => {
    router.push(`/(customer)/tiffin/kitchen/${cookId}` as any);
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={{
        paddingTop: insets.top + shcSpacing.sm,
        paddingBottom: 120,
        paddingHorizontal: shcSpacing.md,
      }}
      testID="tiffin-browse-screen"
      keyboardShouldPersistTaps="handled"
    >
      {/* Location + back — HomelyEats header chrome */}
      <View style={styles.topBar}>
        <Pressable onPress={() => router.back()} hitSlop={12} testID="tiffin-browse-back">
          <Text style={styles.backChevron}>‹</Text>
        </Pressable>
        <Pressable
          style={styles.locationPill}
          onPress={() => router.push('/(customer)/location' as any)}
          testID="tiffin-location-chip"
        >
          <Text style={styles.locPin}>📍</Text>
          <Text style={styles.locText} numberOfLines={1}>
            {locationLabel || 'Set collection location'}
          </Text>
          <Text style={styles.locCaret}>▾</Text>
        </Pressable>
      </View>

      <Text style={styles.pageTitle} testID="tiffin-browse-header">
        {filtered.length} kitchen{filtered.length === 1 ? '' : 's'} near you
      </Text>

      <SHCTiffinHeroBanner />

      {hasSub ? (
        <View style={styles.activeBanner}>
          <Text style={styles.activeText}>You have an active tiffin plan</Text>
          <GourmeatPrimaryButton
            label="Manage subscription"
            onPress={() => router.push('/(customer)/tiffin/manage' as any)}
            testID="tiffin-go-manage-btn"
          />
        </View>
      ) : null}

      {/* Search — HomelyEats search bar */}
      <View style={styles.searchWrap}>
        <Text style={styles.searchIcon}>⌕</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search kitchen, meal or cuisine"
          placeholderTextColor={gourmeatColors.textMuted}
          value={query}
          onChangeText={setQuery}
          testID="tiffin-search-input"
        />
      </View>

      <SHCTiffinCategoryRow
        categories={CATEGORIES}
        activeId={category}
        onSelect={setCategory}
      />

      <SHCTiffinFilterChips chips={FILTERS} activeId={filter} onSelect={setFilter} />

      {/* Offer strip */}
      <View style={styles.offerCard} testID="tiffin-offer-card">
        <Text style={styles.offerTitle}>First week on us ✨</Text>
        <Text style={styles.offerSub}>New tiffin subscribers — flexible 2–4 meals/week from one kitchen.</Text>
      </View>

      {isLoading ? (
        <SHCSkeletonKitchenList count={4} />
      ) : filtered.length === 0 ? (
        <SHCTiffinEmptyState
          title="No kitchens match"
          subtitle="Try another cuisine filter or clear search."
          actionLabel="Clear filters"
          onAction={() => {
            setQuery('');
            setFilter('all');
            setCategory('all');
          }}
        />
      ) : (
        filtered.map((k: any) => {
          // price is SGD dollars (kitchenDishPriceDollars) — never p>50/100
          const prices = (k.dishes || [])
            .map((d: any) => kitchenDishPriceDollars(d))
            .filter((n: number | null): n is number => n != null && n > 0);
          const from = prices.length > 0 ? Math.min(...prices) : tiffinPricePerServing(3);
          const to = prices.length > 0 ? Math.max(...prices) : tiffinPricePerServing(2);
          const open = kitchenOpenStatus({
            display_name: k.cook?.display_name,
            area: k.cook?.area,
            status: k.enabled === false ? 'paused' : 'active',
          });
          return (
            <SHCTiffinKitchenCard
              key={k.cook_id}
              cookId={k.cook_id}
              cookName={k.cook?.display_name || 'Home kitchen'}
              area={k.cook?.area}
              tagline={k.tagline || 'Weekly home-cooked meals'}
              mealsOptions={k.meals_per_week_options}
              dishCount={(k.dishes || []).length}
              subscriberCount={k.subscriber_count ?? 0}
              priceFrom={Math.round(from)}
              priceTo={Math.round(to)}
              rating={4.8}
              isOpen={open.isOpen}
              closesAt={open.detail}
              coverUri={k.dishes?.[0]?.image_url}
              onPress={() => openKitchen(k.cook_id)}
            />
          );
        })
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: shcSpacing.sm },
  backChevron: { fontSize: 32, fontWeight: '300', color: gourmeatColors.text, lineHeight: 36, width: 28 },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
  },
  locPin: { fontSize: 14, marginRight: 4 },
  locText: { flex: 1, fontSize: 13, fontWeight: '700', color: gourmeatColors.text },
  locCaret: { fontSize: 12, color: gourmeatColors.textLight },
  pageTitle: { fontSize: 22, fontWeight: '800', color: gourmeatColors.text, marginBottom: shcSpacing.md },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    paddingHorizontal: 12,
    marginBottom: shcSpacing.md,
    height: 48,
  },
  searchIcon: { fontSize: 18, color: gourmeatColors.textLight, marginRight: 8 },
  searchInput: { flex: 1, fontSize: 15, color: gourmeatColors.text, paddingVertical: 8 },
  offerCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
  },
  offerTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  offerSub: { fontSize: 12, color: 'rgba(255,255,255,0.85)', marginTop: 4, lineHeight: 17 },
  activeBanner: {
    backgroundColor: gourmeatColors.surface,
    borderRadius: 12,
    padding: shcSpacing.md,
    marginBottom: shcSpacing.md,
    gap: shcSpacing.sm,
  },
  activeText: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
});
