import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, AllergenAckCheckbox, PriceEarningsCalc, SHCBadge, SHCSectionTitle, shcColors } from '@shc/ui';
import { useProduct, useAddToCart, useCollectionSlots } from '../../../hooks/useProducts';
import { useCart } from '../../../hooks/useProducts';
import { createSHCError } from '../../../lib/api-client';

// Full product detail: 3-tier ingredients, video stub, heritage archive, calorie traffic, min qty, allergen gate using business rule + SHCErrorCode display.
export default function ProductDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: product, isLoading } = useProduct(id || '');
  const { data: slots } = useCollectionSlots(id || '');
  const addMut = useAddToCart();
  const { data: cart } = useCart();
  const [allergenAck, setAllergenAck] = useState(false);
  const [qty, setQty] = useState(5);
  const [error, setError] = useState<string | null>(null);

  if (isLoading || !product) return <Text style={{ padding: 16 }}>Loading heritage dish...</Text>;

  const total = product.price * qty;
  const tier1 = product.allergen_tiers?.tier1 || product.allergens || [];

  const handleAdd = async () => {
    setError(null);
    if (!allergenAck) {
      setError('Allergen acknowledgment required (SHC-CART-003 per 08-marketplace-rules.md)');
      return;
    }
    try {
      await addMut.mutateAsync({ productId: product.id, qty });
      router.push('/(customer)/cart' as any);
    } catch (e: any) {
      const msg = e?.message || (e.code ? `${e.code}: ${e.message}` : 'Failed to add');
      setError(msg);
    }
  };

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: shcColors.text }}>{product.name}</Text>
      <Text style={{ color: shcColors.accent }}>by {product.cook_name} • S${product.price}/portion • {product.area || 'Singapore HDB'}</Text>

      <SHCCard style={{ marginVertical: 12, backgroundColor: shcColors.surfaceAlt }}>
        <Text style={{ fontStyle: 'italic', color: shcColors.heritage }}>{product.heritage_note}</Text>
        <Text style={{ marginTop: 8, fontSize: 11, color: shcColors.textLight }}>Heritage archive stub: Story from 1972 Katong kitchen • family HDB recipes preserved for next generation.</Text>
      </SHCCard>

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 8 }}>
        <SHCBadge variant="heritage">{product.cuisine}</SHCBadge>
        {product.halal && <SHCBadge variant="success">Halal</SHCBadge>}
        <Text style={{ color: shcColors.textLight }}>min qty {product.min_qty}</Text>
      </View>

      {/* Calorie traffic light */}
      <Text style={{ color: product.calories_confidence === 'full' ? shcColors.trafficGreen : shcColors.trafficYellow }}>
        Calories: {product.calories} ({product.calories_confidence} confidence)
      </Text>

      <SHCSectionTitle>3-Tier Ingredients Disclosure</SHCSectionTitle>
      <SHCCard>
        <Text style={{ fontWeight: '600', color: shcColors.error }}>Tier 1 (Mandatory allergens): {(product.allergen_tiers?.tier1 || []).join(', ') || 'None declared'}</Text>
        <Text style={{ marginTop: 4 }}>Tier 2: {(product.allergen_tiers?.tier2 || []).join(', ') || '—'}</Text>
        <Text>Tier 3 (trace): {(product.allergen_tiers?.tier3 || []).join(', ') || '—'}</Text>
        <Text style={{ marginTop: 8, fontSize: 13 }}>Full ingredients: {JSON.stringify(product.ingredients)}</Text>
      </SHCCard>

      {/* Video stub + heritage */}
      <SHCSectionTitle>Video Walkthrough (stub)</SHCSectionTitle>
      <SHCCard><Text style={{ color: shcColors.textLight }}>📹 Video player stub — cook demo of prep in HDB kitchen. (Real: Expo AV / YouTube later)</Text></SHCCard>

      <SHCSectionTitle>Quantity (min {product.min_qty})</SHCSectionTitle>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16, marginBottom: 12 }}>
        <Pressable onPress={() => setQty(Math.max(product.min_qty, qty - 1))}><Text style={{ fontSize: 28, color: shcColors.primary }}>-</Text></Pressable>
        <Text style={{ fontSize: 22, fontWeight: '600' }}>{qty}</Text>
        <Pressable onPress={() => setQty(qty + 1)}><Text style={{ fontSize: 28, color: shcColors.primary }}>+</Text></Pressable>
      </View>

      <AllergenAckCheckbox checked={allergenAck} onChange={setAllergenAck} tier1={tier1} />

      {error && <Text style={{ color: shcColors.error, marginVertical: 8 }}>{error}</Text>}

      <PriceEarningsCalc price={product.price} qty={qty} minQty={product.min_qty} />

      <SHCButton onPress={handleAdd} disabled={!allergenAck || addMut.isPending} style={{ marginTop: 12 }} testID="add-to-cart-btn">
        <SHCButtonText>{addMut.isPending ? 'Adding...' : 'Add to Cart (one cook only)'}</SHCButtonText>
      </SHCButton>

      <Text style={{ fontSize: 11, marginTop: 8, color: shcColors.textLight }}>One-cook + min-qty + allergen rules enforced live via @shc/business-rules.</Text>

      <View style={{ marginTop: 20 }}>
        <SHCButton variant="outline" onPress={() => router.push('/(customer)/cart' as any)}>
          <SHCButtonText>Go to Cart</SHCButtonText>
        </SHCButton>
      </View>

      {/* Public trust content render (from seed + content/trust-and-safety.md) */}
      <SHCCard style={{ marginTop: 24, padding: 12, backgroundColor: shcColors.surface }}>
        <SHCSectionTitle>Trust, Collection &amp; Guarantees</SHCSectionTitle>
        <Text style={{ fontSize: 13, color: shcColors.textLight, marginBottom: 6 }}>5-layer trust: PDPA address gate, allergen ack, one-cook, verified cooks, post-collect review.</Text>
        <Text style={{ fontSize: 12, marginTop: 4 }}>Address released only after payment. HDB collection instructions shared in chat.</Text>
        <Text style={{ fontSize: 12, marginTop: 4, color: shcColors.accent }}>Money-back if not as described (see trust copy).</Text>
        <Text style={{ fontSize: 11, marginTop: 8, color: shcColors.textLight }}>Allergen ack is mandatory before add-to-cart (see above). Common local allergens listed in dish meta. Full policy: content/trust-and-safety.md. PayNow: content/paynow-flow.md</Text>
      </SHCCard>
    </ScrollView>
  );
}
