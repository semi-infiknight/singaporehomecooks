// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text } from 'react-native';
import { SHCCard } from './primitives';
import { shcColors as colors } from './theme';
import { SHCIngredientsEditor } from './product-meta-form';

// Re-export improved AllergenAckCheckbox from domain for forms consumers
export { AllergenAckCheckbox } from './domain';
export { OccasionTagPicker } from './occasion-picker';

/** @deprecated Use SHCIngredientsEditor — kept for older imports. */
export function IngredientTierEditor({
  value,
  onChange,
  label,
}: {
  value: Array<{ name: string; quantity: number; unit: string }>;
  onChange: (v: any[]) => void;
  label?: string;
}) {
  return (
    <View>
      {label ? <Text style={{ fontWeight: '500', marginBottom: 4 }}>{label}</Text> : null}
      <SHCIngredientsEditor value={value} onChange={onChange} testID="listing-ingredients" />
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
