// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, TextInput } from 'react-native';
import {
  addMealOptionRow,
  addRecipeStepRow,
  addIngredientRow,
  removeMealOptionRow,
  removeRecipeStepRow,
  removeIngredientRow,
  updateMealOptionRow,
  updateRecipeStepRow,
  updateIngredientRow,
  defaultIngredientRow,
  type MealOptionDraft,
  type RecipeStepDraft,
  type IngredientDraft,
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

function ingredientRowsForEditor(value: IngredientDraft[]): IngredientDraft[] {
  return value.length ? value : [defaultIngredientRow()];
}

export function SHCIngredientsEditor({
  value,
  onChange,
  testID = 'listing-ingredients',
}: {
  value: IngredientDraft[];
  onChange: (next: IngredientDraft[]) => void;
  testID?: string;
}) {
  const rows = ingredientRowsForEditor(value);
  const patchRows = (next: IngredientDraft[]) => onChange(next);

  return (
    <View testID={testID}>
      <Text style={{ fontSize: 12, fontWeight: '800', color: colors.text }}>Ingredients</Text>
      <Text style={{ fontSize: 11, color: colors.textLight, marginTop: 2, marginBottom: shcSpacing.xs }}>
        Ingredient names only — families see the list, not amounts (we don&apos;t publish exact recipes).
      </Text>
      {rows.map((row, index) => (
        <View key={`ingredient-${index}`} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: shcSpacing.xs }}>
          <TextInput
            style={[fieldStyle, { flex: 1 }]}
            value={row.name}
            onChangeText={(text) => patchRows(updateIngredientRow(rows, index, { name: text }))}
            placeholder="e.g. Coconut milk"
            testID={`${testID}-name-${index}`}
          />
          <Pressable
            onPress={() => patchRows(removeIngredientRow(rows, index))}
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
      ))}
      <SHCButton variant="outline" onPress={() => patchRows(addIngredientRow(rows))} testID={`${testID}-add`}>
        <SHCButtonText>+ Add ingredient</SHCButtonText>
      </SHCButton>
    </View>
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
