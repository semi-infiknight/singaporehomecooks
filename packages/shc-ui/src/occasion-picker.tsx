// @ts-nocheck
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders } from './theme';

export function OccasionTagPicker({
  selected,
  onToggle,
  options = ['Hari Raya', 'Deepavali', 'Chinese New Year', 'Birthday', 'Family Gathering', 'Wedding'],
}: {
  selected: string[];
  onToggle: (t: string) => void;
  options?: string[];
}) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
      {options.map((tag) => {
        const sel = selected.includes(tag);
        return (
          <Pressable
            key={tag}
            onPress={() => onToggle(tag)}
            style={{
              paddingHorizontal: 10,
              paddingVertical: 4,
              borderRadius: shcRadii.pill,
              borderWidth: shcBorders.brutal,
              borderColor: colors.border,
              backgroundColor: sel ? colors.primary : colors.surfaceAlt,
            }}
          >
            <Text style={{ color: sel ? colors.onPrimary : colors.text, fontSize: 12, fontWeight: '600' }}>{tag}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}