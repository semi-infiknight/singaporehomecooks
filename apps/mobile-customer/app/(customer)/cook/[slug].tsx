/**
 * Kitchen page — HomelyEats IA: hero, tabs (Menu · About · Hours · Reviews).
 */
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Image,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCookStoreHero,
  GourmeatPrimaryButton,
  SHCFoodImage,
  gourmeatColors,
  shcSpacing,
  shcRadii,
} from '@shc/ui';
import {
  getDishImageUrl,
  getCookAvatarUrl,
  getCookKitchenHeroUrl,
  BENTO_ACTION_IMAGES,
  scopeProductsByKitchen,
  kitchenOpenStatus,
  kitchenTagList,
  kitchenRatingSummary,
  kitchenRatingBuckets,
  kitchenDemoReviews,
  sortKitchenReviews,
  kitchenCollectionHours,
  kitchenAboutPoints,
  kitchenMenuSections,
  kitchenDishPriceLabel,
  type KitchenReviewSort,
} from '@shc/utils';
import { useCook, useDiscovery, useAddToCart } from '../../../hooks/useProducts';
import { useGuestAuthGate } from '../../../hooks/useGuestAuthGate';
import { getHeritageArchive } from '../../../lib/api-client';

type TabId = 'menu' | 'about' | 'hours' | 'reviews';

const TABS: { id: TabId; label: string }[] = [
  { id: 'menu', label: 'Menu' },
  { id: 'about', label: 'About' },
  { id: 'hours', label: 'Hours' },
  { id: 'reviews', label: 'Reviews' },
];

export default function KitchenPage() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { data: cook, isLoading } = useCook(slug || '');
  const { data: allProducts = [] } = useDiscovery('', {});
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const [archive, setArchive] = useState<any[]>([]);
  const [tab, setTab] = useState<TabId>('menu');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');

  const listings = useMemo(
    () =>
      scopeProductsByKitchen(allProducts as Record<string, unknown>[], {
        id: cook?.id,
        slug: slug || undefined,
        display_name: cook?.display_name,
        name: cook?.name,
      }),
    [allProducts, cook, slug]
  );

  const menuSections = useMemo(() => kitchenMenuSections(listings), [listings]);

  useEffect(() => {
    if (cook?.id) {
      getHeritageArchive(cook.id).then(setArchive).catch(() => setArchive([]));
    }
  }, [cook?.id]);

  useEffect(() => {
    if (menuSections.length) {
      setOpenSections((prev) => {
        const next = { ...prev };
        menuSections.forEach((s, i) => {
          if (next[s.id] === undefined) next[s.id] = i === 0;
        });
        return next;
      });
    }
  }, [menuSections]);

  const handleAdd = useCallback(
    (productId: string) => {
      if (!requireAuth('Sign in to add dishes to your cart.')) return;
      addMut.mutate({ productId, qty: 1 });
    },
    [requireAuth, addMut]
  );

  const ratingSum = useMemo(() => kitchenRatingSummary(cook as any), [cook]);
  const buckets = useMemo(() => kitchenRatingBuckets(ratingSum.rating), [ratingSum.rating]);
  const reviews = useMemo(
    () => sortKitchenReviews(kitchenDemoReviews(String(cook?.id || slug || 'k')), reviewSort),
    [cook?.id, slug, reviewSort]
  );
  const hours = useMemo(
    () => kitchenCollectionHours({ collection_instructions: cook?.collection_instructions }),
    [cook?.collection_instructions]
  );
  const aboutPoints = useMemo(() => kitchenAboutPoints(cook as any), [cook]);

  if (isLoading || !cook) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]} testID="kitchen-page-loading">
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.lg} />
        <Text style={styles.loadingText}>{isLoading ? 'Loading kitchen…' : 'Kitchen not found'}</Text>
        {!isLoading && (
          <GourmeatPrimaryButton label="Back" onPress={() => router.back()} testID="kitchen-missing-back" />
        )}
      </View>
    );
  }

  const open = kitchenOpenStatus(cook as any);
  const tags = kitchenTagList({
    ...(cook as any),
    cuisine: cook.cuisine || listings[0]?.cuisine,
  });

  return (
    <View style={styles.screen} testID="kitchen-page-screen">
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + shcSpacing.sm,
          paddingHorizontal: shcSpacing.md,
          paddingBottom: 120,
        }}
      >
        <View style={styles.topBar}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} testID="kitchen-back-btn">
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <Text style={styles.topTitle} numberOfLines={1} testID="kitchen-page-title">
            {cook.display_name}
          </Text>
          <View style={styles.backBtn} />
        </View>

        <SHCCookStoreHero
          name={cook.display_name}
          area={cook.area}
          rating={ratingSum.rating}
          orders={cook.orders}
          avatarUri={getCookAvatarUrl(cook.id, cook.display_name)}
          isOpen={open.isOpen}
          openDetail={open.detail}
          tags={tags}
          story={cook.story}
          testID="kitchen-page-hero"
        />
        <Pressable onPress={() => setTab('reviews')} testID="kitchen-rating-pill">
          <Text style={styles.ratingLink}>★ {ratingSum.label} · See reviews</Text>
        </Pressable>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabRow}>
          {TABS.map((t) => (
            <Pressable
              key={t.id}
              onPress={() => setTab(t.id)}
              style={[styles.tabChip, tab === t.id && styles.tabChipOn]}
              testID={`kitchen-tab-${t.id}`}
            >
              <Text style={[styles.tabChipText, tab === t.id && styles.tabChipTextOn]}>{t.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {tab === 'menu' && (
          <View testID="kitchen-tab-panel-menu">
            {menuSections.length === 0 ? (
              <Text style={styles.empty} testID="kitchen-menu-empty">
                No dishes listed for this kitchen yet.
              </Text>
            ) : (
              menuSections.map((section) => {
                const isOpen = openSections[section.id] !== false;
                return (
                  <View key={section.id} style={styles.sectionCard} testID={`kitchen-menu-section-${section.id}`}>
                    <Pressable
                      onPress={() => setOpenSections((s) => ({ ...s, [section.id]: !isOpen }))}
                      style={styles.sectionHead}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={styles.sectionTitle}>{section.title}</Text>
                        <Text style={styles.sectionSub}>{section.subtitle}</Text>
                      </View>
                      <Text style={styles.chevron}>{isOpen ? '⌃' : '⌄'}</Text>
                    </Pressable>
                    {isOpen &&
                      section.dishes.map((d) => (
                        <View key={String(d.id)} style={styles.dishRow}>
                          <Image
                            source={{
                              uri: getDishImageUrl({
                                id: String(d.id),
                                cuisine: d.cuisine ? String(d.cuisine) : undefined,
                                name: String(d.name),
                              }),
                            }}
                            style={styles.dishThumb}
                          />
                          <View style={{ flex: 1 }}>
                            <Text style={styles.dishName} numberOfLines={1}>
                              {String(d.name)}
                            </Text>
                            <Text style={styles.dishMeta} numberOfLines={1}>
                              {kitchenDishPriceLabel(d) || ''}/portion
                            </Text>
                          </View>
                          <Pressable style={styles.addBtn} onPress={() => handleAdd(String(d.id))}>
                            <Text style={styles.addBtnText}>+ Add</Text>
                          </Pressable>
                        </View>
                      ))}
                  </View>
                );
              })
            )}
            <View style={styles.planCard} testID="kitchen-tiffin-cta-card">
              <Text style={styles.planTitle}>Weekly tiffin from this kitchen</Text>
              <GourmeatPrimaryButton
                label="View tiffin plans"
                onPress={() => router.push(`/(customer)/tiffin/kitchen/${cook.id}` as any)}
                testID="kitchen-tiffin-cta"
              />
            </View>
          </View>
        )}

        {tab === 'about' && (
          <View testID="kitchen-tab-panel-about">
            <SHCFoodImage
              uri={getCookKitchenHeroUrl(cook.id || cook.display_name)}
              height={160}
              rounded={shcRadii.lg}
            />
            {aboutPoints.map((p) => (
              <Text key={p} style={styles.aboutPoint}>
                ✓ {p}
              </Text>
            ))}
            <View style={styles.infoCard} testID="kitchen-about-location">
              <Text style={styles.infoLabel}>Location</Text>
              <Text style={styles.infoBody}>{cook.area || 'Singapore'}</Text>
              <Text style={styles.infoMuted}>
                {cook.collection_address || 'HDB collection after order accept'}
              </Text>
            </View>
            <View style={styles.infoCard} testID="kitchen-about-chef">
              <Text style={styles.infoLabel}>About the cook</Text>
              <Text style={styles.infoBody}>{cook.display_name}</Text>
              <Text style={styles.infoMuted}>
                {cook.story || 'Home cook sharing heritage recipes from an HDB kitchen.'}
              </Text>
            </View>
            {archive.map((a: any, i: number) => (
              <View key={i} style={styles.infoCard}>
                <Text style={styles.infoBody}>{a.title}</Text>
                <Text style={styles.infoMuted} numberOfLines={4}>
                  {a.story}
                </Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'hours' && (
          <View testID="kitchen-tab-panel-hours">
            <Text style={styles.hoursIntro}>Collection timings (HDB — not door delivery)</Text>
            {hours.map((slot) => (
              <View key={slot.id} style={styles.infoCard} testID={`kitchen-hour-${slot.id}`}>
                <Text style={styles.infoBody}>{slot.label}</Text>
                <Text style={styles.infoMuted}>{slot.window}</Text>
              </View>
            ))}
          </View>
        )}

        {tab === 'reviews' && (
          <View testID="kitchen-tab-panel-reviews">
            <View style={styles.ratingCard} testID="kitchen-rating-breakdown">
              <Text style={styles.ratingBig}>{ratingSum.rating.toFixed(1)}</Text>
              <Text style={styles.ratingSub}>/ 5.0 · {ratingSum.reviewCount} reviews</Text>
              {buckets.map((b) => (
                <View key={b.key} style={styles.barRow}>
                  <Text style={styles.barLabel}>{b.label}</Text>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${Math.round(b.share * 100)}%` }]} />
                  </View>
                </View>
              ))}
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {(['recent', 'highest', 'lowest', 'photos'] as KitchenReviewSort[]).map((s) => (
                <Pressable
                  key={s}
                  onPress={() => setReviewSort(s)}
                  style={[styles.sortChip, reviewSort === s && styles.sortChipOn]}
                >
                  <Text style={[styles.sortChipText, reviewSort === s && styles.sortChipTextOn]}>{s}</Text>
                </Pressable>
              ))}
            </ScrollView>
            {reviews.map((r) => (
              <View key={r.id} style={styles.infoCard} testID={`kitchen-review-${r.id}`}>
                <Text style={styles.infoBody}>{r.author}</Text>
                <Text style={styles.stars}>{'★'.repeat(r.rating)}</Text>
                <Text style={styles.infoMuted}>{r.body}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {listings.length > 0 && tab === 'menu' && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]}>
          <GourmeatPrimaryButton
            label="View cart"
            onPress={() => router.push('/(customer)/cart' as any)}
            testID="kitchen-order-cta"
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: shcSpacing.xl, gap: shcSpacing.sm },
  loadingText: { fontWeight: '600', color: gourmeatColors.textLight },
  topBar: { flexDirection: 'row', alignItems: 'center', marginBottom: shcSpacing.sm },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  backText: { fontSize: 32, fontWeight: '300', color: gourmeatColors.text, lineHeight: 36 },
  topTitle: { flex: 1, textAlign: 'center', fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  ratingLink: { fontSize: 13, fontWeight: '800', color: gourmeatColors.primary, marginBottom: shcSpacing.sm },
  tabRow: { marginBottom: shcSpacing.md, flexGrow: 0 },
  tabChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    marginRight: 8,
    backgroundColor: gourmeatColors.surface,
  },
  tabChipOn: { borderColor: gourmeatColors.primary, backgroundColor: '#FFF0EB' },
  tabChipText: { fontSize: 13, fontWeight: '700', color: gourmeatColors.textLight },
  tabChipTextOn: { color: gourmeatColors.primary },
  sectionCard: {
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 14,
    backgroundColor: gourmeatColors.surface,
    marginBottom: shcSpacing.sm,
    overflow: 'hidden',
  },
  sectionHead: { flexDirection: 'row', alignItems: 'center', padding: shcSpacing.md },
  sectionTitle: { fontSize: 16, fontWeight: '800', color: gourmeatColors.text },
  sectionSub: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 },
  chevron: { fontSize: 18, color: gourmeatColors.textLight },
  dishRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: shcSpacing.md,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: gourmeatColors.border,
  },
  dishThumb: { width: 52, height: 52, borderRadius: 10 },
  dishName: { fontSize: 14, fontWeight: '700', color: gourmeatColors.text },
  dishMeta: { fontSize: 12, fontWeight: '700', color: gourmeatColors.primary, marginTop: 2 },
  addBtn: {
    backgroundColor: gourmeatColors.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  addBtnText: { color: '#fff', fontWeight: '800', fontSize: 13 },
  planCard: {
    backgroundColor: '#1E3A5F',
    borderRadius: 14,
    padding: shcSpacing.md,
    marginTop: shcSpacing.sm,
    gap: 10,
  },
  planTitle: { fontSize: 16, fontWeight: '800', color: '#fff' },
  empty: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight },
  aboutPoint: { fontSize: 14, fontWeight: '600', color: gourmeatColors.text, marginTop: 8 },
  infoCard: {
    marginTop: shcSpacing.sm,
    padding: shcSpacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
  },
  infoLabel: { fontSize: 11, fontWeight: '800', color: gourmeatColors.textLight, textTransform: 'uppercase' },
  infoBody: { fontSize: 15, fontWeight: '800', color: gourmeatColors.text, marginTop: 4 },
  infoMuted: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 4, lineHeight: 18 },
  hoursIntro: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight, marginBottom: 4 },
  ratingCard: {
    padding: shcSpacing.md,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    backgroundColor: gourmeatColors.surface,
    marginBottom: shcSpacing.sm,
  },
  ratingBig: { fontSize: 36, fontWeight: '900', color: gourmeatColors.text },
  ratingSub: { fontSize: 12, fontWeight: '700', color: gourmeatColors.textLight, marginBottom: 10 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  barLabel: { width: 72, fontSize: 11, fontWeight: '600', color: gourmeatColors.textLight },
  barTrack: { flex: 1, height: 6, borderRadius: 3, backgroundColor: '#EEE' },
  barFill: { height: 6, borderRadius: 3, backgroundColor: gourmeatColors.primary },
  sortChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    marginRight: 8,
  },
  sortChipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  sortChipText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  sortChipTextOn: { color: '#fff' },
  stars: { color: gourmeatColors.primary, fontWeight: '800', marginTop: 2 },
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
