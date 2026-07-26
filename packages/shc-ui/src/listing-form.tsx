// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput, Switch } from 'react-native';
import {
  ALLERGEN_TIER1_PRESETS,
  COLLECTION_TIME_SLOT_PRESETS,
  WEEKDAY_LABELS,
  type AllergenTiers,
} from '@shc/utils';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders, shcShadows } from './theme';

const chipBase = {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: shcRadii.pill,
  borderWidth: shcBorders.brutal,
  borderColor: colors.border,
};

export function SHCAllergenTierPicker({
  value,
  onChange,
  testID = 'listing-allergen-picker',
  tier1Presets,
}: {
  value: AllergenTiers;
  onChange: (next: AllergenTiers) => void;
  testID?: string;
  tier1Presets?: readonly string[];
}) {
  const toggle = (allergen: string) => {
    const tier1 = value.tier1.includes(allergen)
      ? value.tier1.filter((a) => a !== allergen)
      : [...value.tier1, allergen];
    onChange({ ...value, tier1 });
  };

  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: shcSpacing.xs }}>
        Allergens (tier 1 — mandatory disclosure)
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        { (tier1Presets ?? ALLERGEN_TIER1_PRESETS).map((allergen) => {
          const sel = value.tier1.includes(allergen);
          return (
            <Pressable
              key={allergen}
              onPress={() => toggle(allergen)}
              style={[chipBase, { backgroundColor: sel ? colors.primary : colors.surfaceAlt }]}
              testID={`allergen-chip-${allergen.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}`}
            >
              <Text style={{ color: sel ? colors.onPrimary : colors.text, fontSize: 11, fontWeight: '700' }}>
                {allergen}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {value.tier1.length === 0 ? (
        <Text style={{ fontSize: 11, color: colors.textLight, marginTop: shcSpacing.xs }}>
          Select all that apply — customers must acknowledge before checkout.
        </Text>
      ) : null}
    </View>
  );
}

export function SHCHalalToggle({
  value,
  onChange,
  testID = 'listing-halal-toggle',
}: {
  value: boolean;
  onChange: (next: boolean) => void;
  testID?: string;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: shcSpacing.sm,
        borderWidth: shcBorders.brutal,
        borderColor: colors.border,
        borderRadius: shcRadii.md,
        backgroundColor: colors.surface,
        ...shcShadows.brutalSm,
      }}
      testID={testID}
    >
      <View style={{ flex: 1, marginRight: shcSpacing.sm }}>
        <Text style={{ fontSize: 14, fontWeight: '800', color: colors.text }}>Halal certified dish</Text>
        <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2 }}>
          Toggle on only if this dish is prepared halal in your kitchen.
        </Text>
      </View>
      <Switch
        value={value}
        onValueChange={onChange}
        trackColor={{ false: colors.border, true: colors.accent }}
        thumbColor={colors.surface}
        accessibilityLabel="Halal certified dish"
      />
    </View>
  );
}

export function SHCListingAvailabilityEditor({
  portionsPerDay,
  collectionDays,
  timeSlots,
  onPortionsChange,
  onCollectionDaysChange,
  onTimeSlotsChange,
  testID = 'listing-availability-editor',
  timeSlotPresets,
}: {
  portionsPerDay: number;
  collectionDays: number[];
  timeSlots: string[];
  onPortionsChange: (n: number) => void;
  onCollectionDaysChange: (days: number[]) => void;
  onTimeSlotsChange: (slots: string[]) => void;
  testID?: string;
  timeSlotPresets?: readonly string[];
}) {
  const toggleDay = (day: number) => {
    onCollectionDaysChange(
      collectionDays.includes(day)
        ? collectionDays.filter((d) => d !== day)
        : [...collectionDays, day].sort((a, b) => a - b)
    );
  };
  const toggleSlot = (slot: string) => {
    onTimeSlotsChange(
      timeSlots.includes(slot) ? timeSlots.filter((s) => s !== slot) : [...timeSlots, slot]
    );
  };

  return (
    <View testID={testID} style={{ gap: shcSpacing.sm }}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Availability</Text>
      <Text style={{ fontSize: 11, color: colors.textLight }}>Portions you can prepare per collection day</Text>
      <TextInput
        value={String(portionsPerDay)}
        onChangeText={(t) => onPortionsChange(Math.max(1, parseInt(t, 10) || 1))}
        keyboardType="numeric"
        placeholder="Portions per day"
        style={{
          borderWidth: shcBorders.brutal,
          borderColor: colors.border,
          padding: shcSpacing.sm,
          borderRadius: shcRadii.md,
          backgroundColor: colors.surface,
          color: colors.text,
        }}
        testID="listing-portions-input"
      />
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginTop: shcSpacing.xs }}>
        Collection days
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {WEEKDAY_LABELS.map((label, day) => {
          const sel = collectionDays.includes(day);
          return (
            <Pressable
              key={label}
              onPress={() => toggleDay(day)}
              style={[chipBase, { backgroundColor: sel ? colors.primary : colors.surfaceAlt }]}
              testID={`collection-day-${day}`}
            >
              <Text style={{ color: sel ? colors.onPrimary : colors.text, fontSize: 11, fontWeight: '700' }}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <Text style={{ fontSize: 11, fontWeight: '700', color: colors.text, marginTop: shcSpacing.xs }}>
        Time slots
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {(timeSlotPresets ?? COLLECTION_TIME_SLOT_PRESETS).map((slot) => {
          const sel = timeSlots.includes(slot);
          return (
            <Pressable
              key={slot}
              onPress={() => toggleSlot(slot)}
              style={[chipBase, { backgroundColor: sel ? colors.primary : colors.surfaceAlt }]}
              testID={`time-slot-${slot}`}
            >
              <Text style={{ color: sel ? colors.onPrimary : colors.text, fontSize: 11, fontWeight: '700' }}>
                {slot}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

export function SHCListingDescriptionInput({
  value,
  onChange,
  testID = 'listing-description-input',
}: {
  value: string;
  onChange: (text: string) => void;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: shcSpacing.xs }}>
        Dish story / description
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Ah Mah's rempah — slow-cooked for family gatherings…"
        placeholderTextColor={colors.textLight}
        multiline
        style={{
          borderWidth: shcBorders.brutal,
          borderColor: colors.border,
          padding: shcSpacing.sm,
          borderRadius: shcRadii.md,
          backgroundColor: colors.surface,
          color: colors.text,
          minHeight: 88,
          textAlignVertical: 'top',
        }}
      />
    </View>
  );
}

export function SHCLastMinutePremiumInput({
  value,
  onChange,
  testID = 'listing-last-minute-premium',
}: {
  value: number | null;
  onChange: (n: number | null) => void;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text, marginBottom: shcSpacing.xs }}>
        Last-minute premium % (optional)
      </Text>
      <Text style={{ fontSize: 11, color: colors.textLight, marginBottom: shcSpacing.xs }}>
        Extra % for orders within 24h — leave empty for none.
      </Text>
      <TextInput
        value={value != null && value > 0 ? String(value) : ''}
        onChangeText={(t) => {
          const n = parseInt(t, 10);
          onChange(t.trim() === '' || Number.isNaN(n) ? null : Math.min(50, Math.max(0, n)));
        }}
        keyboardType="numeric"
        placeholder="e.g. 15"
        style={{
          borderWidth: shcBorders.brutal,
          borderColor: colors.border,
          padding: shcSpacing.sm,
          borderRadius: shcRadii.md,
          backgroundColor: colors.surface,
          color: colors.text,
        }}
      />
    </View>
  );
}
