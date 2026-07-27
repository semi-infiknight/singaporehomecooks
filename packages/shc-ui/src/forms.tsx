// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SHCCard, SHCButton, SHCButtonText, SHCSectionTitle } from './primitives';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders } from './theme';

// Re-export improved AllergenAckCheckbox from domain for forms consumers
export { AllergenAckCheckbox } from './domain';
export { OccasionTagPicker } from './occasion-picker';

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
        style={{ height: 120, borderWidth: shcBorders.brutal, borderColor: colors.borderLight, borderRadius: shcRadii.md, padding: shcSpacing.sm, fontFamily: 'monospace', backgroundColor: colors.surface, color: colors.text }}
        placeholder='[{"name":"Coconut milk","quantity":200,"unit":"ml"}, ...]'
      />
      <Text style={{ fontSize: 10, color: colors.textLight }}>Tier1 (mandatory allergens) disclosed to customer. Use for product-meta.ingredients</Text>
    </View>
  );
}

export function PriceEarningsCalc({ price, qty, minQty, commissionRatePct = 15 }: { price: number; qty: number; minQty: number; commissionRatePct?: number }) {
  const subtotal = price * qty;
  const rate = commissionRatePct / 100;
  const earnings = Math.floor(subtotal * 100 * (1 - rate)) / 100;
  const feePct = Math.round(commissionRatePct);
  return (
    <SHCCard>
      <Text>Total S${subtotal} (qty {qty} ≥ min {minQty})</Text>
      <Text style={{ color: colors.success, fontWeight: '600' }}>Cook live earnings: S${earnings} ({feePct}% platform fee)</Text>
    </SHCCard>
  );
}
