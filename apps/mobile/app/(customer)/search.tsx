import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { SHCCard, SHCButton, SHCButtonText, SHCBadge, shcColors } from '@shc/ui';
import { useProducts } from '../../hooks/useProducts';

// search.tsx route per 10-mobile.md — enhanced filters (calorie traffic light badge, occasion, max cal). Fully wired to mock + rules.
export default function SearchScreen() {
  const [q, setQ] = useState('');
  const [occ, setOcc] = useState('');
  const [maxC, setMaxC] = useState(700);
  const [cuisine, setCuisine] = useState('');
  const [halalOnly, setHalalOnly] = useState(false);
  const router = useRouter();
  const { data: results = [] } = useProducts(q, { occasion: occ || undefined, maxCal: maxC, cuisine: cuisine || undefined, halal: halalOnly || undefined });

  const goProduct = (id: string) => router.push(`/(customer)/product/${id}` as any);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: shcColors.background, padding: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '700', color: shcColors.text }}>Advanced Search</Text>
      <Text style={{ color: shcColors.textLight }}>Calorie traffic light + occasion + full rule-backed results</Text>

      <TextInput placeholder="Search..." value={q} onChangeText={setQ} style={{ backgroundColor: '#fff', borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 12, marginVertical: 12 }} />

      <View style={{ flexDirection: 'row', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        {['', 'Hari Raya', 'Chinese New Year', 'Family Gathering', 'Christmas'].map(o => (
          <Pressable key={o} onPress={() => setOcc(o)} style={{ padding: 6, backgroundColor: occ === o ? shcColors.primary : shcColors.surface, borderRadius: 6 }}>
            <Text style={{ color: occ === o ? '#fff' : shcColors.text, fontSize: 12 }}>{o || 'Any'}</Text>
          </Pressable>
        ))}
      </View>

      <Text>Max cal: {maxC} <Pressable onPress={() => setMaxC(Math.max(300, maxC-50))}><Text style={{ color: shcColors.primary }}>-</Text></Pressable> <Pressable onPress={() => setMaxC(maxC+50)}><Text style={{ color: shcColors.primary }}>+</Text></Pressable></Text>

      <View style={{ flexDirection: 'row', gap: 8, marginVertical: 8, flexWrap: 'wrap' }}>
        <Pressable onPress={() => setHalalOnly(!halalOnly)} style={{ padding: 6, backgroundColor: halalOnly ? shcColors.success : shcColors.surface, borderRadius: 6 }} testID="halal-filter"><Text style={{ fontSize: 12 }}>Halal only</Text></Pressable>
        {['', 'Peranakan', 'Eurasian'].map(c => <Pressable key={c} onPress={() => setCuisine(c)} style={{ padding: 6, backgroundColor: cuisine === c ? shcColors.primary : shcColors.surface, borderRadius: 6 }}><Text style={{ fontSize: 12 }}>{c || 'Any cuisine'}</Text></Pressable>)}
      </View>

      {results.map((p: any) => {
        const cal = p.calories || 400;
        const t = cal < 400 ? 'trafficGreen' : cal < 550 ? 'trafficYellow' : 'trafficRed';
        return (
          <SHCCard key={p.id} style={{ marginTop: 8 }}>
            <Pressable onPress={() => goProduct(p.id)}>
              <Text style={{ fontWeight: '600' }}>{p.name} by {p.cook_name}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 }}>
                <SHCBadge variant="heritage">{p.cuisine}</SHCBadge>
                <View style={{ backgroundColor: shcColors[t as keyof typeof shcColors], paddingHorizontal: 4, borderRadius: 3 }}><Text style={{ color: '#fff', fontSize: 10 }}>{cal} cal</Text></View>
                <Text>min {p.min_qty}</Text>
              </View>
              <Text style={{ fontSize: 12, color: shcColors.textLight }}>{p.heritage_note}</Text>
            </Pressable>
            <SHCButton size="sm" style={{ marginTop: 8 }} onPress={() => goProduct(p.id)}><SHCButtonText>View &amp; Add</SHCButtonText></SHCButton>
          </SHCCard>
        );
      })}

      <SHCButton onPress={() => router.back()} style={{ marginTop: 24 }}><SHCButtonText>Back</SHCButtonText></SHCButton>
    </ScrollView>
  );
}
