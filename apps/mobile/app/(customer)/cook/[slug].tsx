import React from 'react';
import { View, Text, ScrollView, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, SHCSectionTitle, shcColors } from '@shc/ui';
import { useCook, useDiscovery } from '../../../hooks/useProducts';

export default function CookProfile() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data: cook } = useCook(slug || '');
  const { data: allProducts = [] } = useDiscovery('', {});
  const router = useRouter();

  const listings = allProducts.filter((p: any) => p.cook_id === cook?.id || p.cook_id?.includes(slug || ''));

  if (!cook) return <Text style={{ padding: 16 }}>Loading cook profile from HDB kitchen...</Text>;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 24, fontWeight: '700', color: shcColors.text }}>{cook.display_name}</Text>
      <Text style={{ color: shcColors.accent, marginBottom: 4 }}>{cook.area} • Verified home cook • HDB collection only</Text>
      {cook.rating && <Text style={{ color: shcColors.textLight }}>{cook.rating}★ ({cook.orders || 300}+ orders served)</Text>}

      <SHCCard style={{ marginVertical: 12 }}>
        <Text style={{ fontStyle: 'italic', color: shcColors.heritage }}>{cook.story}</Text>
        <Text style={{ marginTop: 8, fontSize: 12 }}>Collection: {cook.collection_instructions || 'Details released after payment confirmation.'}</Text>
      </SHCCard>

      <SHCSectionTitle>Listings (available slots checked at checkout)</SHCSectionTitle>
      {listings.length === 0 && <Text>No active listings. Check back or request custom.</Text>}
      {listings.map((l: any) => (
        <Pressable key={l.id} onPress={() => router.push(`/(customer)/product/${l.id}` as any)}>
          <SHCCard style={{ marginBottom: 10 }}>
            <Text style={{ fontWeight: '600' }}>{l.name} • S${l.price}</Text>
            <Text style={{ fontSize: 12, color: shcColors.textLight }}>{l.occasion_tags?.join(' • ')} • min {l.min_qty} • ~{l.calories} cal</Text>
          </SHCCard>
        </Pressable>
      ))}

      <SHCButton onPress={() => router.push('/(customer)/cart' as any)} style={{ marginTop: 12 }}>
        <SHCButtonText>Browse cart &amp; proceed to checkout</SHCButtonText>
      </SHCButton>
      <Text style={{ marginTop: 8, fontSize: 11, color: shcColors.textLight }}>All listings enforce one-cook cart rule + portions availability.</Text>

      <SHCCard style={{ marginTop: 16, backgroundColor: shcColors.surface }}>
        <Text style={{ fontSize: 12, color: shcColors.textLight }}>Cook profile: HDB collection transparency + heritage story live. Full trust: content/trust-and-safety.md</Text>
      </SHCCard>
    </ScrollView>
  );
}
