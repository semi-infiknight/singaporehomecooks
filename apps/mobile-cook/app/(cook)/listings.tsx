import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  ListingWizardStep,
  IngredientTierEditor,
  OccasionTagPicker,
  PriceEarningsCalc,
  SHCSectionTitle,
  SHCFoodImage,
  SHCBadge,
  GourmeatCookHeader,
  GourmeatSearchBar,
  SHCFilterChipRow,
  SHCWizardProgress,
  SHCFadeIn,
  SHCIcon,
  gourmeatColors,
  shcColors,
  AICalorieBadge,
  PhotoTipsModalContent,
  useSHCTray,
  SHCTrayAction,
  SHCWizardPane,
  SHCMorphingLabel,
  ListingWizardMorphCta,
  SHCCelebration,
  useMilestoneCelebration,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  DirectionalTabScreen,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  CUISINE_IMAGE,
  filterCookListings,
  getDishImageUrl,
  uniqueListingCuisines,
  resolveCookListingsForDisplay,
  cookListingE2eTestId,
  E2E_COOK_SEED_LISTING,
  type CookListingStatusFilter,
} from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAICalorieEstimate, useCookListings } from '../../hooks/useProducts';
import { getPhotoTips, createCookListing, updateCookListing, deleteCookListing } from '../../lib/api-client';
import { useAuth } from '../../hooks/useAuth';

const inputStyle = {
  borderWidth: shcBorders.brutal,
  borderColor: shcColors.border,
  padding: shcSpacing.sm,
  marginBottom: shcSpacing.sm,
  borderRadius: shcRadii.md,
  backgroundColor: shcColors.surface,
  ...shcShadows.brutalSm,
};

const milestoneStorage = {
  get: (k: string) => SecureStore.getItemAsync(k),
  set: (k: string, v: string) => SecureStore.setItemAsync(k, v),
};

export default function CookListings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wizardStep } = useLocalSearchParams<{ wizardStep?: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: myListings = [] } = useCookListings();
  const { openTray, pushTrayContent, popTray, dismiss } = useSHCTray();
  const {
    show: showCelebration,
    triggerIfFirst,
    dismiss: dismissCelebration,
  } = useMilestoneCelebration('first_listing_publish', user?.id || '', milestoneStorage);

  const scrollRef = useRef<ScrollView>(null);
  const wizardY = useRef(0);
  const step = Math.min(4, Math.max(1, parseInt(String(wizardStep ?? '1'), 10) || 1));

  const goToStep = (next: number) => {
    Keyboard.dismiss();
    router.setParams({ wizardStep: String(next) } as Record<string, string>);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, wizardY.current - 16), animated: true });
    });
  };

  useEffect(() => {
    if (step > 1) {
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ y: Math.max(0, wizardY.current - 16), animated: true });
      });
    }
  }, [step]);
  const [name, setName] = useState('New Nyonya Dish');
  const [price, setPrice] = useState(14);
  const [minQty, setMinQty] = useState(4);
  const [cuisine, setCuisine] = useState('Peranakan');
  const [occasionTags, setOccasionTags] = useState<string[]>(['Hari Raya']);
  const [ingredients, setIngredients] = useState([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
  const [heritage, setHeritage] = useState('Family recipe from our HDB kitchen since 1978.');
  const [published, setPublished] = useState<any>(null);
  const [aiCal, setAiCal] = useState<any>(null);
  const aiEstMut = useAICalorieEstimate();
  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const listingsForDisplay = useMemo(
    () => resolveCookListingsForDisplay(myListings as Array<Record<string, unknown>>, { dev: __DEV__, maestroE2e }) as typeof myListings,
    [myListings, maestroE2e]
  );

  const filteredListings = useMemo(
    () => filterCookListings(listingsForDisplay, { q: searchQuery, status: statusFilter, cuisine: cuisineFilter }),
    [listingsForDisplay, searchQuery, statusFilter, cuisineFilter]
  );

  const filterChips = useMemo(() => {
    const chips = [
      { id: 'status:all', label: 'All', active: statusFilter === 'all' && cuisineFilter === 'all' },
      { id: 'status:live', label: 'Live', active: statusFilter === 'live' },
      { id: 'status:paused', label: 'Paused', active: statusFilter === 'paused' },
      ...uniqueListingCuisines(myListings).map((cuisine) => ({
        id: `cuisine:${cuisine}`,
        label: cuisine,
        active: cuisineFilter === cuisine,
      })),
    ];
    return chips;
  }, [myListings, statusFilter, cuisineFilter]);

  const handleFilterChip = (chipId: string) => {
    if (chipId === 'status:all') {
      setStatusFilter('all');
      setCuisineFilter('all');
      return;
    }
    if (chipId.startsWith('status:')) {
      setStatusFilter(chipId.replace('status:', '') as CookListingStatusFilter);
      return;
    }
    if (chipId.startsWith('cuisine:')) {
      const cuisine = chipId.replace('cuisine:', '');
      setCuisineFilter((prev) => (prev === cuisine ? 'all' : cuisine));
    }
  };

  const previewImage = getDishImageUrl({ name, cuisine });

  const resetWizard = () => {
    setEditingId(null);
    setName('New Nyonya Dish');
    setPrice(14);
    setMinQty(4);
    setCuisine('Peranakan');
    setOccasionTags(['Hari Raya']);
    setIngredients([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
    setHeritage('Family recipe from our HDB kitchen since 1978.');
    setPublished(null);
    setAiCal(null);
    goToStep(1);
  };

  const startEdit = (listing: any) => {
    setEditingId(listing.id);
    setName(listing.name || 'Dish');
    setPrice(Number(listing.price) || 12);
    setMinQty(Number(listing.min_qty) || 4);
    setCuisine(listing.cuisine || 'Singapore');
    setOccasionTags(listing.occasion_tags?.length ? listing.occasion_tags : ['Hari Raya']);
    setIngredients(
      listing.ingredients?.length
        ? listing.ingredients
        : [{ name: 'Chicken', quantity: 300, unit: 'g' }]
    );
    setHeritage(listing.heritage_note || '');
    setPublished(null);
    setAiCal(
      listing.calories
        ? { calories: listing.calories, confidence: listing.calories_confidence || 'category', source: 'saved' }
        : null
    );
    goToStep(1);
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: Math.max(0, wizardY.current - 16), animated: true });
    });
  };

  const showErrorTray = useCallback(
    (title: string, message: string) => {
      openTray(
        { id: 'listing-error', title, height: 'compact' },
        <SHCTrayAction message={message} primaryLabel="OK" onPrimary={dismiss} testID="listing-error-tray" />
      );
    },
    [dismiss, openTray]
  );

  const performDelete = async (listing: any) => {
    if (listing.id === E2E_COOK_SEED_LISTING.id) return;
    try {
      await deleteCookListing(listing.id);
      if (editingId === listing.id) resetWizard();
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
    } catch (e: any) {
      showErrorTray('Delete failed', e?.message || 'Could not delete listing.');
    }
  };

  const togglePause = async (listing: any) => {
    const paused = !listing.shc_availability?.paused;
    try {
      await updateCookListing(listing.id, { paused });
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
    } catch (e: any) {
      showErrorTray(paused ? 'Pause failed' : 'Unpause failed', e?.message || 'Could not update listing.');
    }
  };

  const pushDeleteConfirm = (listing: any) => {
    pushTrayContent(
      { id: 'listing-delete-confirm', title: 'Delete listing?', height: 'medium' },
      <SHCTrayAction
        message={`Remove "${listing.name}" from your menu? This cannot be undone.`}
        primaryLabel="Delete"
        onPrimary={() => {
          dismiss();
          void performDelete(listing);
        }}
        secondaryLabel="Cancel"
        onSecondary={popTray}
        destructive
        testID="listing-delete-confirm-tray"
      />
    );
  };

  const showListingActions = (listing: any) => {
    const isPaused = !!listing.shc_availability?.paused;
    openTray(
      { id: 'listing-actions', title: String(listing.name), height: 'compact' },
      <View style={styles.trayActions} testID="listing-actions-tray">
        <Pressable
          style={styles.trayActionBtn}
          onPress={() => {
            dismiss();
            startEdit(listing);
          }}
          testID={`edit-listing-${listing.id}`}
        >
          <Text style={styles.trayActionText}>Edit listing</Text>
        </Pressable>
        <Pressable
          style={styles.trayActionBtn}
          onPress={() => {
            dismiss();
            void togglePause(listing);
          }}
          testID={`pause-listing-${listing.id}`}
        >
          <Text style={styles.trayActionText}>{isPaused ? 'Unpause listing' : 'Pause listing'}</Text>
        </Pressable>
        <Pressable
          style={[styles.trayActionBtn, styles.trayActionDestructive]}
          onPress={() => pushDeleteConfirm(listing)}
          testID={`delete-listing-${listing.id}`}
        >
          <Text style={styles.trayActionDestructiveText}>Delete listing</Text>
        </Pressable>
      </View>
    );
  };

  const toggleTag = (t: string) =>
    setOccasionTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const publish = async () => {
    if (publishing) return;
    if (!user?.id) {
      showErrorTray('Sign in required', 'Please log in as a cook before publishing a listing.');
      return;
    }
    setPublishing(true);
    const input: any = {
      name,
      price,
      min_qty: minQty,
      cuisine,
      occasion_tags: occasionTags,
      ingredients,
      allergen_tiers: { tier1: ['Nuts'], tier2: [], tier3: [] },
      heritage_note: heritage,
    };

    // Full MinIO server upload example (auth on backend):
    // In real app: use expo-image-picker, convert to base64, call uploadImageToServer
    // Here: demo with a tiny placeholder image (1x1 red pixel jpeg base64)
    try {
      const { uploadImageToServer } = await import('../../lib/api-client');
      const tinyJpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDL/2wBDAQkJCQwLDBgNDRgyIRwhMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjL/wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAv/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAX/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIRAxEAPwA/ALQ'; // tiny placeholder
      const uploadRes = await uploadImageToServer(tinyJpegBase64, `dish-${name.toLowerCase().replace(/\s+/g,'-')}.jpg`, user?.id || 'demo-cook');
      const upload = uploadRes as { webp_url?: string; url?: string } | null | undefined;
      if (upload?.webp_url || upload?.url) {
        input.image_url = upload.webp_url || upload.url; // prefer optimized WebP derivative
      } else {
        input.image_url = `https://picsum.photos/seed/${name.replace(/\s+/g,'')}/400/300`;
      }
    } catch {
      input.image_url = `https://picsum.photos/seed/${name.replace(/\s+/g,'')}/400/300`;
    }

    if (aiCal) {
      input.calories = aiCal.calories;
      input.calories_confidence = aiCal.confidence;
    }
    try {
      const prod = editingId
        ? await updateCookListing(editingId, input)
        : await createCookListing(input);
      setPublished(prod);
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
      if (!editingId) {
        await triggerIfFirst();
      }
      if (editingId) {
        setEditingId(null);
      }
      goToStep(1);
      setAiCal(null);
    } catch (e: any) {
      const message = e?.message || e?.code || 'Could not save listing. Check your connection and try again.';
      showErrorTray(editingId ? 'Update failed' : 'Publish failed', message);
    } finally {
      setPublishing(false);
    }
  };

  return (
    <DirectionalTabScreen testID="cook-listings-tab-scene">

    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      keyboardShouldPersistTaps="handled"
      testID="cook-listings-screen"
    >
      <GourmeatCookHeader
        title="My Listings"
        subtitle={
          listingsForDisplay.length
            ? `${filteredListings.length} of ${listingsForDisplay.length} dishes`
            : user?.name
        }
        testID="listings-hero"
      />

      <View style={styles.searchWrap}>
        <GourmeatSearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search your dishes…"
          testID="cook-listings-search"
        />
      </View>

      {listingsForDisplay.length > 0 ? (
        <>
          <SHCFilterChipRow
            chips={filterChips}
            onChipPress={handleFilterChip}
            testID="cook-listings-filter-chips"
          />
          <Text style={styles.holdHint}>Press and hold a dish for edit, pause, or delete</Text>
        </>
      ) : null}

      {listingsForDisplay.length === 0 && (
        <SHCCard variant="bento-mint" style={styles.emptyListings}>
          <SHCFoodImage uri={CUISINE_IMAGE.Peranakan} height={80} rounded={shcRadii.md} />
          <SHCBadge variant="default">No listings yet</SHCBadge>
        </SHCCard>
      )}
      {listingsForDisplay.length > 0 && filteredListings.length === 0 && (
        <SHCCard variant="bento-mint" style={styles.emptyListings}>
          <SHCBadge variant="default">No dishes match your search</SHCBadge>
        </SHCCard>
      )}
      {filteredListings.map((p: any, index: number) => (
        <Pressable
          key={p.id}
          onLongPress={() => showListingActions(p)}
          delayLongPress={400}
          testID={cookListingE2eTestId(p, index)}
          accessibilityRole="button"
          accessibilityLabel={`${p.name}, long press for options`}
        >
          <SHCCard style={styles.listingCard}>
            <View style={styles.listingRow}>
              <SHCFoodImage
                uri={getDishImageUrl({ name: p.name, cuisine: p.cuisine, image_url: p.image_url })}
                width={64}
                height={64}
                rounded={shcRadii.md}
              />
              <View style={styles.listingInfo}>
                <Text style={styles.listingName} numberOfLines={1}>{p.name}</Text>
                <View style={styles.listingBadges}>
                  <SHCBadge variant="default">S${p.price}</SHCBadge>
                  <SHCBadge variant="heritage">min {p.min_qty}</SHCBadge>
                  {p.shc_availability?.paused ? <SHCBadge variant="warning">Paused</SHCBadge> : null}
                </View>
              </View>
            </View>
          </SHCCard>
        </Pressable>
      ))}

      <View
        onLayout={(e) => {
          wizardY.current = e.nativeEvent.layout.y;
        }}
      >
      <SHCFadeIn>
        <SHCSectionTitle style={styles.wizardTitle}>{editingId ? 'Edit Listing' : 'New Listing'}</SHCSectionTitle>
        <SHCWizardProgress step={step} />
      </SHCFadeIn>
      </View>

      <SHCWizardPane stepKey={step}>
      {step === 1 && (
        <ListingWizardStep step={1} title="Dish Basics">
          <SHCFoodImage uri={previewImage} height={100} rounded={shcRadii.md} />
          <TextInput value={name} onChangeText={setName} placeholder="Dish name" style={inputStyle} />
          <TextInput
            value={String(price)}
            onChangeText={(t) => setPrice(parseInt(t) || 10)}
            keyboardType="numeric"
            placeholder="Price S$"
            style={inputStyle}
          />
          <TextInput
            value={String(minQty)}
            onChangeText={(t) => setMinQty(parseInt(t) || 3)}
            keyboardType="numeric"
            placeholder="Min Qty"
            style={inputStyle}
          />
        </ListingWizardStep>
      )}

      {step === 2 && (
        <ListingWizardStep step={2} title="Tags & Cuisine">
          <SHCFoodImage uri={CUISINE_IMAGE[cuisine] || BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.md} />
          <TextInput value={cuisine} onChangeText={setCuisine} style={inputStyle} />
          <OccasionTagPicker selected={occasionTags} onToggle={toggleTag} />
        </ListingWizardStep>
      )}

      {step === 3 && (
        <ListingWizardStep step={3} title="Ingredients & Heritage">
          <IngredientTierEditor value={ingredients} onChange={setIngredients} />
          <SHCButton
            variant="outline"
            onPress={async () => {
              const est = await aiEstMut.mutateAsync(ingredients);
              setAiCal(est);
            }}
            testID="ai-cal-est-btn"
            style={{ marginTop: 6 }}
          >
            <SHCButtonText>🔥 AI Calories</SHCButtonText>
          </SHCButton>
          {aiCal && <AICalorieBadge calories={aiCal.calories} confidence={aiCal.confidence} source={aiCal.source} />}
          <Pressable
            onPress={async () => {
              const tips = await getPhotoTips();
              const tipList = (tips as { tips?: string[] }).tips || [];
              openTray(
                { id: 'photo-tips', title: 'Photo tips', height: 'tall' },
                <ScrollView>
                  <PhotoTipsModalContent onClose={dismiss} />
                  {tipList.map((t: string, i: number) => (
                    <Text key={i} style={styles.tipItem}>• {t}</Text>
                  ))}
                </ScrollView>
              );
            }}
            testID="photo-tips-btn"
            style={styles.photoTipsBtn}
          >
            <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={48} width={48} rounded={shcRadii.sm} />
            <SHCBadge variant="heritage">📸 Photo tips</SHCBadge>
          </Pressable>
          <TextInput value={heritage} onChangeText={setHeritage} multiline style={[inputStyle, { height: 60 }]} />
        </ListingWizardStep>
      )}

      {step === 4 && (
        <View testID="listing-wizard-step4">
        <ListingWizardStep step={4} title="Review & Publish">
          <SHCFoodImage
            uri={previewImage}
            height={120}
            rounded={shcRadii.lg}
            overlay={
              <View style={styles.reviewOverlay}>
                <Text style={styles.reviewName}>{name}</Text>
                <SHCBadge variant="default">S${price}</SHCBadge>
              </View>
            }
          />
          <PriceEarningsCalc price={price} qty={minQty} minQty={minQty} />
          <View style={styles.tagRow}>
            {occasionTags.map((t) => (
              <SHCBadge key={t} variant="heritage">{t}</SHCBadge>
            ))}
          </View>
          {publishing ? <ActivityIndicator color={gourmeatColors.primary} style={{ marginTop: 8 }} /> : null}
          {editingId ? (
            <SHCButton variant="outline" onPress={resetWizard} style={{ marginTop: 8 }}>
              <SHCButtonText>Cancel edit</SHCButtonText>
            </SHCButton>
          ) : null}
          <SHCButton variant="outline" onPress={() => goToStep(3)} style={{ marginTop: 8 }}>
            <SHCButtonText>←</SHCButtonText>
          </SHCButton>
          {published && (
            <SHCCard variant="bento-mint" style={styles.publishedCard}>
              <SHCIcon name="checkmark" size={28} color={shcColors.success} active />
              <SHCBadge variant="success">{published.name} live</SHCBadge>
            </SHCCard>
          )}
        </ListingWizardStep>
        </View>
      )}
      </SHCWizardPane>

      <View style={[styles.navRow, step === 1 && { marginTop: 12 }]}>
        {step > 1 && step <= 4 ? (
          <SHCButton onPress={() => goToStep(step - 1)} testID={`listing-wizard-back-step${step}`}>
            <SHCButtonText>←</SHCButtonText>
          </SHCButton>
        ) : null}
        <View style={{ flex: 1 }}>
          <ListingWizardMorphCta
            step={step}
            editing={!!editingId}
            onPress={step >= 4 ? publish : () => goToStep(step + 1)}
            disabled={step >= 4 && publishing}
            testID={step >= 4 ? 'listing-wizard-publish' : `listing-wizard-next-step${step}`}
            showChevron={step < 4}
          />
        </View>
      </View>

      <SHCCelebration
        visible={showCelebration}
        message="Your first dish is live! Families can now discover your heritage cooking."
        onDone={dismissCelebration}
        testID="first-listing-celebration"
      />
    </ScrollView>
  
    </DirectionalTabScreen>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  searchWrap: { marginHorizontal: -shcSpacing.md },
  emptyListings: { alignItems: 'center', gap: shcSpacing.sm, paddingVertical: shcSpacing.md },
  listingCard: { marginBottom: shcSpacing.sm },
  listingRow: { flexDirection: 'row', gap: shcSpacing.sm, alignItems: 'center' },
  listingInfo: { flex: 1, gap: 4 },
  listingName: { fontWeight: '700', fontSize: 15 },
  listingBadges: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  holdHint: { fontSize: 12, color: gourmeatColors.textLight, marginBottom: shcSpacing.sm },
  wizardTitle: { marginTop: shcSpacing.md },
  navRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  photoTipsBtn: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginTop: shcSpacing.sm },
  reviewOverlay: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(36,24,18,0.45)',
    padding: shcSpacing.sm,
  },
  reviewName: { color: shcColors.onPrimary, fontWeight: '800', fontSize: 15, flex: 1 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 8 },
  publishedCard: { marginTop: 8, flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm },
  trayActions: { gap: shcSpacing.sm },
  trayActionBtn: {
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
  trayActionText: { fontWeight: '800', fontSize: 15, color: gourmeatColors.text, textAlign: 'center' },
  trayActionDestructive: { backgroundColor: '#FEE2E2' },
  trayActionDestructiveText: { fontWeight: '800', fontSize: 15, color: '#B91C1C', textAlign: 'center' },
  tipItem: { marginTop: 4, fontSize: 13 },
});