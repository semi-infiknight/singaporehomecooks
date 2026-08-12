// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image } from 'react-native';
import {
  shcColors,
  shcRadii,
  shcSpacing,
  shcBorders,
  shcShadows,
  shcTypography,
  shcSectionStack,
  shcTitleBlock,
} from './theme';
import { shcBadgeVariant, type ShcBadgeSemanticKind } from '@shc/utils';
import { SHCIcon, SHCTabIcon, type SHCTabIconKey } from './icons';

type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost' | 'hero';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonSizes: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number; minH: number; wellH: number }> = {
  sm: { paddingH: 10, paddingV: 4, fontSize: 12, minH: 32, wellH: 22 },
  md: { paddingH: 14, paddingV: 8, fontSize: 14, minH: 44, wellH: 28 },
  lg: { paddingH: 18, paddingV: 10, fontSize: 16, minH: 56, wellH: 36 },
};

export function SHCButtonArrowWell({ size = 'md' }: { size?: ButtonSize }) {
  const sz = buttonSizes[size];
  return (
    <View
      style={{
        height: sz.wellH,
        minWidth: sz.wellH + 16,
        paddingHorizontal: size === 'sm' ? 8 : 12,
        borderRadius: shcRadii.pill,
        backgroundColor: shcColors.ctaArrowWell,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#FFFFFF',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.45,
        shadowRadius: 8,
      }}
    >
      <Text style={{ color: shcColors.onPrimary, fontSize: size === 'sm' ? 13 : 16, fontWeight: '300', lineHeight: size === 'sm' ? 16 : 20 }}>
        →
      </Text>
    </View>
  );
}

export function SHCButtonCheckDot({ size = 'md' }: { size?: ButtonSize }) {
  const d = size === 'sm' ? 18 : size === 'lg' ? 26 : 22;
  return (
    <View
      style={{
        width: d,
        height: d,
        borderRadius: d / 2,
        backgroundColor: shcColors.ctaInk,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ color: shcColors.onPrimary, fontSize: size === 'sm' ? 10 : 12, fontWeight: '800', lineHeight: size === 'sm' ? 12 : 14 }}>
        ✓
      </Text>
    </View>
  );
}

export const SHCButtonText = ({
  children,
  variant = 'primary',
  style,
}: {
  children: React.ReactNode;
  variant?: ButtonVariant;
  style?: any;
}) => {
  const color =
    variant === 'outline'
      ? shcColors.text
      : variant === 'ghost' || variant === 'hero'
        ? shcColors.ctaHeroText
        : variant === 'accent'
          ? shcColors.ctaInk
          : shcColors.onPrimary;
  return <Text style={[{ color, fontWeight: '700' }, style]}>{children}</Text>;
};

SHCButtonText.displayName = 'SHCButtonText';

type SHCButtonProps = {
  children: React.ReactNode;
  onPress?: () => void;
  disabled?: boolean;
  testID?: string;
  style?: any;
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export const SHCButton = React.forwardRef<View, SHCButtonProps>(function SHCButton(
  { children, onPress, disabled, testID, style, variant = 'primary', size = 'md' },
  ref
) {
  const sz = buttonSizes[size];
  const isPrimary = variant === 'primary';
  const isOutline = variant === 'outline';
  const isGhost = variant === 'ghost';
  const isHero = variant === 'hero';
  const isAccent = variant === 'accent';

  const variantStyle = isOutline
    ? { backgroundColor: shcColors.surface, borderWidth: 1, borderColor: shcColors.ctaInk }
    : isAccent
      ? { backgroundColor: shcColors.surface, borderWidth: 0 }
      : isGhost
        ? { backgroundColor: shcColors.surface, borderWidth: 0 }
        : isHero
          ? { backgroundColor: shcColors.surface, borderWidth: 0 }
          : { backgroundColor: shcColors.ctaInk, borderWidth: 0 };

  const textColor = isOutline
    ? shcColors.ctaInk
    : isGhost || isHero || isAccent
      ? shcColors.ctaHeroText
      : shcColors.onPrimary;

  const showArrow = isPrimary;
  const showCheck = isOutline;
  const shadow = isPrimary ? shcShadows.ctaPill : shcShadows.ctaPillSoft;

  const labelTextStyle = {
    color: textColor,
    textAlign: 'left' as const,
    fontWeight: '700' as const,
    fontSize: sz.fontSize,
    flexShrink: 1,
  };

  const renderLabel = () => {
    if (typeof children === 'string' || typeof children === 'number') {
      return (
        <Text style={labelTextStyle} numberOfLines={2}>
          {children}
        </Text>
      );
    }
    return React.Children.map(children, (child) => {
      if (typeof child === 'string' || typeof child === 'number') {
        return (
          <Text style={labelTextStyle} numberOfLines={2}>
            {child}
          </Text>
        );
      }
      if (!React.isValidElement(child)) return child;
      const typeName =
        typeof child.type === 'string'
          ? child.type
          : (child.type as { displayName?: string; name?: string })?.displayName ||
            (child.type as { name?: string })?.name;
      const isLabel = child.type === Text || typeName === 'SHCButtonText' || typeName === 'Text';
      if (isLabel) {
        // Re-render as Text with forced contrast color — cloneElement + displayName
        // misses can leave SHCButtonText on primary (white) over outline (white).
        return (
          <Text style={[labelTextStyle, (child.props as { style?: any }).style]} numberOfLines={2}>
            {(child.props as { children?: React.ReactNode }).children}
          </Text>
        );
      }
      return child;
    });
  };

  return (
    <Pressable ref={ref} onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={[
            variantStyle,
            {
              paddingLeft: sz.paddingH,
              // Outline check sits on the trailing edge (same role as primary arrow).
              paddingRight: showArrow || showCheck ? 6 : sz.paddingH,
              paddingVertical: sz.paddingV,
              borderRadius: shcRadii.pill,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 8,
              minHeight: sz.minH,
              // Intrinsic width by default so labels don't collapse in wrap rows.
              // Callers pass width/alignSelf stretch for full-bleed CTAs.
              alignSelf: 'flex-start',
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
              backgroundColor: isPrimary && pressed && !disabled ? shcColors.ctaInkPressed : variantStyle.backgroundColor,
              ...shadow,
            },
            style,
          ]}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              // Only grow for primary (arrow at end). flex:1 + minWidth:0 in a
              // horizontal wrap row was collapsing outline labels to zero width.
              ...(showArrow ? { flex: 1, minWidth: 0 } : { flexShrink: 1 }),
            }}
          >
            {renderLabel()}
          </View>
          {showCheck ? <SHCButtonCheckDot size={size} /> : null}
          {showArrow ? <SHCButtonArrowWell size={size} /> : null}
        </View>
      )}
    </Pressable>
  );
});

SHCButton.displayName = 'SHCButton';

export function SHCCard({ children, style, variant = 'default', ...props }: any) {
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
      style={[
        {
          backgroundColor: bg,
          borderRadius: shcRadii.lg,
          padding: shcSpacing.md,
          borderWidth: shcBorders.brutal,
          borderColor: shcColors.border,
          ...shcShadows.brutalSm,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </View>
  );
}

export function SHCBentoGrid({
  children,
  style,
  columns = 2,
  gap = shcSpacing.sm,
}: {
  children: React.ReactNode;
  style?: any;
  columns?: 2 | 3 | 4;
  gap?: number;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap,
          marginBottom: shcSpacing.section,
        },
        style,
      ]}
      testID="bento-grid"
    >
      {children}
    </View>
  );
}

function bentoCellWidth(span: number, columns: number): string {
  if (span >= columns) return '100%';
  if (columns === 2) return span === 2 ? '100%' : '48%';
  if (columns === 3) return span === 3 ? '100%' : span === 2 ? '65%' : '31%';
  return span === 4 ? '100%' : span === 3 ? '74%' : span === 2 ? '48%' : '23%';
}

export function SHCBentoCell({
  children,
  span = 1,
  columns = 2,
  style,
  variant = 'default',
  testID,
  onPress,
}: {
  children: React.ReactNode;
  span?: 1 | 2 | 3 | 4;
  columns?: 2 | 3 | 4;
  style?: any;
  variant?: 'default' | 'bento-mint' | 'bento-peach' | 'bento-yellow';
  testID?: string;
  onPress?: () => void;
}) {
  const effectiveSpan = Math.min(span, columns);
  const width = bentoCellWidth(effectiveSpan, columns);

  const content = (
    <SHCCard
      variant={variant}
      style={[{ width, minHeight: effectiveSpan >= columns ? 120 : 100 }, style]}
    >
      {children}
    </SHCCard>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} testID={testID} style={{ width }}>
        {content}
      </Pressable>
    );
  }

  return (
    <View style={{ width }} testID={testID}>
      {content}
    </View>
  );
}

export function SHCBadge({
  children,
  variant = 'default',
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error' | 'warm';
}) {
  const styles: Record<string, { bg: string; color: string }> = {
    default: { bg: shcColors.surfaceAlt, color: shcColors.text },
    success: { bg: shcColors.surfaceSuccess, color: shcColors.success },
    warning: { bg: shcColors.surfaceWarning, color: shcColors.warning },
    error: { bg: shcColors.surfaceError, color: shcColors.error },
    warm: { bg: shcColors.bentoPeach, color: shcColors.heritage },
  };
  const s = styles[variant];
  return (
    <View
      style={{
        backgroundColor: s.bg,
        paddingHorizontal: shcSpacing.sm,
        paddingVertical: 2,
        borderRadius: shcRadii.sm,
        borderWidth: 1,
        borderColor: shcColors.border,
      }}
    >
      <Text style={{ fontSize: 12, color: s.color, fontWeight: '600' }}>{children}</Text>
    </View>
  );
}

export function SHCMetaBadge({
  kind,
  children,
}: {
  kind: ShcBadgeSemanticKind;
  children: React.ReactNode;
}) {
  return <SHCBadge variant={shcBadgeVariant(kind)}>{children}</SHCBadge>;
}

export function SHCErrorBanner({ code, message }: { code?: string; message: string }) {
  return (
    <View
      style={{
        backgroundColor: shcColors.surfaceError,
        borderRadius: shcRadii.md,
        padding: shcSpacing.md,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.error,
        marginVertical: shcSpacing.sm,
        ...shcShadows.brutalSm,
      }}
    >
      {code && <Text style={{ fontSize: 10, color: shcColors.error, fontWeight: '700' }}>{code}</Text>}
      <Text style={{ color: shcColors.text, marginTop: 2, fontWeight: '500' }}>{message}</Text>
    </View>
  );
}

export function SHCInput(props: any) {
  return (
    <View
      style={{
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.md,
        padding: shcSpacing.sm,
        backgroundColor: shcColors.surface,
        ...shcShadows.brutalSm,
      }}
      {...props}
    />
  );
}

/** Wraps a major stacked block with section rhythm (12px top / 20px bottom). */
export function SHCSectionStack({
  children,
  style,
  testID,
}: {
  children: React.ReactNode;
  style?: any;
  testID?: string;
}) {
  return (
    <View testID={testID} style={[shcSectionStack, style]}>
      {children}
    </View>
  );
}

export function SHCSectionTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Text
      style={[
        {
          ...shcTypography.h2,
          color: shcColors.text,
          ...shcTitleBlock,
        },
        style,
      ]}
    >
      {children}
    </Text>
  );
}

export function SHCSearchBar({
  value,
  onChangeText,
  placeholder,
  testID,
  style,
}: {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  testID?: string;
  style?: any;
}) {
  return (
    <View
      style={[
        {
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: shcColors.surface,
          borderWidth: shcBorders.brutal,
          borderColor: shcColors.border,
          borderRadius: shcRadii.lg,
          paddingHorizontal: shcSpacing.md,
          paddingVertical: shcSpacing.sm,
          ...shcShadows.brutal,
        },
        style,
      ]}
    >
      <SHCIcon name="search" size={18} color={shcColors.textLight} />
      <View style={{ width: shcSpacing.sm }} />
      <TextInput
        placeholder={placeholder}
        value={value}
        onChangeText={onChangeText}
        testID={testID}
        style={{ flex: 1, fontSize: 14, color: shcColors.text, fontWeight: '500' }}
        placeholderTextColor={shcColors.textLight}
      />
    </View>
  );
}

export type SHCBottomTab = {
  key: string;
  label: string;
  /** Emoji fallback when iconKey omitted */
  icon?: string;
  iconKey?: SHCTabIconKey;
  testID: string;
  /** Optional count badge (e.g. cart tab) */
  badge?: string;
  /** Live orders cue — cooking animation when a meal is preparing today */
  ordersLiveCue?: 'cooking';
};

export function SHCBottomTabBar({
  tabs,
  activeKey,
  onTabPress,
  testID = 'bottom-tab-bar',
}: {
  tabs: SHCBottomTab[];
  activeKey: string;
  onTabPress: (key: string) => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        borderTopWidth: shcBorders.brutal,
        borderTopColor: shcColors.border,
        backgroundColor: shcColors.surface,
        paddingBottom: shcSpacing.sm,
        paddingTop: shcSpacing.xs,
        minHeight: shcSpacing.tabBarHeight,
        ...shcShadows.brutalSm,
      }}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        return (
          <Pressable
            key={tab.key}
            testID={tab.testID}
            onPress={() => onTabPress(tab.key)}
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
              paddingVertical: shcSpacing.xs,
            }}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
          >
            <View style={{ position: 'relative', marginBottom: 2 }}>
              {tab.iconKey ? (
                <SHCTabIcon iconKey={tab.iconKey} active={active} size={22} />
              ) : (
                <Text style={{ fontSize: 18 }}>{tab.icon ?? '•'}</Text>
              )}
              {tab.badge ? (
                <View
                  style={{
                    position: 'absolute',
                    top: -6,
                    right: -10,
                    minWidth: 16,
                    height: 16,
                    borderRadius: 8,
                    backgroundColor: shcColors.primary,
                    borderWidth: 2,
                    borderColor: shcColors.border,
                    alignItems: 'center',
                    justifyContent: 'center',
                    paddingHorizontal: 3,
                  }}
                >
                  <Text style={{ fontSize: 8, fontWeight: '900', color: shcColors.onPrimary }}>{tab.badge}</Text>
                </View>
              ) : null}
            </View>
            <Text
              style={{
                fontSize: 11,
                fontWeight: active ? '800' : '600',
                color: active ? shcColors.primary : shcColors.textLight,
              }}
            >
              {tab.label}
            </Text>
            {active && (
              <View
                style={{
                  position: 'absolute',
                  top: 0,
                  width: '60%',
                  height: 3,
                  backgroundColor: shcColors.primary,
                  borderRadius: shcRadii.pill,
                }}
              />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

export type SHCCategoryItem = {
  id: string;
  label: string;
  emoji?: string;
  imageUrl?: string;
};

export function SHCCategoryRail({
  categories,
  selectedId,
  onSelect,
  testID = 'category-rail',
}: {
  categories: SHCCategoryItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  testID?: string;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      testID={testID}
      contentContainerStyle={{
        gap: shcSpacing.md,
        paddingVertical: shcSpacing.sm,
        paddingRight: shcSpacing.md,
      }}
    >
      {categories.map((cat, index) => {
        const selected = cat.id === selectedId;
        const chipId = (cat.id || 'all').toLowerCase().replace(/\s+/g, '-');
        return (
          <Pressable
            key={`${cat.id || 'all'}-${index}`}
            testID={`category-chip-${chipId}`}
            onPress={() => onSelect(cat.id)}
            style={{ alignItems: 'center', width: 72 }}
          >
            <View
              style={{
                width: 64,
                height: 64,
                borderRadius: 32,
                overflow: 'hidden',
                borderWidth: shcBorders.brutal,
                borderColor: selected ? shcColors.primary : shcColors.border,
                backgroundColor: shcColors.surfaceAlt,
                ...shcShadows.brutalSm,
              }}
            >
              {cat.imageUrl ? (
                <Image source={{ uri: cat.imageUrl }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
              ) : (
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 28 }}>{cat.emoji ?? '🍽️'}</Text>
                </View>
              )}
            </View>
            <Text
              style={{
                fontSize: 10,
                fontWeight: selected ? '800' : '600',
                color: selected ? shcColors.primary : shcColors.textLight,
                marginTop: 4,
                textAlign: 'center',
              }}
              numberOfLines={2}
            >
              {cat.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

export function SHCStickyHeader({
  locationLabel,
  onLocationPress,
  searchValue,
  onSearchChange,
  searchPlaceholder = 'Search home-cooked dishes...',
  searchTestID = 'sticky-header-search',
  testID = 'sticky-header',
  elevated = false,
}: {
  locationLabel: string;
  onLocationPress?: () => void;
  searchValue: string;
  onSearchChange: (t: string) => void;
  searchPlaceholder?: string;
  searchTestID?: string;
  testID?: string;
  elevated?: boolean;
}) {
  return (
    <View
      testID={testID}
      style={{
        backgroundColor: shcColors.background,
        paddingHorizontal: shcSpacing.md,
        paddingTop: shcSpacing.stickyHeaderPadding,
        paddingBottom: shcSpacing.sm,
        borderBottomWidth: elevated ? shcBorders.brutal : 0,
        borderBottomColor: shcColors.border,
        ...(elevated ? shcShadows.brutalSm : {}),
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: shcSpacing.sm,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <Text style={{ fontSize: 16, marginRight: shcSpacing.xs }}>📍</Text>
          <Text
            style={{ ...shcTypography.h3, color: shcColors.text, flex: 1 }}
            numberOfLines={1}
            testID="sticky-header-location"
          >
            {locationLabel}
          </Text>
        </View>
        {onLocationPress && (
          <Pressable onPress={onLocationPress} testID="sticky-header-change-location">
            <Text style={{ fontSize: 13, fontWeight: '700', color: shcColors.primary }}>Change</Text>
          </Pressable>
        )}
      </View>
      <SHCSearchBar
        value={searchValue}
        onChangeText={onSearchChange}
        placeholder={searchPlaceholder}
        testID={searchTestID}
      />
    </View>
  );
}

export function SHCStickyActionBar({
  children,
  testID = 'sticky-action-bar',
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: shcColors.surface,
        borderTopWidth: shcBorders.brutal,
        borderTopColor: shcColors.border,
        paddingHorizontal: shcSpacing.md,
        paddingVertical: shcSpacing.md,
        ...shcShadows.brutal,
      }}
    >
      {children}
    </View>
  );
}

export function SHCQtyStepper({
  qty,
  minQty = 1,
  onDecrement,
  onIncrement,
  testID = 'qty-stepper',
}: {
  qty: number;
  minQty?: number;
  onDecrement: () => void;
  onIncrement: () => void;
  testID?: string;
}) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.md,
        backgroundColor: shcColors.surface,
        ...shcShadows.brutalSm,
      }}
    >
      <Pressable
        onPress={onDecrement}
        testID={`${testID}-decrement`}
        style={{ paddingHorizontal: shcSpacing.md, paddingVertical: shcSpacing.sm }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: shcColors.primary }}>−</Text>
      </Pressable>
      <Text
        style={{
          ...shcTypography.mono,
          color: shcColors.text,
          minWidth: 32,
          textAlign: 'center',
        }}
        testID={`${testID}-value`}
      >
        {qty}
      </Text>
      <Pressable
        onPress={onIncrement}
        testID={`${testID}-increment`}
        style={{ paddingHorizontal: shcSpacing.md, paddingVertical: shcSpacing.sm }}
      >
        <Text style={{ fontSize: 24, fontWeight: '800', color: shcColors.primary }}>+</Text>
      </Pressable>
    </View>
  );
}