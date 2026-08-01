import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  SHCCard,
  SHCButton,
  SHCButtonText,
  PriceEarningsCalc,
  SHCSectionTitle,
  SHCFoodImage,
  SHCMetaBadge,
  SHCFadeIn,
  SHCIcon,
  gourmeatColors,
  shcColors,
  AICalorieBadge,
  PhotoTipsModalContent,
  useSHCTray,
  SHCTrayAction,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
  contentPadForTabBar,
  SHCAllergenTierPicker,
  SHCHalalToggle,
  SHCListingDescriptionInput,
  SHCMealExtrasEditor,
  SHCMealAddonsEditor,
  SHCRecipeStepsEditor,
  SHCIngredientsEditor,
} from '@shc/ui';
import {
  BENTO_ACTION_IMAGES,
  CUISINE_IMAGE,
  getDishImageUrl,
  cookAllergenTier1Presets,
  buildCookListingPayload,
  cookListingToFormDraft,
  E2E_COOK_SEED_LISTING,
  validateCookListingDraft,
  validateCookListingForPublish,
  type IngredientDraft,
  type RecipeStepDraft,
} from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useAICalorieEstimate } from '../hooks/useProducts';
import { getPhotoTips, updateCookListing, generateListingImage, getAiImageStatus } from '../lib/api-client';
import { useAuth } from '../hooks/useAuth';
import { useBusinessRules } from '../hooks/useBusinessRules';
import { useCookConfig } from '../hooks/useCookConfig';

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

function SectionLabel({ children }: { children: string }) {
  return <Text style={styles.sectionLabel}>{children}</Text>;
}

export function CookListingEditScreen({
  listingId,
  initialListing,
  onExit,
}: {
  listingId: string;
  initialListing: Record<string, unknown>;
  onExit: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();
  const { config } = useCookConfig();
  const { commissionRatePct } = useBusinessRules();
  const qc = useQueryClient();
  const { openTray, dismiss } = useSHCTray();
  const aiEstMut = useAICalorieEstimate();

  const [hydrated, setHydrated] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState<number | null>(null);
  const [minQty, setMinQty] = useState<number | null>(null);
  const [cuisine, setCuisine] = useState('');
  const [halal, setHalal] = useState(false);
  const [allergenTiers, setAllergenTiers] = useState(cookListingToFormDraft(initialListing).allergen_tiers);
  const [allergenNoneConfirmed, setAllergenNoneConfirmed] = useState(false);
  const [ingredients, setIngredients] = useState<IngredientDraft[]>([]);
  const [mealExtras, setMealExtras] = useState<import('@shc/utils').MealOptionDraft[]>([]);
  const [mealAddons, setMealAddons] = useState<import('@shc/utils').MealOptionDraft[]>([]);
  const [recipeSteps, setRecipeSteps] = useState<RecipeStepDraft[]>([]);
  const [portionsPerDay, setPortionsPerDay] = useState(18);
  const [collectionDays, setCollectionDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [timeSlots, setTimeSlots] = useState<string[]>(['17:00-19:00', '18:00-20:00']);
  const [listingImageUrl, setListingImageUrl] = useState<string | null>(null);
  const [aiCal, setAiCal] = useState<any>(null);
  const [aiPhotoBusy, setAiPhotoBusy] = useState(false);
  const [aiPhotoNote, setAiPhotoNote] = useState<string | null>(null);
  const [aiImageStatus, setAiImageStatus] = useState<Record<string, unknown> | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const form = cookListingToFormDraft(initialListing);
    setName(form.name);
    setDescription(form.description || '');
    setPrice(form.price);
    setMinQty(form.min_qty);
    setCuisine(form.cuisine);
    setHalal(form.halal);
    setAllergenTiers(form.allergen_tiers);
    setIngredients(form.ingredients);
    setMealExtras(form.meal_extras || []);
    setMealAddons(form.meal_addons || []);
    setRecipeSteps(form.recipe_steps || []);
    setPortionsPerDay(form.portions_per_day);
    setCollectionDays(form.collection_days);
    setTimeSlots(form.time_slots);
    setListingImageUrl(form.image_url || null);
    setAiCal(
      form.calories
        ? { calories: form.calories, confidence: form.calories_confidence || 'category', source: 'saved' }
        : null
    );
    setHydrated(true);
  }, [initialListing]);

  useEffect(() => {
    let cancelled = false;
    void getAiImageStatus()
      .then((st) => {
        if (!cancelled) setAiImageStatus(st || {});
      })
      .catch(() => {
        if (!cancelled) setAiImageStatus({ generate_available: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const cuisinePresets =
    (aiImageStatus?.cuisine_presets as string[] | undefined)?.length
      ? (aiImageStatus?.cuisine_presets as string[])
      : DEFAULT_CUISINE_PRESETS;
  const generateAvailable =
    aiImageStatus?.generate_available === true || aiImageStatus?.configured === true;
  const generateBlockedReason =
    (aiImageStatus?.generate_unavailable_reason as string | undefined) ||
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
      showErrorTray('Photo library needs app rebuild', 'Rebuild the cook app to enable photo upload.');
      return null;
    }
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
      setAiPhotoNote(label === 'brighten' ? 'Brightened your photo' : 'Kitchen photo uploaded');
    } catch (e) {
      showErrorTray(label === 'brighten' ? 'Brighten failed' : 'Upload failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
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
    try {
      const res = await generateListingImage({ mode: 'generate', dish_name: name, cuisine });
      const url = res.webp_url || res.image_url || res.jpeg_url;
      if (!url) throw new Error('No image URL returned');
      setListingImageUrl(url);
      setAiPhotoNote('Illustrative AI plate — prefer a kitchen photo when you can.');
    } catch (e) {
      showErrorTray('AI generate failed', (e as Error).message);
    } finally {
      setAiPhotoBusy(false);
    }
  };

  const listingDraft = useMemo(
    () => ({
      name,
      description,
      price: price ?? 0,
      min_qty: minQty ?? 0,
      cuisine,
      occasion_tags: [] as string[],
      ingredients,
      allergen_tiers: allergenTiers,
      allergen_none_confirmed: allergenNoneConfirmed,
      halal,
      portions_per_day: portionsPerDay,
      collection_days: collectionDays,
      time_slots: timeSlots,
      image_url: listingImageUrl || undefined,
      calories: aiCal?.calories,
      calories_confidence: aiCal?.confidence,
      meal_extras: mealExtras,
      meal_addons: mealAddons,
      recipe_steps: recipeSteps,
    }),
    [
      name,
      description,
      price,
      minQty,
      cuisine,
      ingredients,
      allergenTiers,
      allergenNoneConfirmed,
      halal,
      listingImageUrl,
      aiCal,
      mealExtras,
      mealAddons,
      recipeSteps,
      portionsPerDay,
      collectionDays,
      timeSlots,
      initialListing,
    ]
  );

  const basicsValidation = useMemo(() => validateCookListingDraft(listingDraft), [listingDraft]);

  const save = async () => {
    if (saving) return;
    if (listingId === E2E_COOK_SEED_LISTING.id) {
      showErrorTray('Preview listing', 'This is a demo dish for testing.');
      return;
    }
    if (!user?.id) {
      showErrorTray('Sign in required', 'Please log in as a cook before saving.');
      return;
    }
    const validation = validateCookListingForPublish(listingDraft);
    if (!validation.valid) {
      showErrorTray('Cannot save yet', validation.errors.join(' '));
      return;
    }
    setSaving(true);
    const input = buildCookListingPayload({
      ...listingDraft,
      name: name.trim(),
      price: price as number,
      min_qty: minQty as number,
      image_url: listingImageUrl || getDishImageUrl({ name, cuisine }),
    });
    try {
      await updateCookListing(listingId, input);
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
      onExit();
    } catch (e: any) {
      showErrorTray('Update failed', e?.message || 'Could not save listing.');
    } finally {
      setSaving(false);
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
        { paddingTop: insets.top + shcSpacing.md, paddingBottom: contentPadForTabBar(insets.bottom) + 80 },
      ]}
      keyboardShouldPersistTaps="handled"
      testID="cook-listing-edit-screen"
    >
      <View style={styles.headerRow}>
        <Pressable onPress={onExit} style={styles.backBtn} testID="listing-edit-back" accessibilityRole="button">
          <SHCIcon name="chevron-back" size={24} color={shcColors.text} active />
        </Pressable>
        <View style={{ flex: 1 }}>
          <SHCSectionTitle>Edit listing</SHCSectionTitle>
          <Text style={styles.subtitle}>Update everything on this page, then save.</Text>
        </View>
      </View>

      <SHCFadeIn>
        <SHCCard variant="bento-peach" style={{ marginBottom: shcSpacing.md, overflow: 'hidden', padding: 0 }}>
          <SHCFoodImage uri={previewImage} height={140} rounded={0} />
          <View style={{ padding: shcSpacing.sm }}>
            <Text style={styles.previewName}>{name || 'Your dish'}</Text>
            <SHCMetaBadge kind="price">{price != null ? `S$${price}` : 'Price'}</SHCMetaBadge>
          </View>
        </SHCCard>

        <SectionLabel>Dish basics</SectionLabel>
        <TextInput value={name} onChangeText={setName} placeholder="Dish name" style={inputStyle} testID="listing-name-input" />
        {basicsValidation.fieldErrors.name ? (
          <Text style={styles.fieldError}>{basicsValidation.fieldErrors.name}</Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={price != null ? String(price) : ''}
            onChangeText={(t) => {
              const trimmed = t.trim();
              if (!trimmed) return setPrice(null);
              const n = parseInt(trimmed, 10);
              setPrice(Number.isNaN(n) ? null : n);
            }}
            keyboardType="numeric"
            placeholder="Price S$"
            style={[inputStyle, { flex: 1 }]}
            testID="listing-price-input"
          />
          <TextInput
            value={minQty != null ? String(minQty) : ''}
            onChangeText={(t) => {
              const trimmed = t.trim();
              if (!trimmed) return setMinQty(null);
              const n = parseInt(trimmed, 10);
              setMinQty(Number.isNaN(n) ? null : n);
            }}
            keyboardType="numeric"
            placeholder="Min qty"
            style={[inputStyle, { flex: 1 }]}
            testID="listing-min-qty-input"
          />
        </View>
        <SHCListingDescriptionInput value={description} onChange={setDescription} />

        <SectionLabel>Cuisine & allergens</SectionLabel>
        <SHCFoodImage uri={CUISINE_IMAGE[cuisine] || BENTO_ACTION_IMAGES.listings} height={72} rounded={shcRadii.md} />
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
        <TextInput value={cuisine} onChangeText={setCuisine} style={inputStyle} placeholder="Cuisine" testID="listing-cuisine-input" />
        <SHCHalalToggle value={halal} onChange={setHalal} />
        <SHCAllergenTierPicker
          value={allergenTiers}
          onChange={setAllergenTiers}
          tier1Presets={cookAllergenTier1Presets(config)}
        />
        <Pressable onPress={() => setAllergenNoneConfirmed((v) => !v)} style={{ marginBottom: shcSpacing.md }} testID="listing-allergen-none">
          <Text style={{ fontWeight: '700', color: allergenNoneConfirmed ? shcColors.primary : shcColors.text }}>
            {allergenNoneConfirmed ? '✓ ' : ''}No tier-1 allergens in this dish
          </Text>
        </Pressable>

        <SectionLabel>Ingredients & nutrition</SectionLabel>
        <SHCIngredientsEditor value={ingredients} onChange={setIngredients} />
        <SHCButton
          variant="outline"
          onPress={async () => setAiCal(await aiEstMut.mutateAsync(ingredients))}
          testID="ai-cal-est-btn"
          style={{ marginBottom: shcSpacing.sm }}
        >
          <SHCButtonText>🔥 AI Calories</SHCButtonText>
        </SHCButton>
        {aiCal ? <AICalorieBadge calories={aiCal.calories} confidence={aiCal.confidence} source={aiCal.source} /> : null}

        <SectionLabel>Dish photo</SectionLabel>
        <View style={styles.photoPanel} testID="listing-photo-panel">
          {listingImageUrl ? (
            <SHCFoodImage uri={listingImageUrl} height={140} rounded={shcRadii.md} />
          ) : (
            <SHCFoodImage uri={previewImage} height={140} rounded={shcRadii.md} testID="listing-photo-preview" />
          )}
          <View style={styles.photoActions}>
            <SHCButton variant="outline" disabled={aiPhotoBusy} testID="listing-photo-upload" onPress={() => void polishFromPicker('upload')}>
              <SHCButtonText>Upload</SHCButtonText>
            </SHCButton>
            <SHCButton variant="outline" disabled={aiPhotoBusy} testID="listing-photo-brighten" onPress={() => void polishFromPicker('brighten')}>
              <SHCButtonText>Brighten</SHCButtonText>
            </SHCButton>
            <SHCButton variant="outline" disabled={aiPhotoBusy || !name.trim() || !generateAvailable} testID="listing-photo-generate" onPress={() => void runGenerateAi()}>
              <SHCButtonText>{aiPhotoBusy ? '…' : 'Generate AI'}</SHCButtonText>
            </SHCButton>
          </View>
          {aiPhotoNote ? <Text style={styles.photoNote}>{aiPhotoNote}</Text> : null}
        </View>
        <Pressable
          onPress={async () => {
            openTray(
              { id: 'photo-tips', title: 'Photo tips', height: 'tall' },
              <ScrollView>
                <PhotoTipsModalContent onClose={dismiss} />
              </ScrollView>
            );
          }}
          testID="photo-tips-btn"
          style={styles.photoTipsBtn}
        >
          <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={48} width={48} rounded={shcRadii.sm} />
          <SHCMetaBadge kind="photo_tips">📸 Photo tips</SHCMetaBadge>
        </Pressable>

        <SectionLabel>Meal options</SectionLabel>
        <SHCMealExtrasEditor value={mealExtras} onChange={setMealExtras} />
        <SHCMealAddonsEditor value={mealAddons} onChange={setMealAddons} />
        <SHCRecipeStepsEditor value={recipeSteps} onChange={setRecipeSteps} />

        <SectionLabel>Earnings preview</SectionLabel>
        <PriceEarningsCalc
          price={price ?? 0}
          qty={minQty ?? 0}
          minQty={minQty ?? 0}
          commissionRatePct={commissionRatePct}
        />
        <Text style={styles.hint}>Pause or unpause from My Listings when you want this dish off the menu.</Text>

        <SHCButton
          onPress={() => void save()}
          disabled={saving || !basicsValidation.valid}
          testID="listing-edit-save"
          style={{ marginTop: shcSpacing.lg }}
        >
          <SHCButtonText>{saving ? 'Saving…' : 'Save changes'}</SHCButtonText>
        </SHCButton>
        <SHCButton variant="outline" onPress={onExit} testID="listing-edit-cancel" style={{ marginTop: shcSpacing.sm }}>
          <SHCButtonText>Cancel</SHCButtonText>
        </SHCButton>
      </SHCFadeIn>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  headerRow: { flexDirection: 'row', alignItems: 'flex-start', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  subtitle: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: 2 },
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
  sectionLabel: { fontSize: 15, fontWeight: '900', color: shcColors.text, marginTop: shcSpacing.md, marginBottom: shcSpacing.sm },
  previewName: { fontSize: 18, fontWeight: '900', color: shcColors.text, marginBottom: 6 },
  fieldError: { fontSize: 12, fontWeight: '700', color: '#b91c1c', marginTop: -4, marginBottom: shcSpacing.sm },
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
  photoPanel: {
    marginBottom: shcSpacing.sm,
    padding: shcSpacing.sm,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.md,
    backgroundColor: shcColors.surface,
    gap: 8,
  },
  photoActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  photoNote: { fontSize: 11, fontWeight: '600', color: shcColors.textLight },
  photoTipsBtn: { flexDirection: 'row', alignItems: 'center', gap: shcSpacing.sm, marginBottom: shcSpacing.md },
  hint: { fontSize: 12, fontWeight: '600', color: gourmeatColors.textLight, marginTop: shcSpacing.sm, marginBottom: shcSpacing.sm },
});
