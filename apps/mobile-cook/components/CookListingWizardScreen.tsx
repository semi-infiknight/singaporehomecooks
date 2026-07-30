import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, Keyboard, ActivityIndicator } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
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
  SHCMetaBadge,
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
  ListingWizardMorphCta,
  SHCCelebration,
  useMilestoneCelebration,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
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
  getDishImageUrl,
  cookAllergenTier1Presets,
  resolveCookCollectionTimeSlots,
  buildCookListingPayload,
  emptyAllergenTiers,
  DEFAULT_LISTING_AVAILABILITY,
  allergenTiersFromListing,
  availabilityFromListing,
  mealOptionsFromListing,
  recipeStepsFromListing,
  defaultListingOccasionTag,
  listingOccasionTagOptions,
  type RecipeStepDraft,
} from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAICalorieEstimate } from '../hooks/useProducts';
import {
  getPhotoTips,
  createCookListing,
  updateCookListing,
  generateListingImage,
  getAiImageStatus,
} from '../lib/api-client';
import { useAuth } from '../hooks/useAuth';
import { useBusinessRules } from '../hooks/useBusinessRules';
import { useCookConfig } from '../hooks/useCookConfig';
import { useCookProfile } from '../hooks/useCookProfile';
import { useCustomerConfig } from '../hooks/useCustomerConfig';

const DEFAULT_CUISINE_PRESETS = ['Peranakan', 'Malay', 'Chinese', 'Indian', 'Eurasian', 'Western', 'Fusion'];

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

function listingToForm(listing: any, defaultOccasionTag: string) {
  const avail = availabilityFromListing(listing.shc_availability);
  const mealMeta = mealOptionsFromListing(listing);
  return {
    name: listing.name || 'Dish',
    description: listing.description || '',
    price: Number(listing.price) || 12,
    minQty: Number(listing.min_qty) || 4,
    cuisine: listing.cuisine || 'Singapore',
    halal: !!listing.halal,
    allergenTiers: allergenTiersFromListing(listing.allergen_tiers),
    portionsPerDay: avail.portions_per_day,
    collectionDays: avail.collection_days,
    timeSlots: avail.time_slots,
    lastMinutePremiumPct:
      typeof listing.last_minute_premium_pct === 'number' ? listing.last_minute_premium_pct : null,
    occasionTags: listing.occasion_tags?.length ? listing.occasion_tags : [defaultOccasionTag],
    ingredients: listing.ingredients?.length ? listing.ingredients : [{ name: 'Chicken', quantity: 300, unit: 'g' }],
    mealExtras: mealMeta.extras,
    mealAddons: mealMeta.addons,
    recipeSteps: recipeStepsFromListing(listing),
    listingImageUrl: listing.image_url || null,
    aiCal: listing.calories
      ? { calories: listing.calories, confidence: listing.calories_confidence || 'category', source: 'saved' }
      : null,
  };
}

export function CookListingWizardScreen({
  editingId,
  initialListing,
  onExit,
}: {
  editingId: string | null;
  initialListing?: any;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wizardStep } = useLocalSearchParams<{ wizardStep?: string }>();
  const { user } = useAuth();
  const { config } = useCookConfig();
  const { config: browseConfig } = useCustomerConfig();
  const occasionOptions = useMemo(() => listingOccasionTagOptions(browseConfig), [browseConfig]);
  const defaultOccasionTag = useMemo(() => defaultListingOccasionTag(browseConfig), [browseConfig]);
  const { commissionRatePct } = useBusinessRules();
  const { data: cookProfile } = useCookProfile();
  const collectionTimeSlots = resolveCookCollectionTimeSlots(cookProfile);
  const qc = useQueryClient();
  const { openTray, dismiss } = useSHCTray();
  const {
    show: showCelebration,
    triggerIfFirst,
    dismiss: dismissCelebration,
  } = useMilestoneCelebration('first_listing_publish', user?.id || '', milestoneStorage);

  const step = Math.min(4, Math.max(1, parseInt(String(wizardStep ?? '1'), 10) || 1));

  const goToStep = (next: number) => {
    Keyboard.dismiss();
    router.setParams({ wizardStep: String(next) } as Record<string, string>);
  };

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [minQty, setMinQty] = useState<number | null>(null);
  const [cuisine, setCuisine] = useState('');
  const [halal, setHalal] = useState(false);
  const [allergenTiers, setAllergenTiers] = useState(emptyAllergenTiers);
  const [portionsPerDay, setPortionsPerDay] = useState(DEFAULT_LISTING_AVAILABILITY.portions_per_day);
  const [collectionDays, setCollectionDays] = useState<number[]>([...DEFAULT_LISTING_AVAILABILITY.collection_days]);
  const [timeSlots, setTimeSlots] = useState<string[]>([...DEFAULT_LISTING_AVAILABILITY.time_slots]);
  const [lastMinutePremiumPct, setLastMinutePremiumPct] = useState<number | null>(null);
  const [occasionTags, setOccasionTags] = useState<string[]>([]);
  const [ingredients, setIngredients] = useState<Array<{ name: string; quantity: number; unit: string }>>([]);
  const [mealExtras, setMealExtras] = useState<import('@shc/utils').MealOptionDraft[]>([]);
  const [mealAddons, setMealAddons] = useState<import('@shc/utils').MealOptionDraft[]>([]);
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
  const [publishing, setPublishing] = useState(false);
  const [hydrated, setHydrated] = useState(!initialListing);

  useEffect(() => {
    if (!initialListing) return;
    const form = listingToForm(initialListing, defaultOccasionTag);
    setName(form.name);
    setDescription(form.description);
    setPrice(form.price);
    setMinQty(form.minQty);
    setCuisine(form.cuisine);
    setHalal(form.halal);
    setAllergenTiers(form.allergenTiers);
    setPortionsPerDay(form.portionsPerDay);
    setCollectionDays(form.collectionDays);
    setTimeSlots(form.timeSlots);
    setLastMinutePremiumPct(form.lastMinutePremiumPct);
    setOccasionTags(form.occasionTags);
    setIngredients(form.ingredients);
    setMealExtras(form.mealExtras);
    setMealAddons(form.mealAddons);
    setRecipeSteps(form.recipeSteps);
    setListingImageUrl(form.listingImageUrl);
    setAiCal(form.aiCal);
    setHydrated(true);
  }, [initialListing, defaultOccasionTag]);

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st: Record<string, unknown>) => {
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

  const previewImage = listingImageUrl || getDishImageUrl({ name, cuisine });

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
      price: price ?? 0,
      min_qty: minQty ?? 0,
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
        const celebrated = await triggerIfFirst();
        if (!celebrated) onExit();
      } else {
        onExit();
      }
    } catch (e: any) {
      const message = e?.message || e?.code || 'Could not save listing. Check your connection and try again.';
      showErrorTray(editingId ? 'Update failed' : 'Publish failed', message);
    } finally {
      setPublishing(false);
    }
  };

  if (!hydrated) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top, alignItems: 'center', justifyContent: 'center' }]}>
        <ActivityIndicator color={gourmeatColors.primary} />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) },
      ]}
      keyboardShouldPersistTaps="handled"
      testID="cook-listing-wizard-screen"
    >
      <View style={styles.headerRow}>
        <Pressable
          onPress={onExit}
          style={styles.backBtn}
          testID="listing-wizard-back"
          accessibilityRole="button"
          accessibilityLabel="Back to listings"
        >
          <SHCIcon name="chevron-back" size={24} color={shcColors.text} active />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SHCSectionTitle>{editingId ? 'Edit Listing' : 'New Listing'}</SHCSectionTitle>
        </View>
      </View>

      <SHCFadeIn>
        <SHCWizardProgress step={step} />
      </SHCFadeIn>

      <SHCWizardPane stepKey={step}>
        {step === 1 && (
          <ListingWizardStep step={1} title="Dish Basics">
            <SHCFoodImage uri={previewImage} height={100} rounded={shcRadii.md} />
            <TextInput value={name} onChangeText={setName} placeholder="Dish name" style={inputStyle} />
            <TextInput
              value={price != null ? String(price) : ''}
              onChangeText={(t) => {
                const trimmed = t.trim();
                if (!trimmed) {
                  setPrice(null);
                  return;
                }
                const n = parseInt(trimmed, 10);
                setPrice(Number.isNaN(n) ? null : n);
              }}
              keyboardType="numeric"
              placeholder="Price S$"
              style={inputStyle}
            />
            <TextInput
              value={minQty != null ? String(minQty) : ''}
              onChangeText={(t) => {
                const trimmed = t.trim();
                if (!trimmed) {
                  setMinQty(null);
                  return;
                }
                const n = parseInt(trimmed, 10);
                setMinQty(Number.isNaN(n) ? null : n);
              }}
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
            <OccasionTagPicker selected={occasionTags} onToggle={toggleTag} options={occasionOptions} />
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
                    <SHCMetaBadge kind="price">{price != null ? `S$${price}` : 'Price TBD'}</SHCMetaBadge>
                  </View>
                }
              />
              <PriceEarningsCalc
                price={price ?? 0}
                qty={minQty ?? 0}
                minQty={minQty ?? 0}
                commissionRatePct={commissionRatePct}
              />
              <SHCListingAvailabilityEditor
                portionsPerDay={portionsPerDay}
                collectionDays={collectionDays}
                timeSlots={timeSlots}
                onPortionsChange={setPortionsPerDay}
                onCollectionDaysChange={setCollectionDays}
                onTimeSlotsChange={setTimeSlots}
                timeSlotPresets={collectionTimeSlots}
              />
              <SHCLastMinutePremiumInput value={lastMinutePremiumPct} onChange={setLastMinutePremiumPct} />
              <View style={styles.tagRow}>
                {occasionTags.map((t) => (
                  <SHCMetaBadge key={t} kind="occasion">{t}</SHCMetaBadge>
                ))}
              </View>
              {publishing ? <ActivityIndicator color={gourmeatColors.primary} style={{ marginTop: 8 }} /> : null}
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
        onDone={() => {
          dismissCelebration();
          onExit();
        }}
        testID="first-listing-celebration"
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginBottom: shcSpacing.sm },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: shcRadii.md,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    ...shcShadows.brutalSm,
  },
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
  tipItem: { marginTop: 4, fontSize: 13 },
});
