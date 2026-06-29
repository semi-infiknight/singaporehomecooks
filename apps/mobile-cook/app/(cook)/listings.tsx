import React, { useState, useRef, useEffect } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal, StyleSheet, Keyboard } from 'react-native';
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
  SHCWizardProgress,

  SHCFadeIn,
  SHCIcon,
  gourmeatColors,
  shcColors,
  AICalorieBadge,
  PhotoTipsModalContent,
  shcSpacing,
  shcBorders,
  shcRadii,
  shcShadows,
} from '@shc/ui';
import { BENTO_ACTION_IMAGES, getDishImageUrl, CUISINE_IMAGE } from '@shc/utils';
import { useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAICalorieEstimate, useCookListings } from '../../hooks/useProducts';
import { getPhotoTips, createCookListing } from '../../lib/api-client';
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

export default function CookListings() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { wizardStep } = useLocalSearchParams<{ wizardStep?: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: myListings = [] } = useCookListings();

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
  const [showPhotoTips, setShowPhotoTips] = useState(false);
  const [aiCal, setAiCal] = useState<any>(null);
  const aiEstMut = useAICalorieEstimate();
  const [photoTips, setPhotoTips] = useState<string[]>([]);

  const previewImage = getDishImageUrl({ name, cuisine });

  const toggleTag = (t: string) =>
    setOccasionTags((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));

  const publish = async () => {
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
      if (uploadRes?.webp_url || uploadRes?.url) {
        input.image_url = uploadRes.webp_url || uploadRes.url; // prefer optimized WebP derivative
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
      const prod = await createCookListing(input);
      setPublished(prod);
      await qc.invalidateQueries({ queryKey: ['cook-listings'] });
      goToStep(1);
      setAiCal(null);
    } catch (e: any) {
      console.warn('Publish failed (demo):', e.message || e.code);
    }
  };

  return (
    <ScrollView
      ref={scrollRef}
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + shcSpacing.md, paddingBottom: 100 }]}
      keyboardShouldPersistTaps="handled"
      testID="cook-listings-screen"
    >
      <GourmeatCookHeader
        title="My Listings"
        subtitle={user?.name}
        testID="listings-hero"
        badges={
          <View style={styles.heroBadges}>
            <Text style={styles.heroDishName} numberOfLines={1}>{name}</Text>
            <View style={styles.heroBadgeRow}>
              <SHCBadge variant="warning">⏸ Paused = hidden</SHCBadge>
              <SHCBadge variant="heritage">{cuisine}</SHCBadge>
              <SHCBadge variant="default">S${price}</SHCBadge>
            </View>
          </View>
        }
      />

      <SHCSectionTitle>Published</SHCSectionTitle>
      {myListings.length === 0 && (
        <SHCCard variant="bento-mint" style={styles.emptyListings}>
          <SHCFoodImage uri={CUISINE_IMAGE.Peranakan} height={80} rounded={shcRadii.md} />
          <SHCBadge variant="default">No listings yet</SHCBadge>
        </SHCCard>
      )}
      {myListings.map((p: any) => (
        <SHCCard key={p.id} style={styles.listingCard}>
          <View style={styles.listingRow}>
            <SHCFoodImage
              uri={getDishImageUrl({ name: p.name, cuisine: p.cuisine })}
              width={64}
              height={64}
              rounded={shcRadii.md}
            />
            <View style={styles.listingInfo}>
              <Text style={styles.listingName} numberOfLines={1}>{p.name}</Text>
              <View style={styles.listingBadges}>
                <SHCBadge variant="default">S${p.price}</SHCBadge>
                <SHCBadge variant="heritage">min {p.min_qty}</SHCBadge>
              </View>
            </View>
          </View>
        </SHCCard>
      ))}

      <View
        onLayout={(e) => {
          wizardY.current = e.nativeEvent.layout.y;
        }}
      >
      <SHCFadeIn>
        <SHCSectionTitle style={styles.wizardTitle}>New Listing</SHCSectionTitle>
        <SHCWizardProgress step={step} />
      </SHCFadeIn>
      </View>

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
          <TouchableOpacity
            onPress={() => goToStep(2)}
            testID="listing-wizard-next-step1"
            accessibilityRole="button"
            activeOpacity={0.85}
            style={{ marginTop: shcSpacing.sm, backgroundColor: gourmeatColors.primary, padding: 14, borderRadius: shcRadii.md, alignItems: 'center' }}
          >
            <Text style={{ color: gourmeatColors.onPrimary, fontWeight: '800', fontSize: 15 }}>Next →</Text>
          </TouchableOpacity>
        </ListingWizardStep>
      )}

      {step === 2 && (
        <ListingWizardStep step={2} title="Tags & Cuisine">
          <SHCFoodImage uri={CUISINE_IMAGE[cuisine] || BENTO_ACTION_IMAGES.listings} height={80} rounded={shcRadii.md} />
          <TextInput value={cuisine} onChangeText={setCuisine} style={inputStyle} />
          <OccasionTagPicker selected={occasionTags} onToggle={toggleTag} />
          <View style={styles.navRow}>
            <SHCButton onPress={() => goToStep(1)}>
              <SHCButtonText>←</SHCButtonText>
            </SHCButton>
            <SHCButton onPress={() => goToStep(3)} testID="listing-wizard-next-step2">
              <SHCButtonText>Next →</SHCButtonText>
            </SHCButton>
          </View>
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
              setPhotoTips((tips as { tips?: string[] }).tips || []);
              setShowPhotoTips(true);
            }}
            testID="photo-tips-btn"
            style={styles.photoTipsBtn}
          >
            <SHCFoodImage uri={BENTO_ACTION_IMAGES.listings} height={48} width={48} rounded={shcRadii.sm} />
            <SHCBadge variant="heritage">📸 Photo tips</SHCBadge>
          </Pressable>
          <TextInput value={heritage} onChangeText={setHeritage} multiline style={[inputStyle, { height: 60 }]} />
          <View style={styles.navRow}>
            <SHCButton onPress={() => goToStep(2)}>
              <SHCButtonText>←</SHCButtonText>
            </SHCButton>
            <SHCButton onPress={() => goToStep(4)} testID="listing-wizard-next-step3">
              <SHCButtonText>Next →</SHCButtonText>
            </SHCButton>
          </View>
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
          <SHCButton onPress={publish} testID="listing-wizard-publish">
            <SHCButtonText>Publish</SHCButtonText>
          </SHCButton>
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


      <Modal visible={showPhotoTips} animationType="fade" onRequestClose={() => setShowPhotoTips(false)}>
        <ScrollView style={styles.modalScroll}>
          <PhotoTipsModalContent onClose={() => setShowPhotoTips(false)} />
          {photoTips.map((t: string, i: number) => (
            <Text key={i} style={styles.tipItem}>• {t}</Text>
          ))}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: gourmeatColors.background },
  content: { paddingHorizontal: shcSpacing.md },
  heroBadges: { gap: 6 },
  heroDishName: { color: gourmeatColors.text, fontWeight: '900', fontSize: 18 },
  heroBadgeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 },
  emptyListings: { alignItems: 'center', gap: shcSpacing.sm, paddingVertical: shcSpacing.md },
  listingCard: { marginBottom: shcSpacing.sm },
  listingRow: { flexDirection: 'row', gap: shcSpacing.sm, alignItems: 'center' },
  listingInfo: { flex: 1, gap: 4 },
  listingName: { fontWeight: '700', fontSize: 15 },
  listingBadges: { flexDirection: 'row', gap: 6 },
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

  modalScroll: { flex: 1, backgroundColor: gourmeatColors.background, padding: shcSpacing.md },
  tipItem: { marginTop: 4, fontSize: 13 },
});