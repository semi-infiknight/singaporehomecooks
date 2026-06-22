// Toptal food-app UX patterns: white space, search+ADD, checkout stepper, brand story.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { shcColors, shcRadii, shcSpacing, shcBorders, shcShadows, shcTypography } from './theme';
import { SHCFoodImage, SHCZomatoAddButton } from './visuals';
import { SHCIcon } from './icons';
import { getDishImageUrl } from '@shc/utils';
import type { SHCDishCardData } from './domain';

/** Checkout progress — Toptal: show steps before free shipping / completion */
export function SHCCheckoutStepper({
  steps,
  currentStep,
  testID = 'checkout-stepper',
}: {
  steps: Array<{ id: string; label: string; done?: boolean }>;
  currentStep: number;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.md }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        {steps.map((step, i) => {
          const n = i + 1;
          const active = n === currentStep;
          const done = step.done || n < currentStep;
          return (
            <React.Fragment key={step.id}>
              <View style={{ flex: 1, alignItems: 'center' }}>
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: shcBorders.brutal,
                    borderColor: done || active ? shcColors.primary : shcColors.border,
                    backgroundColor: done ? shcColors.primary : active ? shcColors.bentoPeach : shcColors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                    ...shcShadows.brutalSm,
                  }}
                >
                  {done ? (
                    <SHCIcon name="checkmark" size={14} color={shcColors.onPrimary} active />
                  ) : (
                    <Text style={{ fontSize: 12, fontWeight: '900', color: active ? shcColors.primary : shcColors.textLight }}>{n}</Text>
                  )}
                </View>
                <Text
                  style={{
                    fontSize: 9,
                    fontWeight: active ? '800' : '600',
                    color: active || done ? shcColors.text : shcColors.textLight,
                    marginTop: 4,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  {step.label}
                </Text>
              </View>
              {i < steps.length - 1 && (
                <View
                  style={{
                    flex: 0.4,
                    height: 2,
                    backgroundColor: done ? shcColors.primary : shcColors.borderLight,
                    marginBottom: 16,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </View>
    </View>
  );
}

/** Asda-style search row: thumbnail + meta + price + ADD (Toptal search principle) */
export function SHCSearchResultRow({
  dish,
  onPress,
  onAddPress,
  testID,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  onAddPress?: () => void;
  testID?: string;
}) {
  const imageUri = dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  return (
    <Pressable
      onPress={onPress}
      testID={testID ?? `search-result-${dish.id}`}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: shcSpacing.sm,
        paddingVertical: shcSpacing.sm,
        paddingHorizontal: shcSpacing.sm,
        borderBottomWidth: 1,
        borderBottomColor: shcColors.borderLight,
      }}
    >
      <SHCFoodImage uri={imageUri} width={52} height={52} rounded={shcRadii.md} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '800', fontSize: 13, color: shcColors.text }} numberOfLines={1}>
          {dish.name}
        </Text>
        <Text style={{ fontSize: 11, color: shcColors.textLight, marginTop: 2 }} numberOfLines={1}>
          {dish.cook_name}
          {dish.cuisine ? ` · ${dish.cuisine}` : ''}
        </Text>
        <Text style={{ ...shcTypography.mono, fontSize: 12, fontWeight: '800', color: shcColors.primary, marginTop: 4 }}>
          S${dish.price}
        </Text>
      </View>
      {onAddPress && (
        <SHCZomatoAddButton onPress={onAddPress} testID={testID ? `${testID}-add` : `search-add-${dish.id}`} />
      )}
    </Pressable>
  );
}

/** Predictive search panel — add to cart without visiting PDP */
export function SHCSearchResultsPanel({
  query,
  dishes,
  onDishPress,
  onAddPress,
  onClose,
  testID = 'search-results-panel',
}: {
  query: string;
  dishes: SHCDishCardData[];
  onDishPress?: (id: string) => void;
  onAddPress?: (id: string) => void;
  onClose?: () => void;
  testID?: string;
}) {
  if (!query.trim()) return null;
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: shcColors.surface,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.lg,
        marginTop: shcSpacing.sm,
        maxHeight: 320,
        ...shcShadows.brutal,
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: shcSpacing.sm,
          paddingVertical: shcSpacing.xs,
          backgroundColor: shcColors.bentoMint,
          borderBottomWidth: 1,
          borderBottomColor: shcColors.border,
        }}
      >
        <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.text }}>
          {dishes.length} result{dishes.length !== 1 ? 's' : ''} for “{query.trim()}”
        </Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.primary }}>Clear</Text>
          </Pressable>
        )}
      </View>
      <ScrollView keyboardShouldPersistTaps="handled" nestedScrollEnabled>
        {dishes.length === 0 ? (
          <Text style={{ padding: shcSpacing.md, fontSize: 13, color: shcColors.textLight, textAlign: 'center' }}>
            No dishes match — try another occasion or filter
          </Text>
        ) : (
          dishes.slice(0, 8).map((dish) => (
            <SHCSearchResultRow
              key={dish.id}
              dish={dish}
              onPress={() => onDishPress?.(dish.id)}
              onAddPress={onAddPress ? () => onAddPress(dish.id) : undefined}
            />
          ))
        )}
      </ScrollView>
    </View>
  );
}

/** Local heritage story — Toptal “make it memorable” */
export function SHCHeritageStoryBanner({
  title = 'Home cooks, heritage recipes',
  body = '127+ verified cooks across Singapore HDB kitchens. Collection-only — planned occasions, not delivery.',
  imageUri,
  onPress,
  testID = 'heritage-story-banner',
}: {
  title?: string;
  body?: string;
  imageUri: string;
  onPress?: () => void;
  testID?: string;
}) {
  const inner = (
    <View
      testID={testID}
      style={{
        borderRadius: shcRadii.lg,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        marginBottom: shcSpacing.section,
        ...shcShadows.brutalSm,
      }}
    >
      <SHCFoodImage
        uri={imageUri}
        height={88}
        rounded={0}
        overlay={
          <View
            style={{
              flex: 1,
              flexDirection: 'row',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              backgroundColor: 'rgba(36,24,18,0.5)',
              padding: shcSpacing.md,
              gap: shcSpacing.sm,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 15, fontWeight: '900', color: shcColors.onPrimary }}>{title}</Text>
              <Text style={{ fontSize: 11, fontWeight: '600', color: 'rgba(255,255,255,0.92)', marginTop: 4, lineHeight: 16 }}>
                {body}
              </Text>
            </View>
            <SHCIcon name="home" size={28} color={shcColors.onPrimary} active />
          </View>
        }
      />
    </View>
  );
  if (onPress) {
    return <Pressable onPress={onPress}>{inner}</Pressable>;
  }
  return inner;
}