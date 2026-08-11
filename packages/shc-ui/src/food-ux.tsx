// Toptal food-app UX patterns: white space, search+ADD, checkout stepper, brand story.
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { shcColors, shcRadii, shcSpacing, shcBorders, shcShadows, shcTypography, shcSectionStack } from './theme';
import { SHCFoodImage, SHCZomatoAddButton } from './visuals';
import { SharedDishNavSurface } from './family-values-ui';
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
    <View testID={testID} style={shcSectionStack}>
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
  subtitle,
  testID,
}: {
  dish: SHCDishCardData;
  onPress?: () => void;
  onAddPress?: () => void;
  subtitle?: string;
  testID?: string;
}) {
  const imageUri = dish.image_url || getDishImageUrl({ id: dish.id, cuisine: dish.cuisine, name: dish.name });
  const meta = subtitle || dish.kitchenLabel || [dish.cook_name, dish.cuisine].filter(Boolean).join(' · ');
  return (
    <SharedDishNavSurface
      dishId={dish.id}
      onNavigate={onPress}
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
      {({ measureRef }) => (
      <>
      <View ref={measureRef} collapsable={false}>
        <SHCFoodImage uri={imageUri} width={52} height={52} rounded={26} />
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={1}>
          {dish.name}
        </Text>
        <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 2 }} numberOfLines={1}>
          {meta}
        </Text>
        {dish.price != null && Number.isFinite(dish.price) ? (
          <Text style={{ ...shcTypography.mono, fontSize: 12, fontWeight: '800', color: shcColors.primary, marginTop: 4 }}>
            S${dish.price}
          </Text>
        ) : null}
      </View>
      {onAddPress && (
        <View onStartShouldSetResponder={() => true}>
          <SHCZomatoAddButton onPress={onAddPress} testID={testID ? `${testID}-add` : `search-add-${dish.id}`} />
        </View>
      )}
      </>
      )}
    </SharedDishNavSurface>
  );
}

export type SHCSearchKitchenHit = {
  key: string;
  cook_name: string;
  routeKey: string;
  matchingDishCount: number;
  sampleDishNames: string[];
  area?: string;
  image_url?: string;
  rating?: number;
};

/** Kitchen row in search — tap opens cook profile */
export function SHCSearchKitchenRow({
  kitchen,
  onPress,
  testID,
}: {
  kitchen: SHCSearchKitchenHit;
  onPress?: () => void;
  testID?: string;
}) {
  const dishHint =
    kitchen.matchingDishCount === 1
      ? kitchen.sampleDishNames[0] || '1 dish'
      : `${kitchen.matchingDishCount} dishes match`;
  const meta = [kitchen.area, dishHint].filter(Boolean).join(' · ');
  return (
    <Pressable
      onPress={onPress}
      testID={testID ?? `search-kitchen-${kitchen.key}`}
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
      <SHCFoodImage
        uri={kitchen.image_url || getDishImageUrl({ name: kitchen.cook_name })}
        width={52}
        height={52}
        rounded={shcRadii.md}
      />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={{ fontWeight: '800', fontSize: 14, color: shcColors.text }} numberOfLines={2}>
          {kitchen.cook_name}
        </Text>
        <Text style={{ fontSize: 12, color: shcColors.textLight, marginTop: 2 }} numberOfLines={1}>
          {meta}
        </Text>
      </View>
      <Text style={{ fontSize: 18, color: shcColors.textLight }}>›</Text>
    </Pressable>
  );
}

/**
 * Empty search — “Didn’t find what you’re looking for?” + request custom dish.
 * Swiggy-style feedback card for zero dish/kitchen hits.
 */
export function SHCSearchNoResultsRequestCard({
  query,
  onRequestPress,
  testID = 'search-no-results-request',
}: {
  query?: string;
  onRequestPress: () => void;
  testID?: string;
}) {
  const q = (query || '').trim();
  return (
    <View testID={testID} style={{ padding: shcSpacing.md, gap: shcSpacing.md }}>
      {q ? (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: shcColors.text,
            textAlign: 'left',
            lineHeight: 22,
          }}
          testID={`${testID}-title`}
        >
          {`We couldn’t find any results for “${q}”`}
        </Text>
      ) : (
        <Text
          style={{
            fontSize: 16,
            fontWeight: '800',
            color: shcColors.text,
            lineHeight: 22,
          }}
        >
          No matches for that search
        </Text>
      )}

      <Pressable
        onPress={onRequestPress}
        testID={`${testID}-cta`}
        accessibilityRole="button"
        accessibilityLabel="Request a custom dish"
        style={{
          borderRadius: shcRadii.lg,
          borderWidth: 1,
          borderColor: 'rgba(248,112,72,0.28)',
          backgroundColor: '#FFF8F3',
          padding: shcSpacing.md,
          flexDirection: 'row',
          alignItems: 'center',
          gap: shcSpacing.md,
          ...shcShadows.soft,
        }}
      >
        <View style={{ flex: 1, gap: 6 }}>
          <Text style={{ fontSize: 15, fontWeight: '900', color: shcColors.text, lineHeight: 20 }}>
            Didn’t find what you’re looking for?
          </Text>
          <Text
            style={{
              fontSize: 13,
              fontWeight: '600',
              color: shcColors.textLight,
              lineHeight: 18,
            }}
          >
            Request a custom dish — home cooks can bid so we can show better matches next time.
          </Text>
          <Text
            style={{
              fontSize: 14,
              fontWeight: '800',
              color: shcColors.primary,
              marginTop: 4,
            }}
          >
            Request a custom dish →
          </Text>
        </View>
        <View
          style={{
            width: 72,
            height: 72,
            borderRadius: 36,
            backgroundColor: shcColors.bentoPeach,
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <SHCIcon name="request" size={32} color={shcColors.primary} active />
        </View>
      </Pressable>
    </View>
  );
}

/** Predictive search panel — kitchens first, then dishes with multi-kitchen labels */
export function SHCSearchResultsPanel({
  query,
  dishes,
  kitchens = [],
  onDishPress,
  onKitchenPress,
  onAddPress,
  onClose,
  onRequestCustom,
  testID = 'search-results-panel',
}: {
  query: string;
  dishes: SHCDishCardData[];
  kitchens?: SHCSearchKitchenHit[];
  onDishPress?: (id: string) => void;
  onKitchenPress?: (routeKey: string) => void;
  onAddPress?: (id: string) => void;
  onClose?: () => void;
  /** When no kitchens/dishes match — open custom request wizard */
  onRequestCustom?: () => void;
  testID?: string;
}) {
  if (!query.trim()) return null;
  const q = query.trim();
  const hasKitchens = kitchens.length > 0;
  const hasDishes = dishes.length > 0;

  return (
    <View
      testID={testID}
      style={{
        backgroundColor: shcColors.surface,
        borderRadius: shcRadii.lg,
        marginTop: shcSpacing.sm,
        maxHeight: 420,
        borderWidth: 1,
        borderColor: 'rgba(36,24,18,0.08)',
        overflow: 'hidden',
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          justifyContent: 'space-between',
          alignItems: 'center',
          paddingHorizontal: shcSpacing.md,
          paddingVertical: shcSpacing.sm,
        }}
      >
        <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.textLight }} numberOfLines={1}>
          Results for “{q}”
        </Text>
        {onClose && (
          <Pressable onPress={onClose} hitSlop={8} testID={`${testID}-clear`}>
            <Text style={{ fontSize: 12, fontWeight: '800', color: shcColors.primary }}>Clear</Text>
          </Pressable>
        )}
      </View>

      {!hasKitchens && !hasDishes ? (
        onRequestCustom ? (
          <SHCSearchNoResultsRequestCard query={q} onRequestPress={onRequestCustom} />
        ) : (
          <Text style={{ padding: shcSpacing.md, fontSize: 13, color: shcColors.textLight, textAlign: 'center' }}>
            No matches — try a dish or kitchen name
          </Text>
        )
      ) : (
        <FlatList
          data={[
            ...(hasKitchens
              ? ([{ type: 'header', id: 'h-kitchens', title: `Kitchens for “${q}”` }] as const)
              : []),
            ...kitchens.map((k) => ({ type: 'kitchen' as const, id: `k-${k.key}`, kitchen: k })),
            ...(hasDishes
              ? ([{ type: 'header', id: 'h-dishes', title: 'Dishes matching your query' }] as const)
              : []),
            ...dishes.map((d) => ({ type: 'dish' as const, id: `d-${d.id}`, dish: d })),
          ]}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          nestedScrollEnabled
          initialNumToRender={12}
          maxToRenderPerBatch={16}
          windowSize={6}
          renderItem={({ item }) => {
            if (item.type === 'header') {
              return (
                <Text
                  style={{
                    fontSize: 11,
                    fontWeight: '700',
                    color: shcColors.textLight,
                    paddingHorizontal: shcSpacing.md,
                    paddingTop: shcSpacing.sm,
                    paddingBottom: 4,
                  }}
                >
                  {item.title}
                </Text>
              );
            }
            if (item.type === 'kitchen') {
              return (
                <SHCSearchKitchenRow
                  kitchen={item.kitchen}
                  onPress={() => onKitchenPress?.(item.kitchen.routeKey)}
                />
              );
            }
            return (
              <SHCSearchResultRow
                dish={item.dish}
                onPress={() => onDishPress?.(item.dish.id)}
                onAddPress={onAddPress ? () => onAddPress(item.dish.id) : undefined}
                subtitle={item.dish.kitchenLabel}
              />
            );
          }}
        />
      )}
    </View>
  );
}