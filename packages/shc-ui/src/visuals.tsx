// @ts-nocheck
import React from 'react';
import { View, Text, Image, Pressable, StyleSheet } from 'react-native';
import { shcColors, shcRadii, shcBorders, shcShadows, shcSpacing } from './theme';
import { SHCBentoIconBadge, type SHCIconKey } from './icons';

/** Zomato green rating pill */
export function SHCZomatoRatingPill({
  rating,
  reviewCount,
  testID,
}: {
  rating: number;
  reviewCount?: number;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: shcColors.bentoMint,
        paddingHorizontal: 6,
        paddingVertical: 3,
        borderRadius: shcRadii.sm,
        borderWidth: 1,
        borderColor: shcColors.border,
        gap: 2,
      }}
    >
      <Text style={{ fontSize: 10, fontWeight: '900', color: shcColors.success }}>★</Text>
      <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.success }}>{rating}</Text>
      {reviewCount != null && (
        <Text style={{ fontSize: 10, fontWeight: '600', color: shcColors.textLight }}>({reviewCount}+)</Text>
      )}
    </View>
  );
}

/** Zomato-style ADD chip on dish tiles */
export function SHCZomatoAddButton({
  onPress,
  label = 'ADD',
  testID,
}: {
  onPress?: () => void;
  label?: string;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={{
        backgroundColor: shcColors.surface,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: shcRadii.md,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.primary,
        ...shcShadows.brutalSm,
      }}
    >
      <Text style={{ fontSize: 12, fontWeight: '900', color: shcColors.primary, letterSpacing: 0.5 }}>{label}</Text>
    </Pressable>
  );
}

export function SHCFoodImage({
  uri,
  width = '100%',
  height = 140,
  rounded = shcRadii.md,
  testID,
  overlay,
}: {
  uri: string;
  width?: number | string;
  height?: number;
  rounded?: number;
  testID?: string;
  overlay?: React.ReactNode;
}) {
  return (
    <View
      style={{
        width,
        height,
        borderRadius: rounded,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        backgroundColor: shcColors.surfaceAlt,
        ...shcShadows.brutalSm,
      }}
      testID={testID}
    >
      <Image
        source={{ uri }}
        style={{ width: '100%', height: '100%' }}
        resizeMode="cover"
        recyclingKey={testID ? `${testID}-${uri}` : uri}
      />
      {overlay && (
        <View style={StyleSheet.absoluteFillObject} pointerEvents="box-none">
          {overlay}
        </View>
      )}
    </View>
  );
}

type SHCVisualBentoTileProps = {
  imageUri: string;
  iconKey?: SHCIconKey;
  icon?: string;
  label: string;
  badge?: string | number;
  onPress?: () => void;
  testID?: string;
  variant?: 'default' | 'bento-mint' | 'bento-peach' | 'bento-yellow';
};

/** Swiggy-style bento tile: photo background + vector icon badge, minimal label */
export const SHCVisualBentoTile = React.forwardRef<View, SHCVisualBentoTileProps>(function SHCVisualBentoTile(
  { imageUri, iconKey, icon, label, badge, onPress, testID, variant = 'default' },
  ref
) {
  const bg =
    variant === 'bento-mint'
      ? shcColors.bentoMint
      : variant === 'bento-peach'
        ? shcColors.bentoPeach
        : variant === 'bento-yellow'
          ? shcColors.bentoYellow
          : shcColors.surface;

  const inner = (
    <View
      style={{
        height: 88,
        borderRadius: shcRadii.lg,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        backgroundColor: bg,
        ...shcShadows.brutalSm,
      }}
    >
      <Image source={{ uri: imageUri }} style={{ ...StyleSheet.absoluteFillObject, opacity: 0.85 }} resizeMode="cover" />
      <View style={{ flex: 1, padding: shcSpacing.sm, justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          {iconKey ? (
            <SHCBentoIconBadge iconKey={iconKey} size={30} />
          ) : icon ? (
            <Text style={{ fontSize: 26 }}>{icon}</Text>
          ) : null}
          {badge !== undefined && badge !== 0 && (
            <View
              style={{
                minWidth: 22,
                height: 22,
                borderRadius: 11,
                backgroundColor: shcColors.primary,
                borderWidth: 2,
                borderColor: shcColors.border,
                alignItems: 'center',
                justifyContent: 'center',
                paddingHorizontal: 4,
              }}
            >
              <Text style={{ color: shcColors.onPrimary, fontSize: 11, fontWeight: '800' }}>{badge}</Text>
            </View>
          )}
        </View>
        <Text style={{ fontSize: 13, fontWeight: '800', color: shcColors.text }} numberOfLines={1}>
          {label}
        </Text>
      </View>
    </View>
  );

  return (
    <Pressable ref={ref} onPress={onPress} testID={testID} style={{ flex: 1 }}>
      {inner}
    </Pressable>
  );
});

SHCVisualBentoTile.displayName = 'SHCVisualBentoTile';

/** Compact stat cell with vector icon — dashboard / cart summary */
export function SHCBentoStatCell({
  iconKey,
  value,
  label,
  variant = 'default',
  testID,
}: {
  iconKey: SHCIconKey;
  value: string | number;
  label: string;
  variant?: 'default' | 'bento-mint' | 'bento-peach' | 'bento-yellow';
  testID?: string;
}) {
  const bg =
    variant === 'bento-mint'
      ? shcColors.bentoMint
      : variant === 'bento-peach'
        ? shcColors.bentoPeach
        : variant === 'bento-yellow'
          ? shcColors.bentoYellow
          : shcColors.surface;

  return (
    <View
      testID={testID}
      style={{
        alignItems: 'center',
        padding: shcSpacing.md,
        borderRadius: shcRadii.lg,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        backgroundColor: bg,
        ...shcShadows.brutalSm,
      }}
    >
      <SHCBentoIconBadge iconKey={iconKey} size={28} />
      <Text style={{ fontSize: 22, fontWeight: '900', color: shcColors.text, marginTop: 6 }}>{value}</Text>
      <Text style={{ fontSize: 11, color: shcColors.textLight, fontWeight: '600', marginTop: 2 }}>{label}</Text>
    </View>
  );
}