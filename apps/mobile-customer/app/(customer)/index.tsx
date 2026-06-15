import React, { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { Link, useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, SHCBadge, shcColors } from '@shc/ui';
import { useProducts } from '../../hooks/useProducts';
import { useAuth } from '../../hooks/useAuth';

// (customer)/index.tsx per 10-mobile.md route map — full discovery with more filters (occasion + calorie traffic light + maxCal).
// Wired to shcApi / mock-service (enforces rules). Rich seeds from Content.
export default function CustomerDiscover() {
  const [query, setQuery] = useState('');
  const [occasionFilter, setOccasionFilter] = useState('');
  const [maxCal, setMaxCal] = useState<number | undefined>(undefined);
  const { user } = useAuth();
  const { data: products = [], isLoading } = useProducts(query, { occasion: occasionFilter || undefined, maxCal });
  const router = useRouter();

  const occasions = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Family Gathering', 'Birthday', 'Wedding', 'Christmas'];

  const goToCook = (slug: string) => router.push(`/(customer)/cook/${slug}` as any);
  const goToProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  const calFilterOptions = [
    { label: 'All cals', val: undefined },
    { label: '<400 green', val: 400 },
    { label: '<550 amber', val: 550 },
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background }} contentContainerStyle={{ padding: 16 }}>
      <View style={{ marginBottom: 16 }}>
        <Text style={{ fontSize: 26, fontWeight: '700', color: shcColors.text }}>Singapore Home Cooks</Text>
        <Text style={{ fontSize: 14, color: shcColors.textLight, fontStyle: 'italic' }}>Heritage recipes • HDB kitchens • Planned occasions only • One cook per order</Text>
        <Text style={{ marginTop: 4, fontSize: 11 }}>Welcome, {user?.name || 'guest'}.</Text>
      </View>

      <TextInput
        placeholder="Search dishes, cooks, heritage (e.g. Nasi Lemak, Katong, Hari Raya)"
        value={query}
        onChangeText={setQuery}
        style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 10, padding: 12, marginBottom: 12 }}
        testID="search-input"
      />

      <Text style={{ fontSize: 12, color: shcColors.textLight, marginBottom: 4 }}>Occasion filters (from seed content):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 8 }}>
        <Pressable onPress={() => setOccasionFilter('')} style={{ padding: 8, backgroundColor: !occasionFilter ? shcColors.primary : shcColors.surface, borderRadius: 999, marginRight: 8 }}>
          <Text style={{ color: !occasionFilter ? '#fff' : shcColors.text, fontSize: 12 }}>All</Text>
        </Pressable>
        {occasions.map((o: string) => (
          <Pressable key={o} onPress={() => setOccasionFilter(o)} style={{ paddingHorizontal: 12, paddingVertical: 8, backgroundColor: occasionFilter === o ? shcColors.primary : shcColors.surface, borderRadius: 999, marginRight: 6 }}>
            <Text style={{ color: occasionFilter === o ? '#fff' : shcColors.text, fontSize: 12 }}>{o}</Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* More discovery filters per 10-mobile + phase-4: calorie traffic light + maxCal */}
      <Text style={{ fontSize: 12, color: shcColors.textLight, marginBottom: 4 }}>Calorie filter (traffic light badge below uses green/amber/red):</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
        {calFilterOptions.map((opt, i) => (
          <Pressable key={i} onPress={() => setMaxCal(opt.val)} style={{ paddingHorizontal: 10, paddingVertical: 6, backgroundColor: maxCal === opt.val ? shcColors.primary : shcColors.surface, borderRadius: 999, marginRight: 6 }}>
            <Text style={{ color: maxCal === opt.val ? '#fff' : shcColors.text, fontSize: 11 }}>{opt.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <Text style={{ fontSize: 16, fontWeight: '600', color: shcColors.primary, marginBottom: 8 }}>Heritage Dishes {occasionFilter ? `for ${occasionFilter}` : ''} {maxCal ? `(≤${maxCal} cal)` : ''}</Text>

      {isLoading && <Text>Loading heritage dishes from HDB kitchens...</Text>}
      {products.length === 0 && <Text style={{ color: shcColors.textLight }}>No matches. Try another occasion, clear calorie filter or search.</Text>}

      {products.map((p: any, idx: number) => {
        const cal = p.calories || 400;
        const traffic = cal < 400 ? 'trafficGreen' : cal < 550 ? 'trafficYellow' : 'trafficRed';
        const trafficLabel = cal < 400 ? 'GREEN' : cal < 550 ? 'AMBER' : 'RED';
        return (
          <SHCCard key={p.id} style={{ marginBottom: 12 }}>
            <Pressable onPress={() => goToProduct(p.id)}>
              <Text style={{ fontSize: 17, fontWeight: '600', color: shcColors.text }}>{p.name}</Text>
              <Text style={{ color: shcColors.accent }}>{p.cook_name} • S${p.price}/portion • {p.area || p.cook_id}</Text>
              <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 2 }}>{p.heritage_note}</Text>
              <View style={{ flexDirection: 'row', marginTop: 6, alignItems: 'center', gap: 8 }}>
                <SHCBadge variant="heritage">{p.cuisine}</SHCBadge>
                {/* Calorie traffic-light badge (blueprint-aligned detail) */}
                <View style={{ backgroundColor: shcColors[traffic as keyof typeof shcColors], paddingHorizontal: 6, paddingVertical: 1, borderRadius: 4 }}>
                  <Text style={{ fontSize: 10, color: '#fff', fontWeight: '600' }}>🔥 {trafficLabel} ~{cal} cal</Text>
                </View>
                <Text style={{ fontSize: 11 }}>min {p.min_qty}</Text>
              </View>
              {p.occasion_tags?.length > 0 && <Text style={{ fontSize: 11, color: shcColors.primary, marginTop: 4 }}>Perfect for: {p.occasion_tags.join(', ')}</Text>}
            </Pressable>

            <View style={{ flexDirection: 'row', marginTop: 10, gap: 8 }}>
              <SHCButton size="sm" onPress={() => goToCook(p.cook_id.replace('cook_', '') || p.cook_id)}>
                <SHCButtonText>View Cook</SHCButtonText>
              </SHCButton>
              <SHCButton size="sm" variant="outline" onPress={() => goToProduct(p.id)}>
                <SHCButtonText>Details &amp; Add (ack + qty)</SHCButtonText>
              </SHCButton>
            </View>
          </SHCCard>
        );
      })}

      <View style={{ marginTop: 16 }}>
        <SHCButton onPress={() => router.push('/(customer)/cart' as any)}>
          <SHCButtonText>View Cart (one-cook enforced)</SHCButtonText>
        </SHCButton>
      </View>

      <Text style={{ textAlign: 'center', marginTop: 20, fontSize: 11, color: shcColors.textLight }}>127 cooks • 4,892 meals • HDB kitchens islandwide • Address privacy protected until paid. Full contracts + mock rules active.</Text>

      <SHCCard style={{ marginTop: 24, backgroundColor: shcColors.surface }}>
        <Text style={{ fontWeight: '600', color: shcColors.primary, marginBottom: 8 }}>How Singapore Home Cooks Works</Text>
        <Text style={{ color: shcColors.textLight, fontSize: 13, lineHeight: 18 }}>Browse by occasion → choose cook & dish → add (min qty + one cook + allergen ack) → checkout with slot + PayNow ref capture → order track + chat → cook accept/prepare/ready/collected → review. Earnings preview 85% everywhere.</Text>
      </SHCCard>

      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
