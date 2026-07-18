/**
 * Ghost / skeleton loading kit — layout-shaped placeholders while first fetch is pending.
 * Use when isLoading / isPending; show empty copy only when !isLoading && data.length === 0.
 * Web mirrors: apps/web/app/components/SHCWebComponents.tsx
 */
// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, ScrollView, View } from 'react-native';
import { gourmeatColors, gourmeatRadii, gourmeatShadows, shcColors, shcRadii, shcSpacing } from './theme';
import { shouldReduceMotion } from './family-values-core';

const BONE = shcColors.borderLight;
const BONE_SOFT = '#F0E6D8';

export function SHCSkeletonBone({
  width,
  height,
  radius = shcRadii.sm,
  style,
  testID,
}: {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: object;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const opacity = useRef(new Animated.Value(reduce ? 0.55 : 0.4)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 0.85,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.35,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity, reduce]);

  return (
    <Animated.View
      testID={testID}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[
        {
          width: width ?? '100%',
          height: height ?? 12,
          borderRadius: radius,
          backgroundColor: BONE,
          opacity,
        },
        style,
      ]}
    />
  );
}

/** Dish card ghost — matches GourmeatDishCard (~140 image + text block). */
export function SHCSkeletonDishCard({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID ?? 'skeleton-dish-card'}
      style={{
        flex: 1,
        backgroundColor: gourmeatColors.surface,
        borderRadius: gourmeatRadii.lg,
        overflow: 'hidden',
        ...gourmeatShadows.card,
      }}
    >
      <SHCSkeletonBone height={140} radius={0} style={{ backgroundColor: BONE_SOFT }} />
      <View style={{ padding: shcSpacing.sm, gap: 6 }}>
        <SHCSkeletonBone height={14} width="78%" />
        <SHCSkeletonBone height={10} width="55%" />
        <SHCSkeletonBone height={14} width="36%" style={{ marginTop: 4 }} />
      </View>
    </View>
  );
}

/** 2-col dish grid — home discover main grid. */
export function SHCSkeletonDishGrid({
  count = 6,
  testID = 'skeleton-dish-grid',
}: {
  count?: number;
  testID?: string;
}) {
  const rows = Math.ceil(count / 2);
  return (
    <View testID={testID} accessibilityLabel="Loading dishes" style={{ gap: shcSpacing.sm }}>
      {Array.from({ length: rows }).map((_, row) => (
        <View key={row} style={{ flexDirection: 'row', gap: shcSpacing.sm }}>
          <View style={{ flex: 1 }}>
            <SHCSkeletonDishCard />
          </View>
          {row * 2 + 1 < count ? (
            <View style={{ flex: 1 }}>
              <SHCSkeletonDishCard />
            </View>
          ) : (
            <View style={{ flex: 1 }} />
          )}
        </View>
      ))}
    </View>
  );
}

/** Horizontal cooking-soon strip card. */
export function SHCSkeletonCookingSoonCard({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID ?? 'skeleton-cooking-soon-card'}
      style={{
        width: 240,
        borderRadius: 16,
        borderWidth: 2,
        borderColor: gourmeatColors.border,
        backgroundColor: gourmeatColors.surface,
        padding: 14,
        gap: 8,
      }}
    >
      <SHCSkeletonBone height={10} width="42%" />
      <SHCSkeletonBone height={16} width="88%" />
      <SHCSkeletonBone height={12} width="70%" />
      <SHCSkeletonBone height={14} width="32%" style={{ marginTop: 4 }} />
      <SHCSkeletonBone height={10} width="55%" />
    </View>
  );
}

export function SHCSkeletonCookingSoonRail({
  count = 3,
  testID = 'skeleton-cooking-soon-rail',
}: {
  count?: number;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      accessibilityLabel="Loading batches"
      contentContainerStyle={{ paddingHorizontal: shcSpacing.md, gap: 12 }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SHCSkeletonCookingSoonCard key={i} />
      ))}
    </ScrollView>
  );
}

/** Kitchen / cook list row — matches SHCTiffinKitchenCard footprint. */
export function SHCSkeletonKitchenRow({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID ?? 'skeleton-kitchen-row'}
      style={{
        flexDirection: 'row',
        gap: shcSpacing.md,
        padding: shcSpacing.md,
        marginBottom: shcSpacing.sm,
        borderRadius: gourmeatRadii.lg,
        backgroundColor: gourmeatColors.surface,
        borderWidth: 2,
        borderColor: gourmeatColors.border,
        ...gourmeatShadows.card,
      }}
    >
      <SHCSkeletonBone width={64} height={64} radius={gourmeatRadii.md} style={{ backgroundColor: BONE_SOFT }} />
      <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
        <SHCSkeletonBone height={14} width="70%" />
        <SHCSkeletonBone height={11} width="45%" />
        <SHCSkeletonBone height={10} width="55%" />
      </View>
    </View>
  );
}

export function SHCSkeletonKitchenList({
  count = 3,
  testID = 'skeleton-kitchen-list',
}: {
  count?: number;
  testID?: string;
}) {
  return (
    <View testID={testID} accessibilityLabel="Loading kitchens" style={{ paddingHorizontal: shcSpacing.md }}>
      {Array.from({ length: count }).map((_, i) => (
        <SHCSkeletonKitchenRow key={i} />
      ))}
    </View>
  );
}

/** Order day card / list row ghost. */
export function SHCSkeletonOrderCard({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID ?? 'skeleton-order-card'}
      style={{
        borderRadius: 16,
        borderWidth: 2,
        borderColor: gourmeatColors.border,
        backgroundColor: gourmeatColors.surface,
        padding: shcSpacing.md,
        marginBottom: shcSpacing.sm,
        gap: 10,
        ...gourmeatShadows.card,
      }}
    >
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SHCSkeletonBone height={22} width={72} radius={8} />
        <SHCSkeletonBone height={12} width={64} />
      </View>
      <SHCSkeletonBone height={16} width="55%" />
      <SHCSkeletonBone height={12} width="40%" />
      <SHCSkeletonBone height={11} width="80%" />
      <SHCSkeletonBone height={11} width="65%" />
      <View style={{ flexDirection: 'row', gap: 8, marginTop: 4 }}>
        <SHCSkeletonBone height={36} width={96} radius={10} />
        <SHCSkeletonBone height={36} width={72} radius={10} />
      </View>
    </View>
  );
}

/** Compact order row — cook orders list (thumb + text). */
export function SHCSkeletonOrderRow({ testID }: { testID?: string }) {
  return (
    <View
      testID={testID ?? 'skeleton-order-row'}
      style={{
        flexDirection: 'row',
        gap: shcSpacing.sm,
        padding: shcSpacing.sm,
        marginBottom: shcSpacing.sm,
        borderRadius: gourmeatRadii.lg,
        backgroundColor: gourmeatColors.surface,
        ...gourmeatShadows.card,
      }}
    >
      <SHCSkeletonBone width={72} height={72} radius={gourmeatRadii.md} style={{ backgroundColor: BONE_SOFT }} />
      <View style={{ flex: 1, gap: 6, justifyContent: 'center' }}>
        <SHCSkeletonBone height={14} width="70%" />
        <SHCSkeletonBone height={10} width="40%" />
        <SHCSkeletonBone height={20} width={72} radius={8} />
        <SHCSkeletonBone height={11} width="55%" />
      </View>
    </View>
  );
}

export function SHCSkeletonOrderList({
  count = 3,
  variant = 'card',
  testID = 'skeleton-order-list',
}: {
  count?: number;
  variant?: 'card' | 'row';
  testID?: string;
}) {
  const Item = variant === 'row' ? SHCSkeletonOrderRow : SHCSkeletonOrderCard;
  return (
    <View testID={testID} accessibilityLabel="Loading orders">
      {Array.from({ length: count }).map((_, i) => (
        <Item key={i} />
      ))}
    </View>
  );
}

/** My Orders tab — calendar strip + day cards while auth or first fetch pending. */
export function SHCSkeletonOrdersDayScreen({ testID = 'skeleton-orders-day-screen' }: { testID?: string }) {
  return (
    <View testID={testID} accessibilityLabel="Loading orders">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: shcSpacing.sm }}>
        {Array.from({ length: 8 }).map((_, i) => (
          <SHCSkeletonBone key={i} width={52} height={64} radius={12} style={{ backgroundColor: BONE_SOFT }} />
        ))}
      </ScrollView>
      <SHCSkeletonBone height={15} width={56} radius={6} style={{ marginTop: shcSpacing.md, marginBottom: shcSpacing.sm }} />
      <SHCSkeletonOrderList count={3} variant="card" />
    </View>
  );
}

/** Account / profile ghost while auth hydrates. */
export function SHCSkeletonAccountScreen({ testID = 'skeleton-account-screen' }: { testID?: string }) {
  return (
    <View testID={testID} accessibilityLabel="Loading account">
      <SHCSkeletonBone height={28} width="48%" radius={8} style={{ marginBottom: 8 }} />
      <SHCSkeletonBone height={14} width="62%" radius={6} style={{ marginBottom: shcSpacing.lg }} />
      <SHCSkeletonBone height={112} width="100%" radius={16} style={{ marginBottom: shcSpacing.md }} />
      <SHCSkeletonList count={4} rowHeight={52} />
    </View>
  );
}

/** Generic stacked bars — cart lines, form shells, etc. */
export function SHCSkeletonList({
  count = 4,
  rowHeight = 56,
  testID = 'skeleton-list',
}: {
  count?: number;
  rowHeight?: number;
  testID?: string;
}) {
  return (
    <View testID={testID} accessibilityLabel="Loading" style={{ gap: shcSpacing.sm }}>
      {Array.from({ length: count }).map((_, i) => (
        <SHCSkeletonBone key={i} height={rowHeight} radius={gourmeatRadii.md} style={{ backgroundColor: BONE_SOFT }} />
      ))}
    </View>
  );
}

/** Full home discover ghost block: cooking soon + kitchens + dish grid. */
export function SHCSkeletonHomeDiscover({ testID = 'skeleton-home-discover' }: { testID?: string }) {
  return (
    <View testID={testID} accessibilityLabel="Loading home">
      <View style={{ marginBottom: shcSpacing.md }}>
        <SHCSkeletonCookingSoonRail />
      </View>
      <View style={{ marginBottom: shcSpacing.md }}>
        <SHCSkeletonKitchenList count={2} />
      </View>
      <View style={{ paddingHorizontal: shcSpacing.md }}>
        <SHCSkeletonDishGrid count={4} />
      </View>
    </View>
  );
}
