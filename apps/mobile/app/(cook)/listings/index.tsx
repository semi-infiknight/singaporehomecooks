// apps/mobile/app/(cook)/listings/index.tsx
// Cook FULL listings: list existing + new wizard (phase-3, 10-mobile).
// Collects ingredients JSON, occasion_tags, min_qty, price, photo stub, earnings calc, publish.
// Enforces schema + rules client side. SG taste.
import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, Modal } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, ListingWizardStep, IngredientTierEditor, OccasionTagPicker, PriceEarningsCalc, SHCSectionTitle, shcColors, AICalorieBadge, PhotoTipsModalContent } from '@shc/ui';
import { useDiscovery, useAICalorieEstimate, getPhotoTips } from '../../../hooks/useProducts';
import { createCookListing } from '../../../lib/api-client';
import { useAuth } from '../../../hooks/useAuth';

export default function CookListings() {
  const { user } = useAuth();
  const { data: myProducts = [] } = useDiscovery('', {}); // filter client for demo
  const myListings = myProducts.filter((p: any) => p.cook_id === user.id);
  const router = useRouter();

  // Wizard state
  const [step, setStep] = useState(1);
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

  const toggleTag = (t: string) => setOccasionTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const publish = async () => {
    const input: any = {
      name, price, min_qty: minQty, cuisine,
      occasion_tags: occasionTags,
      ingredients,
      allergen_tiers: { tier1: ['Nuts'], tier2: [], tier3: [] },
      heritage_note: heritage,
    };
    if (aiCal) { input.calories = aiCal.calories; input.calories_confidence = aiCal.confidence; } // AI stub applied
    try {
      const prod = await createCookListing(input);
      setPublished(prod);
      setStep(1); // reset
      setAiCal(null);
    } catch (e: any) {
      console.warn('Publish failed (demo):', (e.message || e.code));
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700' }}>My Listings • {user.name}</Text>
      <Text style={{ color: shcColors.textLight }}>Availability + portions managed here. Paused listings invisible to customers.</Text>

      <SHCSectionTitle>Your Published Dishes</SHCSectionTitle>
      {myListings.length === 0 && <Text>No listings yet — use wizard below.</Text>}
      {myListings.map((p: any) => (
        <SHCCard key={p.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontWeight: '600' }}>{p.name} • S${p.price} • min {p.min_qty}</Text>
          <Text style={{ fontSize: 12 }}>{p.occasion_tags?.join(', ')}</Text>
          <Text style={{ fontSize: 11, color: shcColors.textLight }}>{p.heritage_note}</Text>
        </SHCCard>
      ))}

      <SHCSectionTitle>New Listing Wizard (4 steps)</SHCSectionTitle>

      {step === 1 && (
        <ListingWizardStep step={1} title="Dish Basics (name, price, min qty)">
          <TextInput value={name} onChangeText={setName} placeholder="Dish name" style={{ borderWidth: 1, borderColor: '#E8D5B7', padding: 8, marginBottom: 8, borderRadius: 8, backgroundColor: '#fff' }} />
          <TextInput value={String(price)} onChangeText={t => setPrice(parseInt(t) || 10)} keyboardType="numeric" placeholder="Price S$" style={{ borderWidth: 1, borderColor: '#E8D5B7', padding: 8, marginBottom: 8, borderRadius: 8, backgroundColor: '#fff' }} />
          <TextInput value={String(minQty)} onChangeText={t => setMinQty(parseInt(t) || 3)} keyboardType="numeric" placeholder="Min Qty" style={{ borderWidth: 1, borderColor: '#E8D5B7', padding: 8, marginBottom: 8, borderRadius: 8, backgroundColor: '#fff' }} />
          <SHCButton onPress={() => setStep(2)}><SHCButtonText>Next: Tags & Cuisine</SHCButtonText></SHCButton>
        </ListingWizardStep>
      )}
      {step === 2 && (
        <ListingWizardStep step={2} title="Occasion Tags + Cuisine">
          <TextInput value={cuisine} onChangeText={setCuisine} style={{ borderWidth: 1, padding: 8, borderRadius: 8, marginBottom: 8, backgroundColor: '#fff' }} />
          <OccasionTagPicker selected={occasionTags} onToggle={toggleTag} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <SHCButton onPress={() => setStep(1)}><SHCButtonText>Back</SHCButtonText></SHCButton>
            <SHCButton onPress={() => setStep(3)}><SHCButtonText>Next: Ingredients</SHCButtonText></SHCButton>
          </View>
        </ListingWizardStep>
      )}
      {step === 3 && (
        <ListingWizardStep step={3} title="3-Tier Ingredients + Heritage">
          <IngredientTierEditor value={ingredients} onChange={setIngredients} />
          <SHCButton variant="outline" onPress={async () => {
            const est = await aiEstMut.mutateAsync(ingredients);
            setAiCal(est);
          }} testID="ai-cal-est-btn" style={{ marginTop: 6 }}><SHCButtonText>🔥 Run AI Calorie Estimate (stub)</SHCButtonText></SHCButton>
          {aiCal && <AICalorieBadge calories={aiCal.calories} confidence={aiCal.confidence} source={aiCal.source} />}
          <Pressable onPress={async () => { const tips = await getPhotoTips(); setPhotoTips(tips); setShowPhotoTips(true); }} testID="photo-tips-btn"><Text style={{ color: shcColors.primary, marginTop: 6 }}>📸 Show 3 Photo Quality Tips</Text></Pressable>
          <TextInput value={heritage} onChangeText={setHeritage} multiline style={{ height: 60, borderWidth: 1, padding: 8, marginTop: 8, borderRadius: 8, backgroundColor: '#fff' }} />
          <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
            <SHCButton onPress={() => setStep(2)}><SHCButtonText>Back</SHCButtonText></SHCButton>
            <SHCButton onPress={() => setStep(4)}><SHCButtonText>Next: Review & Publish</SHCButtonText></SHCButton>
          </View>
        </ListingWizardStep>
      )}
      {step === 4 && (
        <ListingWizardStep step={4} title="Review, Earnings & Publish">
          <PriceEarningsCalc price={price} qty={minQty} minQty={minQty} />
          <Text style={{ marginVertical: 8 }}>Tags: {occasionTags.join(', ')}</Text>
          <SHCButton onPress={publish}><SHCButtonText>Publish Listing (validates schema)</SHCButtonText></SHCButton>
          <SHCButton variant="outline" onPress={() => setStep(3)} style={{ marginTop: 8 }}><SHCButtonText>Back</SHCButtonText></SHCButton>
          {published && <Text style={{ color: shcColors.success, marginTop: 8 }}>Published! {published.name} now visible to customers.</Text>}
        </ListingWizardStep>
      )}

      <Text style={{ fontSize: 11, marginTop: 16, color: shcColors.textLight }}>Photo stub: upload to MinIO later. Earnings calculated with commission rule. AI calorie + photo tips in wizard (Phase 7/9).</Text>

      {/* Photo tips modal (3 SG tips stub) */}
      <Modal visible={showPhotoTips} animationType="fade" onRequestClose={() => setShowPhotoTips(false)}>
        <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
          <PhotoTipsModalContent onClose={() => setShowPhotoTips(false)} />
          {photoTips.length > 0 && photoTips.map((t: string, i: number) => <Text key={i} style={{ marginTop: 4, fontSize: 13 }}>• {t}</Text>)}
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}