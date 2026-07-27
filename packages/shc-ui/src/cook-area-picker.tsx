// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import { cookAreaSuggestions } from '@shc/utils';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders } from './theme';

const chipBase = {
  paddingHorizontal: 10,
  paddingVertical: 6,
  borderRadius: shcRadii.pill,
  borderWidth: shcBorders.brutal,
  borderColor: colors.border,
};

/** Cook kitchen settings — SG area with centroid-backed suggestions. */
export function SHCCookAreaPicker({
  value,
  onChange,
  testID = 'cook-settings-area',
}: {
  value: string;
  onChange: (next: string) => void;
  testID?: string;
}) {
  const suggestions = useMemo(() => cookAreaSuggestions(value), [value]);

  return (
    <View testID={testID}>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g. Tampines"
        placeholderTextColor={colors.textLight}
        style={{
          minHeight: 44,
          borderWidth: shcBorders.brutal,
          borderColor: colors.border,
          borderRadius: shcRadii.md,
          backgroundColor: colors.surface,
          color: colors.text,
          paddingHorizontal: shcSpacing.md,
          fontWeight: '700',
        }}
        testID={`${testID}-input`}
      />
      <Text style={{ fontSize: 11, color: colors.textLight, marginTop: shcSpacing.sm, marginBottom: 6 }}>
        Pick a neighbourhood for collection proximity and release logic.
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
        {suggestions.map((area) => {
          const sel = value.trim().toLowerCase() === area.toLowerCase();
          return (
            <Pressable
              key={area}
              onPress={() => onChange(area)}
              style={[chipBase, { backgroundColor: sel ? colors.primary : colors.surfaceAlt }]}
              testID={`${testID}-chip-${area.replace(/[^a-zA-Z0-9]+/g, '-').toLowerCase()}`}
            >
              <Text style={{ color: sel ? colors.onPrimary : colors.text, fontSize: 11, fontWeight: '700' }}>
                {area}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
