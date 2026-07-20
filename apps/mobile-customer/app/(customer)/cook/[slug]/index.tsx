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
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCookStoreHero,
  GourmeatPrimaryButton,
  SHCFoodImage,
  SHCSkeletonBone,
  SHCSkeletonList,
  gourmeatColors,
  shcSpacing,
  shcRadii,
  contentPadForStickyFooter,
} from '@shc/ui';
import {
  getDishImageUrl,
  getDropImageUrl,
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
  kitchenChefBackground,
  kitchenTrustCerts,
  kitchenMenuSections,
  kitchenDishPriceLabel,
  kitchenMenuFilterChips,
  filterKitchenMenuDishes,
  kitchenMealSectionDeliveryHint,
  buildCustomizeDraft,
  kitchenMealExtraOptions,
  kitchenMealAddonOptions,
  kitchenMealMetaChips,
  kitchenCustomizeUnitPrice,
  kitchenCustomizeAddButtonLabel,
  adjustMealQty,
  toggleAddonId,
  draftToOrderLine,
  upsertKitchenOrderLine,
  setKitchenOrderLineQty,
  lineQtyForProduct,
  formatKitchenOrderCta,
  formatKitchenSubscribeCta,
  formatDropCookDate,
  formatDropOrderBy,
  formatDropPrice,
  filterCustomerCookingSoonDrops,
  type KitchenReviewSort,
  type KitchenOrderLine,
  type KitchenMealCustomizeDraft,
} from '@shc/utils';
import { VirtualRowFlashList } from '../../../../components/VirtualLists';
import { useCook, useDiscovery, useAddToCart } from '../../../../hooks/useProducts';
import { useDrops } from '../../../../hooks/useOrder';
import { useGuestAuthGate } from '../../../../hooks/useGuestAuthGate';

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
  const { data: kitchenDropsRaw = [] } = useDrops(cook?.id ? String(cook.id) : undefined, {
    enabled: Boolean(cook?.id),
  });
  const kitchenDrops = useMemo(
    () => filterCustomerCookingSoonDrops(kitchenDropsRaw as { cook_date?: string; status?: string }[]),
    [kitchenDropsRaw]
  );
  const { data: allProducts = [] } = useDiscovery('', {});
  const { requireAuth } = useGuestAuthGate();
  const addMut = useAddToCart();
  const [tab, setTab] = useState<TabId>('menu');
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({});
  const [reviewSort, setReviewSort] = useState<KitchenReviewSort>('recent');
  const [menuFilter, setMenuFilter] = useState('all');
  const [orderLines, setOrderLines] = useState<KitchenOrderLine[]>([]);
  const [customizeDish, setCustomizeDish] = useState<Record<string, unknown> | null>(null);
  const [draft, setDraft] = useState<KitchenMealCustomizeDraft | null>(null);

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

  const filteredListings = useMemo(
    () => filterKitchenMenuDishes(listings, menuFilter),
    [listings, menuFilter]
  );

  const menuSections = useMemo(() => kitchenMenuSections(filteredListings), [filteredListings]);

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

  const openCustomize = useCallback(
    (dish: Record<string, unknown>) => {
      if (!requireAuth('Sign in to add dishes to your cart.')) return;
      setCustomizeDish(dish);
      setDraft(buildCustomizeDraft(dish));
    },
    [requireAuth]
  );

  const confirmCustomize = useCallback(() => {
    if (!draft || !customizeDish) return;
    const extras = kitchenMealExtraOptions(customizeDish);
    const addons = kitchenMealAddonOptions(customizeDish);
    const line = draftToOrderLine(draft, extras, addons);
    setOrderLines((prev) => upsertKitchenOrderLine(prev, line));
    addMut.mutate({ productId: line.productId, qty: line.qty });
    setCustomizeDish(null);
    setDraft(null);
  }, [draft, customizeDish, addMut]);

  const orderCta = useMemo(() => formatKitchenOrderCta(orderLines), [orderLines]);
  const customizeExtras = useMemo(
    () => (customizeDish ? kitchenMealExtraOptions(customizeDish) : []),
    [customizeDish]
  );
  const customizeAddons = useMemo(
    () => (customizeDish ? kitchenMealAddonOptions(customizeDish) : []),
    [customizeDish]
  );
  const customizeChips = useMemo(
    () => (customizeDish ? kitchenMealMetaChips(customizeDish) : []),
    [customizeDish]
  );
  const unitPrice = draft
    ? kitchenCustomizeUnitPrice(draft, { extras: customizeExtras, addons: customizeAddons })
    : 0;

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
  const trustCerts = useMemo(() => kitchenTrustCerts(cook as any), [cook]);
  const chefBg = useMemo(() => kitchenChefBackground(cook as any), [cook]);

  if (isLoading) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top, paddingHorizontal: shcSpacing.md }]} testID="kitchen-page-loading">
        <SHCSkeletonBone height={160} radius={16} style={{ width: '100%', marginBottom: shcSpacing.md }} />
        <SHCSkeletonBone height={20} width="60%" style={{ marginBottom: 8 }} />
        <SHCSkeletonBone height={14} width="40%" style={{ marginBottom: shcSpacing.md }} />
        <SHCSkeletonList count={4} rowHeight={64} />
      </View>
    );
  }

  if (!cook) {
    return (
      <View style={[styles.loading, { paddingTop: insets.top }]} testID="kitchen-page-loading">
        <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.lg} />
        <Text style={styles.loadingText}>Kitchen not found</Text>
        <GourmeatPrimaryButton label="Back" onPress={() => router.back()} testID="kitchen-missing-back" />
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
          paddingBottom: contentPadForStickyFooter(insets.bottom),
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
          cookId={cook.id}
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
        <Pressable
          onPress={() => router.push(`/(customer)/cook/${slug}/ratings` as any)}
          testID="kitchen-rating-pill"
        >
          <Text style={styles.ratingLink}>★ {ratingSum.label} · See all ratings</Text>
        </Pressable>

        {(kitchenDrops as any[]).filter((d) => d.status === 'open' || d.status === 'sold_out').length > 0 && (
          <View style={{ marginTop: 12, marginBottom: 8 }} testID="kitchen-cooking-soon">
            <Text style={{ fontSize: 16, fontWeight: '900', marginBottom: 8, color: gourmeatColors.text }}>
              Cooking soon
            </Text>
            {(kitchenDrops as any[])
              .filter((d) => d.status === 'open' || d.status === 'sold_out')
              .map((d) => (
                <Pressable
                  key={d.id}
                  testID={`kitchen-drop-${d.id}`}
                  onPress={() => router.push(`/(customer)/drops/${d.id}` as any)}
                  style={{
                    borderWidth: 2,
                    borderColor: gourmeatColors.border,
                    borderRadius: 14,
                    marginBottom: 8,
                    backgroundColor: gourmeatColors.surface,
                    overflow: 'hidden',
                  }}
                >
                  <SHCFoodImage
                    uri={getDropImageUrl({ title: d.title, image_url: d.image_url, cook_id: d.cook_id })}
                    height={88}
                    rounded={0}
                    testID={`kitchen-drop-img-${d.id}`}
                  />
                  <View style={{ padding: 12 }}>
                  <Text style={{ fontWeight: '900', fontSize: 15 }}>{d.title}</Text>
                  <Text style={{ fontSize: 12, fontWeight: '600', color: gourmeatColors.textMuted, marginTop: 2 }}>
                    {formatDropCookDate(d.cook_date)} · {d.collection_slot} · by {formatDropOrderBy(d.order_by)}
                  </Text>
                  <Text style={{ fontWeight: '800', color: gourmeatColors.primary, marginTop: 4 }}>
                    {formatDropPrice(d.price_cents, d.price)} · {d.remaining_qty ?? 0} left
                  </Text>
                  </View>
                </Pressable>
              ))}
          </View>
        )}

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
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 10 }}>
              {kitchenMenuFilterChips().map((f) => (
                <Pressable
                  key={f.id}
                  onPress={() => setMenuFilter(f.id)}
                  style={[styles.filterChip, menuFilter === f.id && styles.filterChipOn]}
                >
                  <Text style={[styles.filterChipText, menuFilter === f.id && styles.filterChipTextOn]}>
                    {f.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
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
                        <Text style={styles.sectionSub}>{kitchenMealSectionDeliveryHint(section.title)}</Text>
                      </View>
                      <Text style={styles.chevron}>{isOpen ? '⌃' : '⌄'}</Text>
                    </Pressable>
                    {isOpen && (
                      <VirtualRowFlashList
                        data={section.dishes}
                        scrollEnabled={false}
                        keyExtractor={(d) => String(d.id)}
                        testID={`kitchen-menu-section-list-${section.id}`}
                        renderItem={(d) => {
                        const qty = lineQtyForProduct(orderLines, String(d.id));
                        return (
                          <View style={styles.dishRow} testID={`kitchen-menu-row-${d.id}`}>
                            <Image
                              source={{
                                uri: getDishImageUrl({
                                  id: String(d.id),
                                  cuisine: d.cuisine ? String(d.cuisine) : undefined,
                                  name: String(d.name),
                                  image_url: (d as { image_url?: string }).image_url,
                                }),
                              }}
                              style={styles.dishThumb}
                            />
                            <View style={{ flex: 1 }}>
                              <Text style={styles.dishName} numberOfLines={1}>
                                {String(d.name)}
                              </Text>
                              <Text style={styles.dishMeta} numberOfLines={1}>
                                {kitchenDishPriceLabel(d) || ''}/portion · Customizable
                              </Text>
                            </View>
                            {qty > 0 ? (
                              <View style={styles.qtyRow}>
                                <Pressable
                                  onPress={() =>
                                    setOrderLines((prev) =>
                                      setKitchenOrderLineQty(prev, String(d.id), qty - 1)
                                    )
                                  }
                                >
                                  <Text style={styles.qtyBtn}>−</Text>
                                </Pressable>
                                <Text style={styles.qtyVal}>{qty}</Text>
                                <Pressable onPress={() => openCustomize(d)}>
                                  <Text style={styles.qtyBtn}>+</Text>
                                </Pressable>
                              </View>
                            ) : (
                              <Pressable style={styles.addBtn} onPress={() => openCustomize(d)} testID={`kitchen-add-${d.id}`}>
                                <Text style={styles.addBtnText}>+ Add</Text>
                              </Pressable>
                            )}
                          </View>
                        );
                      }}
                      />
                    )}
                  </View>
                );
              })
            )}
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
              <Text style={styles.infoLabel}>Chef&apos;s background</Text>
              <Text style={styles.infoBody}>{cook.display_name}</Text>
              <Text style={styles.infoMuted}>{chefBg}</Text>
            </View>
            <View testID="kitchen-trust-certs" style={{ marginTop: shcSpacing.sm }}>
              <Text style={styles.infoLabel}>Licenses & safety</Text>
              {trustCerts.map((c) => (
                <View key={c.id} style={styles.infoCard} testID={`kitchen-trust-${c.id}`}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.infoBody}>{c.label}</Text>
                    <Text style={styles.infoMuted}>{c.status}</Text>
                  </View>
                  <Text style={styles.infoMuted}>{c.detail}</Text>
                </View>
              ))}
            </View>
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

      {tab === 'menu' && orderLines.length > 0 && (
        <View style={[styles.footer, { paddingBottom: insets.bottom + shcSpacing.md }]} testID="kitchen-order-sticky">
          <View style={styles.footerMeta}>
            <Text style={styles.footerItems} testID="kitchen-order-item-label">
              {orderCta.itemLabel}
            </Text>
            <Text style={styles.footerTotal} testID="kitchen-order-total">
              {orderCta.totalLabel}
            </Text>
          </View>
          <GourmeatPrimaryButton
            label={orderCta.ctaLabel}
            onPress={() => router.push('/(customer)/cart' as any)}
            testID="kitchen-order-cta"
          />
          <Pressable
            onPress={() => router.push(`/(customer)/tiffin/kitchen/${cook.id}` as any)}
            style={styles.subLink}
            testID="kitchen-subscribe-cta"
          >
            <Text style={styles.subLinkText}>{formatKitchenSubscribeCta()}</Text>
          </Pressable>
        </View>
      )}

      <Modal visible={Boolean(customizeDish && draft)} animationType="slide" transparent testID="kitchen-customize-sheet">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalSheet}>
            {draft && customizeDish ? (
              <>
                <Text style={styles.modalTitle} testID="kitchen-customize-title">
                  {draft.productName}
                </Text>
                <View style={styles.chipRow}>
                  {customizeChips.map((c) => (
                    <Text key={c.id} style={styles.chip}>
                      {c.label}
                    </Text>
                  ))}
                </View>
                <Text style={styles.modalSection}>Extra · select one</Text>
                {customizeExtras.map((e) => (
                  <Pressable
                    key={e.id}
                    style={[styles.optRow, draft.extraId === e.id && styles.optRowOn]}
                    onPress={() => setDraft((d) => (d ? { ...d, extraId: e.id } : d))}
                  >
                    <Text style={styles.optLabel}>{e.label}</Text>
                    <Text style={styles.optPrice}>
                      {e.priceDelta > 0 ? `+S$${e.priceDelta}` : 'S$0'}
                      {draft.extraId === e.id ? ' ✓' : ''}
                    </Text>
                  </Pressable>
                ))}
                <Text style={styles.modalSection}>Add-on · optional</Text>
                {customizeAddons.map((a) => (
                  <Pressable
                    key={a.id}
                    style={[styles.optRow, draft.addonIds.includes(a.id) && styles.optRowOn]}
                    onPress={() =>
                      setDraft((d) => (d ? { ...d, addonIds: toggleAddonId(d.addonIds, a.id) } : d))
                    }
                  >
                    <Text style={styles.optLabel}>{a.label}</Text>
                    <Text style={styles.optPrice}>
                      +S${a.priceDelta}
                      {draft.addonIds.includes(a.id) ? ' ✓' : ''}
                    </Text>
                  </Pressable>
                ))}
                <View style={styles.modalFooter}>
                  <View style={styles.qtyRow}>
                    <Pressable onPress={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, -1) } : d))}>
                      <Text style={styles.qtyBtn}>−</Text>
                    </Pressable>
                    <Text style={styles.qtyVal} testID="kitchen-qty-value">
                      {draft.qty}
                    </Text>
                    <Pressable onPress={() => setDraft((d) => (d ? { ...d, qty: adjustMealQty(d.qty, 1) } : d))}>
                      <Text style={styles.qtyBtn}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable style={styles.confirmBtn} onPress={confirmCustomize} testID="kitchen-customize-add-btn">
                    <Text style={styles.confirmBtnText}>{kitchenCustomizeAddButtonLabel(unitPrice)}</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => {
                    setCustomizeDish(null);
                    setDraft(null);
                  }}
                  style={{ marginTop: 12 }}
                >
                  <Text style={{ textAlign: 'center', fontWeight: '700', color: gourmeatColors.textLight }}>
                    Cancel
                  </Text>
                </Pressable>
              </>
            ) : null}
          </View>
        </View>
      </Modal>
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
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    marginRight: 8,
  },
  filterChipOn: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  filterChipText: { fontSize: 12, fontWeight: '700', color: gourmeatColors.text },
  filterChipTextOn: { color: '#fff' },
  qtyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    paddingHorizontal: 6,
  },
  qtyBtn: { fontSize: 18, fontWeight: '900', paddingHorizontal: 8, paddingVertical: 4 },
  qtyVal: { fontWeight: '900', minWidth: 18, textAlign: 'center' },
  empty: { fontSize: 13, fontWeight: '600', color: gourmeatColors.textLight },
  footerMeta: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  footerItems: { fontWeight: '800', fontSize: 13 },
  footerTotal: { fontWeight: '900', color: gourmeatColors.primary },
  subLink: { marginTop: 8, alignItems: 'center' },
  subLinkText: { fontWeight: '800', color: gourmeatColors.primary, fontSize: 13 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  modalSheet: {
    backgroundColor: gourmeatColors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: shcSpacing.md,
    maxHeight: '88%',
  },
  modalTitle: { fontSize: 18, fontWeight: '900', marginBottom: 8 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 12 },
  chip: {
    fontSize: 11,
    fontWeight: '700',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: gourmeatColors.border,
    overflow: 'hidden',
  },
  modalSection: {
    fontSize: 11,
    fontWeight: '800',
    color: gourmeatColors.textLight,
    textTransform: 'uppercase',
    marginBottom: 6,
    marginTop: 4,
  },
  optRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 2,
    borderColor: gourmeatColors.border,
    borderRadius: 12,
    marginBottom: 8,
  },
  optRowOn: { borderColor: gourmeatColors.primary, backgroundColor: '#FFF0EB' },
  optLabel: { fontWeight: '700', fontSize: 14 },
  optPrice: { fontWeight: '800', fontSize: 13 },
  modalFooter: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 8 },
  confirmBtn: {
    flex: 1,
    backgroundColor: gourmeatColors.primary,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontWeight: '900', fontSize: 13 },
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
