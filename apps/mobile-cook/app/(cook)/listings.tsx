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
  SHCMetaBadge,
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
  SHCSkeletonList,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  DirectionalTabScreen,
  contentPadForTabBar,
  SHCAllergenTierPicker,
  SHCHalalToggle,
  SHCListingAvailabilityEditor,
  SHCListingDescriptionInput,
  SHCLastMinutePremiumInput,
  SHCMealExtrasEditor,
  SHCMealAddonsEditor,
  SHCRecipeStepsEditor,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  CUISINE_IMAGE,
  filterCookListings,
  getDishImageUrl,
  uniqueListingCuisines,
  resolveCookListingsForDisplay,
  cookAllergenTier1Presets,
  cookCollectionTimeSlotPresets,
  cookListingE2eTestId,
  E2E_COOK_SEED_LISTING,
  type CookListingStatusFilter,
  buildCookListingPayload,
  emptyAllergenTiers,
  DEFAULT_LISTING_AVAILABILITY,
  allergenTiersFromListing,
  availabilityFromListing,
  shcPortionMinBadgeLabel,
  defaultMealExtrasDraft,
  defaultMealAddonsDraft,
  mealOptionsFromListing,
  recipeStepsFromListing,
  type RecipeStepDraft,
} from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAICalorieEstimate, useCookListings } from '../../hooks/useProducts';
import {
  getPhotoTips,
  createCookListing,
  updateCookListing,
  deleteCookListing,
  generateListingImage,
  getAiImageStatus,
} from '../../lib/api-client';
import { useAuth } from '../../hooks/useAuth';
import { useCookConfig } from '../../hooks/useCookConfig';
import { VirtualRowFlashList } from '../../components/VirtualLists';

const DEFAULT_CUISINE_PRESETS = ['Peranakan', 'Malay', 'Chinese', 'Indian', 'Eurasian', 'Western', 'Fusion'];

/** Lazy-load so Listings + Generate AI work even when native binary lacks ImagePicker (needs rebuild). */
async function loadImagePicker(): Promise<typeof import('expo-image-picker') | null> {
  try {
    return await import('expo-image-picker');
  } catch {
    return null;
  }
}

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
  const { config } = useCookConfig();
  const qc = useQueryClient();
  const { data: myListings, isLoading: listingsLoading } = useCookListings();
  const listingList = (myListings as any[]) ?? [];
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
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState(14);
  const [minQty, setMinQty] = useState(4);
  const [cuisine, setCuisine] = useState('Peranakan');
  const [halal, setHalal] = useState(false);
  const [allergenTiers, setAllergenTiers] = useState(emptyAllergenTiers);
  const [portionsPerDay, setPortionsPerDay] = useState(DEFAULT_LISTING_AVAILABILITY.portions_per_day);
  const [collectionDays, setCollectionDays] = useState<number[]>([...DEFAULT_LISTING_AVAILABILITY.collection_days]);
  const [timeSlots, setTimeSlots] = useState<string[]>([...DEFAULT_LISTING_AVAILABILITY.time_slots]);
  const [lastMinutePremiumPct, setLastMinutePremiumPct] = useState<number | null>(null);
  const [occasionTags, setOccasionTags] = useState<string[]>(['Hari Raya']);
  const [ingredients, setIngredients] = useState([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
  const [mealExtras, setMealExtras] = useState(() => defaultMealExtrasDraft('Peranakan'));
  const [mealAddons, setMealAddons] = useState(() => defaultMealAddonsDraft(false));
  const [recipeSteps, setRecipeSteps] = useState<RecipeStepDraft[]>([]);
  const [published, setPublished] = useState<any>(null);
  const [aiCal, setAiCal] = useState<any>(null);
  const aiEstMut = useAICalorieEstimate();
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [aiPhotoBusy, setAiPhotoBusy] = useState(false);
  const [aiPhotoNote, setAiPhotoNote] = useState<string | null>(null);
  const [aiImageStatus, setAiImageStatus] = useState<{
    configured?: boolean;
    generate_available?: boolean;
    generate_unavailable_reason?: string | null;
    cuisine_presets?: string[];
    model?: string;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st) => {
        if (!cancelled) setAiImageStatus(st || {});
      })
      .catch(() => {
        if (!cancelled) {
          setAiImageStatus({
            generate_available: false,
            generate_unavailable_reason: 'Could not reach AI status',
          });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cuisinePresets = aiImageStatus?.cuisine_presets?.length
    ? aiImageStatus.cuisine_presets
    : DEFAULT_CUISINE_PRESETS;
  const generateAvailable = aiImageStatus?.generate_available === true || aiImageStatus?.configured === true;
  const generateBlockedReason =
    aiImageStatus?.generate_unavailable_reason ||
    (!generateAvailable && aiImageStatus ? 'AI generate offline — upload a kitchen photo' : null);

  const [publishing, setPublishing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<CookListingStatusFilter>('all');
  const [cuisineFilter, setCuisineFilter] = useState('all');

  const maestroE2e = process.env.EXPO_PUBLIC_MAESTRO_E2E === '1';
  const listingsForDisplay = useMemo(
    () => resolveCookListingsForDisplay(listingList as Array<Record<string, unknown>>, { dev: __DEV__, maestroE2e }) as typeof listingList,
    [listingList, maestroE2e]
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
      ...uniqueListingCuisines(listingList).map((cuisine) => ({
        id: `cuisine:${cuisine}`,
        label: cuisine,
        active: cuisineFilter === cuisine,
      })),
    ];
    return chips;
  }, [listingList, statusFilter, cuisineFilter]);

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

  const previewImage = listingImageUrl || getDishImageUrl({ name, cuisine });

  const resetWizard = () => {
    setEditingId(null);
    setListingImageUrl(null);
    setAiPhotoNote(null);
    setName('New Nyonya Dish');
    setDescription('');
    setPrice(14);
    setMinQty(4);
    setCuisine('Peranakan');
    setHalal(false);
    setAllergenTiers(emptyAllergenTiers());
    setPortionsPerDay(DEFAULT_LISTING_AVAILABILITY.portions_per_day);
    setCollectionDays([...DEFAULT_LISTING_AVAILABILITY.collection_days]);
    setTimeSlots([...DEFAULT_LISTING_AVAILABILITY.time_slots]);
    setLastMinutePremiumPct(null);
    setOccasionTags(['Hari Raya']);
    setIngredients([{ name: 'Chicken', quantity: 300, unit: 'g' }]);
    setMealExtras(defaultMealExtrasDraft('Peranakan'));
    setMealAddons(defaultMealAddonsDraft(false));
    setRecipeSteps([]);
    setPublished(null);
    setAiCal(null);
    goToStep(1);
  };

  const startEdit = (listing: any) => {
    setEditingId(listing.id);
    setName(listing.name || 'Dish');
    setDescription(listing.description || '');
    setPrice(Number(listing.price) || 12);
    setMinQty(Number(listing.min_qty) || 4);
    setCuisine(listing.cuisine || 'Singapore');
    setHalal(!!listing.halal);
    setAllergenTiers(allergenTiersFromListing(listing.allergen_tiers));
    const avail = availabilityFromListing(listing.shc_availability);
    setPortionsPerDay(avail.portions_per_day);
    setCollectionDays(avail.collection_days);
    setTimeSlots(avail.time_slots);
    setLastMinutePremiumPct(
      typeof listing.last_minute_premium_pct === 'number' ? listing.last_minute_premium_pct : null
    );
    setOccasionTags(listing.occasion_tags?.length ? listing.occasion_tags : ['Hari Raya']);
    setIngredients(
      listing.ingredients?.length
        ? listing.ingredients
        : [{ name: 'Chicken', quantity: 300, unit: 'g' }]
    );
    const mealMeta = mealOptionsFromListing(listing);
    setMealExtras(mealMeta.extras);
    setMealAddons(mealMeta.addons);
    setRecipeSteps(recipeStepsFromListing(listing));
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

  const pickImageBase64 = async (): Promise<string | null> => {
    const ImagePicker = await loadImagePicker();
    if (!ImagePicker?.requestMediaLibraryPermissionsAsync) {
      showErrorTray(
        'Photo library needs app rebuild',
        'Generate AI still works. For Upload/Brighten, rebuild the cook app (native ImagePicker module missing).'
      );
      return null;
    }
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        showErrorTray('Permission needed', 'Allow photo library access to upload a dish photo.');
        return null;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions?.Images ?? ('images' as any),
        quality: 0.7,
        base64: true,
      });
      if (result.canceled || !result.assets?.[0]?.base64) return null;
      const asset = result.assets[0];
      const mime = asset.mimeType || 'image/jpeg';
      return `data:${mime};base64,${asset.base64}`;
    } catch (e: any) {
      const msg = String(e?.message || e || '');
      if (/ExponentImagePicker|native module/i.test(msg)) {
        showErrorTray(
          'Photo library needs app rebuild',
          'Generate AI still works without Upload. Rebuild cook iOS/Android to enable camera roll.'
        );
        return null;
      }
      showErrorTray('Photo pick failed', msg || 'Could not open photo library.');
      return null;
    }
  };

  const runGenerateAi = async () => {
    if (!generateAvailable) {
      showErrorTray('AI generate offline', generateBlockedReason || 'Upload a real kitchen photo instead.');
      return;
    }
    if (!name.trim()) {
      showErrorTray('Dish name needed', 'Enter a dish name before generating an AI plate.');
      return;
    }
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'generate',
        dish_name: name,
        cuisine,
      });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('No image URL returned');
      setListingImageUrl(url);
      setAiPhotoNote('Illustrative AI plate — real dish may vary. Prefer a kitchen photo when you can.');
    } catch (e) {
      showErrorTray('AI generate failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const polishFromPicker = async (label: 'upload' | 'brighten') => {
    const b64 = await pickImageBase64();
    if (!b64) return;
    setAiPhotoBusy(true);
    setAiPhotoNote(null);
    try {
      const res = await generateListingImage({
        mode: 'enhance',
        dish_name: name || 'Dish',
        cuisine,
        image_base64: b64,
        enhance_style: 'polish',
        ai_restyle: false,
      });
      const url = res.webp_url || res.image_url;
      if (!url) throw new Error('Photo processing failed');
      setListingImageUrl(url);
      setAiPhotoNote(
        label === 'brighten'
          ? 'Brightened your photo (still your kitchen shot)'
          : 'Kitchen photo uploaded & optimized'
      );
    } catch (e) {
      showErrorTray(label === 'brighten' ? 'Brighten failed' : 'Upload failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
    }
  };

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
    const input = buildCookListingPayload({
      name,
      description,
      price,
      min_qty: minQty,
      cuisine,
      occasion_tags: occasionTags,
      ingredients,
      allergen_tiers: allergenTiers,
      halal,
      portions_per_day: portionsPerDay,
      collection_days: collectionDays,
      time_slots: timeSlots,
      last_minute_premium_pct: lastMinutePremiumPct,
      meal_extras: mealExtras,
      meal_addons: mealAddons,
      recipe_steps: recipeSteps,
      image_url: listingImageUrl || getDishImageUrl({ name, cuisine }),
      calories: aiCal?.calories,
      calories_confidence: aiCal?.confidence,
    });
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) }]}
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

      {listingsLoading && listingList.length === 0 ? (
        <SHCSkeletonList count={4} rowHeight={80} />
      ) : null}

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

      {!listingsLoading && listingsForDisplay.length === 0 && (
        <SHCCard variant="bento-mint" style={styles.emptyListings}>
          <SHCFoodImage uri={CUISINE_IMAGE.Peranakan} height={80} rounded={shcRadii.md} />
          <SHCMetaBadge kind="label">No listings yet</SHCMetaBadge>
        </SHCCard>
      )}
      {listingsForDisplay.length > 0 && filteredListings.length === 0 && (
        <SHCCard variant="bento-mint" style={styles.emptyListings}>
          <SHCMetaBadge kind="label">No dishes match your search</SHCMetaBadge>
        </SHCCard>
      )}
      {filteredListings.length > 0 ? (
        <VirtualRowFlashList
          data={filteredListings}
          scrollEnabled={false}
          testID="cook-listings-virtual-list"
          keyExtractor={(p: any) => String(p.id)}
          renderItem={(p: any, index: number) => (
            <Pressable
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
                      <SHCMetaBadge kind="price">S${p.price}</SHCMetaBadge>
                      <SHCMetaBadge kind="portion_min">{shcPortionMinBadgeLabel(p.min_qty)}</SHCMetaBadge>
                      {p.shc_availability?.paused ? <SHCMetaBadge kind="paused">Paused</SHCMetaBadge> : null}
                    </View>
                  </View>
                </View>
              </SHCCard>
            </Pressable>
          )}
        />
      ) : null}

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
          <SHCListingDescriptionInput value={description} onChange={setDescription} />
        </ListingWizardStep>
      )}

      {step === 2 && (
        <ListingWizardStep step={2} title="Tags & Cuisine">
          <SHCFoodImage uri={CUISINE_IMAGE[cuisine] || BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.md} />
          <Text style={styles.photoPanelHint}>Cuisine (helps AI plate + discovery)</Text>
          <View style={styles.cuisinePresets} testID="listing-cuisine-presets">
            {cuisinePresets.map((c) => (
              <Pressable
                key={c}
                onPress={() => setCuisine(c)}
                style={[styles.cuisineChip, cuisine === c && styles.cuisineChipActive]}
                testID={`cuisine-preset-${c}`}
              >
                <Text style={[styles.cuisineChipText, cuisine === c && styles.cuisineChipTextActive]}>{c}</Text>
              </Pressable>
            ))}
          </View>
          <TextInput
            value={cuisine}
            onChangeText={setCuisine}
            style={inputStyle}
            placeholder="Or type a cuisine"
            testID="listing-cuisine-input"
          />
          <OccasionTagPicker selected={occasionTags} onToggle={toggleTag} />
          <SHCHalalToggle value={halal} onChange={setHalal} />
          <SHCAllergenTierPicker
            value={allergenTiers}
            onChange={setAllergenTiers}
            tier1Presets={cookAllergenTier1Presets(config)}
          />
        </ListingWizardStep>
      )}

      {step === 3 && (
        <ListingWizardStep step={3} title="Ingredients & photo">
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
          <View style={styles.photoPanel} testID="listing-photo-panel">
            <Text style={styles.photoPanelTitle}>Dish photo</Text>
            <Text style={styles.photoPanelHint}>
              Kitchen photo recommended. AI plate is illustrative only.
            </Text>
            {listingImageUrl ? (
              <SHCFoodImage uri={listingImageUrl} height={140} rounded={shcRadii.md} />
            ) : (
              <SHCFoodImage uri={previewImage} height={140} rounded={shcRadii.md} testID="listing-photo-preview" />
            )}
            <View style={styles.photoActions}>
              <SHCButton
                variant="outline"
                disabled={aiPhotoBusy}
                testID="listing-photo-upload"
                onPress={() => void polishFromPicker('upload')}
              >
                <SHCButtonText>Upload photo</SHCButtonText>
              </SHCButton>
              <SHCButton
                variant="outline"
                disabled={aiPhotoBusy}
                testID="listing-photo-brighten"
                onPress={() => void polishFromPicker('brighten')}
              >
                <SHCButtonText>Brighten</SHCButtonText>
              </SHCButton>
              <SHCButton
                variant="outline"
                disabled={aiPhotoBusy || !name.trim() || !generateAvailable}
                testID="listing-photo-generate"
                onPress={() => void runGenerateAi()}
              >
                <SHCButtonText>
                  {aiPhotoBusy ? '…' : generateAvailable ? 'Generate AI' : 'AI offline'}
                </SHCButtonText>
              </SHCButton>
            </View>
            <Text style={styles.photoNote} testID="listing-photo-help">
              Upload = your shot · Brighten = lighting only · Generate = illustrative AI plate
            </Text>
            {!generateAvailable && generateBlockedReason ? (
              <Text style={styles.photoOffline} testID="listing-photo-ai-offline">
                {generateBlockedReason}
              </Text>
            ) : null}
            {aiPhotoNote ? (
              <Text style={styles.photoNote} testID="listing-photo-note">
                {aiPhotoNote}
              </Text>
            ) : null}
          </View>
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
            <SHCMetaBadge kind="photo_tips">📸 Photo tips</SHCMetaBadge>
          </Pressable>
          <SHCMealExtrasEditor value={mealExtras} onChange={setMealExtras} />
          <SHCMealAddonsEditor value={mealAddons} onChange={setMealAddons} />
          <SHCRecipeStepsEditor value={recipeSteps} onChange={setRecipeSteps} />
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
                <SHCMetaBadge kind="price">S${price}</SHCMetaBadge>
              </View>
            }
          />
          <PriceEarningsCalc price={price} qty={minQty} minQty={minQty} />
          <SHCListingAvailabilityEditor
            portionsPerDay={portionsPerDay}
            collectionDays={collectionDays}
            timeSlots={timeSlots}
            onPortionsChange={setPortionsPerDay}
            onCollectionDaysChange={setCollectionDays}
            onTimeSlotsChange={setTimeSlots}
            timeSlotPresets={cookCollectionTimeSlotPresets(config)}
          />
          <SHCLastMinutePremiumInput value={lastMinutePremiumPct} onChange={setLastMinutePremiumPct} />
          <View style={styles.tagRow}>
            {occasionTags.map((t) => (
              <SHCMetaBadge key={t} kind="occasion">{t}</SHCMetaBadge>
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
              <SHCMetaBadge kind="live">{published.name} live</SHCMetaBadge>
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
  photoPanel: {
    marginTop: 8,
    marginBottom: 8,
    padding: shcSpacing.sm,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surface,
    gap: 8,
  },
  photoPanelTitle: { fontSize: 14, fontWeight: '800', color: shcColors.text },
  photoPanelHint: { fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginBottom: 4 },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoNote: { fontSize: 11, fontWeight: '600', color: shcColors.textLight },
  photoOffline: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: shcRadii.sm,
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  cuisinePresets: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 8 },
  cuisineChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
  },
  cuisineChipActive: { backgroundColor: gourmeatColors.primary, borderColor: gourmeatColors.primary },
  cuisineChipText: { fontSize: 12, fontWeight: '800', color: shcColors.text },
  cuisineChipTextActive: { color: '#fff' },
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