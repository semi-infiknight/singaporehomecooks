// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  addMealOptionRow,
  addRecipeStepRow,
  removeMealOptionRow,
  removeRecipeStepRow,
  updateMealOptionRow,
  updateRecipeStepRow,
  type MealOptionDraft,
  type RecipeStepDraft,
} from '@shc/utils';
import { shcColors as colors, shcSpacing, shcRadii, shcBorders } from './theme';
import { SHCButton, SHCButtonText } from './primitives';

const fieldStyle = {
  borderWidth: shcBorders.brutal,
  borderColor: colors.border,
  borderRadius: shcRadii.md,
  paddingHorizontal: shcSpacing.sm,
  paddingVertical: 8,
  backgroundColor: colors.surface,
  color: colors.text,
  fontWeight: '600' as const,
};

function MealOptionsEditor({
  title,
  hint,
  value,
  onChange,
  testID,
}: {
  title: string;
  hint: string;
  value: MealOptionDraft[];
  onChange: (next: MealOptionDraft[]) => void;
  testID: string;
}) {
  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>{title}</Text>
      <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2, marginBottom: shcSpacing.xs }}>{hint}</Text>
      {value.map((row, index) => (
        <View key={`${row.id}-${index}`} style={{ marginBottom: shcSpacing.xs }}>
          <TextInput
            style={[fieldStyle, { marginBottom: 6 }]}
            value={row.label}
            onChangeText={(text) => onChange(updateMealOptionRow(value, index, { label: text }))}
            placeholder="Option label (e.g. Coconut rice)"
            testID={`${testID}-label-${index}`}
          />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <TextInput
              style={[fieldStyle, { flex: 1 }]}
              value={String(row.priceDelta)}
              onChangeText={(text) =>
                onChange(updateMealOptionRow(value, index, { priceDelta: Number(text) || 0 }))
              }
              keyboardType="decimal-pad"
              placeholder="Extra S$"
              testID={`${testID}-price-${index}`}
            />
            <Pressable
              onPress={() => onChange(removeMealOptionRow(value, index))}
              style={{
                borderWidth: shcBorders.brutal,
                borderColor: colors.border,
                borderRadius: shcRadii.md,
                paddingHorizontal: 10,
                paddingVertical: 8,
              }}
              testID={`${testID}-remove-${index}`}
            >
              <Text style={{ fontWeight: '800', color: colors.text }}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ))}
      <SHCButton variant="outline" onPress={() => onChange(addMealOptionRow(value))} testID={`${testID}-add`}>
        <SHCButtonText>+ Add option</SHCButtonText>
      </SHCButton>
    </View>
  );
}

export function SHCMealExtrasEditor({
  value,
  onChange,
  testID = 'listing-meal-extras',
}: {
  value: MealOptionDraft[];
  onChange: (next: MealOptionDraft[]) => void;
  testID?: string;
}) {
  return (
    <MealOptionsEditor
      title="Portion / base options"
      hint="Customers pick one (e.g. rice choice). Use S$0 for included options."
      value={value}
      onChange={onChange}
      testID={testID}
    />
  );
}

export function SHCMealAddonsEditor({
  value,
  onChange,
  testID = 'listing-meal-addons',
}: {
  value: MealOptionDraft[];
  onChange: (next: MealOptionDraft[]) => void;
  testID?: string;
}) {
  return (
    <MealOptionsEditor
      title="Add-ons"
      hint="Optional paid sides customers can tick (e.g. extra sambal)."
      value={value}
      onChange={onChange}
      testID={testID}
    />
  );
}

export function SHCRecipeStepsEditor({
  value,
  onChange,
  testID = 'listing-recipe-steps',
}: {
  value: RecipeStepDraft[];
  onChange: (next: RecipeStepDraft[]) => void;
  testID?: string;
}) {
  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Recipe steps (optional)</Text>
      <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2, marginBottom: shcSpacing.xs }}>
        Share how you cook this dish — shown on the customer dish page.
      </Text>
      {value.map((step, index) => (
        <View key={`step-${index}`} style={{ marginBottom: shcSpacing.sm }}>
          <Text style={{ fontSize: 11, fontWeight: '800', color: colors.textLight, marginBottom: 4 }}>
            Step {index + 1}
          </Text>
          <TextInput
            style={[fieldStyle, { marginBottom: 6, minHeight: 64, textAlignVertical: 'top' }]}
            value={step.instruction}
            onChangeText={(text) => onChange(updateRecipeStepRow(value, index, { instruction: text }))}
            placeholder="What happens in this step?"
            multiline
            testID={`${testID}-instruction-${index}`}
          />
          <TextInput
            style={[fieldStyle, { marginBottom: 6 }]}
            value={step.tip || ''}
            onChangeText={(text) => onChange(updateRecipeStepRow(value, index, { tip: text }))}
            placeholder="Tip (optional)"
            testID={`${testID}-tip-${index}`}
          />
          <Pressable
            onPress={() => onChange(removeRecipeStepRow(value, index))}
            style={{
              alignSelf: 'flex-start',
              borderWidth: shcBorders.brutal,
              borderColor: colors.border,
              borderRadius: shcRadii.md,
              paddingHorizontal: 10,
              paddingVertical: 8,
            }}
            testID={`${testID}-remove-${index}`}
          >
            <Text style={{ fontWeight: '800', color: colors.text }}>Remove step</Text>
          </Pressable>
        </View>
      ))}
      <SHCButton variant="outline" onPress={() => onChange(addRecipeStepRow(value))} testID={`${testID}-add`}>
        <SHCButtonText>+ Add step</SHCButtonText>
      </SHCButton>
    </View>
  );
}
