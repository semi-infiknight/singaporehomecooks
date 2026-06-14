// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SHCCard, SHCButton, SHCButtonText, SHCSectionTitle } from './primitives';
import { shcColors as colors } from './theme';

// Re-export improved AllergenAckCheckbox from domain for forms consumers
export { AllergenAckCheckbox } from './domain';

export function IngredientTierEditor({ value, onChange, label = '3-Tier Ingredients (JSON-like array)' }: { value: Array<{name: string; quantity: number; unit: string}>; onChange: (v: any[]) => void; label?: string }) {
  const [text, setText] = React.useState(JSON.stringify(value || [], null, 2));
  return (
    <View>
      <Text style={{ fontWeight: '500', marginBottom: 4 }}>{label}</Text>
      <TextInput
        multiline
        value={text}
        onChangeText={setText}
        onBlur={() => {
          try { onChange(JSON.parse(text)); } catch {}
        }}
        style={{ height: 120, borderWidth: 1, borderColor: '#E8D5B7', borderRadius: 8, padding: 8, fontFamily: 'monospace', backgroundColor: '#fff' }}
        placeholder='[{"name":"Coconut milk","quantity":200,"unit":"ml"}, ...]'
      />
      <Text style={{ fontSize: 10, color: colors.textLight }}>Tier1 (mandatory allergens) disclosed to customer. Use for product-meta.ingredients</Text>
    </View>
  );
}

export function OccasionTagPicker({ selected, onToggle, options = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Birthday', 'Family Gathering', 'Wedding'] }: { selected: string[]; onToggle: (t: string) => void; options?: string[] }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map(tag => {
        const sel = selected.includes(tag);
        return (
          <Pressable key={tag} onPress={() => onToggle(tag)} style={{ paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: sel ? colors.primary : '#F5F0E6' }}>
            <Text style={{ color: sel ? '#fff' : colors.text, fontSize: 12 }}>{tag}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function PriceEarningsCalc({ price, qty, minQty }: { price: number; qty: number; minQty: number }) {
  const subtotal = price * qty;
  const earnings = Math.floor(subtotal * 0.85);
  return (
    <SHCCard>
      <Text>Total S${subtotal} (qty {qty} ≥ min {minQty})</Text>
      <Text style={{ color: colors.success, fontWeight: '600' }}>Cook live earnings: S${earnings} (15% platform fee)</Text>
    </SHCCard>
  );
}
