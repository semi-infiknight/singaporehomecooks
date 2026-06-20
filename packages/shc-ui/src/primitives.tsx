// @ts-nocheck -- RN JSX types resolution for shared lib (consumed by Expo mobile only); runtime correct.
import React from 'react';
import { View, Text, Pressable, TextInput, ScrollView, Image } from 'react-native';
import { shcColors, shcRadii, shcSpacing, shcBorders, shcShadows, shcTypography } from './theme';
import { SHCIcon, SHCTabIcon, type SHCTabIconKey } from './icons';

type ButtonVariant = 'primary' | 'outline' | 'accent' | 'ghost';
type ButtonSize = 'sm' | 'md' | 'lg';

const buttonSizes: Record<ButtonSize, { paddingH: number; paddingV: number; fontSize: number }> = {
  sm: { paddingH: 12, paddingV: 6, fontSize: 12 },
  md: { paddingH: 16, paddingV: 10, fontSize: 14 },
  lg: { paddingH: 20, paddingV: 14, fontSize: 16 },
};

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
    variant === 'outline' || variant === 'ghost'
      ? shcColors.text
      : variant === 'accent'
        ? shcColors.text
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
  const variantStyle =
    variant === 'outline'
      ? { backgroundColor: shcColors.surface, borderWidth: shcBorders.brutal, borderColor: shcColors.border }
      : variant === 'accent'
        ? { backgroundColor: shcColors.accent, borderWidth: shcBorders.brutal, borderColor: shcColors.border }
        : variant === 'ghost'
          ? { backgroundColor: 'transparent', borderWidth: 0 }
          : { backgroundColor: shcColors.primary, borderWidth: shcBorders.brutal, borderColor: shcColors.border };

  const textColor =
    variant === 'outline' || variant === 'ghost'
      ? shcColors.text
      : variant === 'accent'
        ? shcColors.text
        : shcColors.onPrimary;

  return (
    <Pressable ref={ref} onPress={onPress} disabled={disabled} testID={testID} accessibilityRole="button">
      {({ pressed }) => (
        <View
          style={[
            {
              paddingHorizontal: sz.paddingH,
              paddingVertical: sz.paddingV,
              borderRadius: shcRadii.md,
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: size === 'lg' ? 52 : size === 'sm' ? 36 : 44,
              opacity: disabled ? 0.5 : 1,
              transform: [{ scale: pressed && !disabled ? 0.98 : 1 }],
              ...(pressed && !disabled ? shcShadows.brutalPressed : shcShadows.brutalSm),
            },
            variantStyle,
            style,
          ]}
        >
          {typeof children === 'string' ? (
            <Text style={{ color: textColor, textAlign: 'center', fontWeight: '800', fontSize: sz.fontSize }}>{children}</Text>
          ) : (
            React.Children.map(children, (child) => {
              if (!React.isValidElement(child)) return child;
              const isLabel =
                child.type === Text ||
                (child.type as { displayName?: string })?.displayName === 'SHCButtonText';
              if (isLabel) {
                return React.cloneElement(child as React.ReactElement<{ style?: any; variant?: ButtonVariant }>, {
                  variant,
                  style: [{ color: textColor, textAlign: 'center', fontWeight: '800', fontSize: sz.fontSize }, child.props.style],
                });
              }
              return child;
            })
          )}
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
          marginBottom: shcSpacing.md,
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
  variant?: 'default' | 'success' | 'warning' | 'error' | 'heritage';
}) {
  const styles: Record<string, { bg: string; color: string }> = {
    default: { bg: shcColors.surfaceAlt, color: shcColors.text },
    success: { bg: shcColors.surfaceSuccess, color: shcColors.success },
    warning: { bg: shcColors.surfaceWarning, color: shcColors.warning },
    error: { bg: shcColors.surfaceError, color: shcColors.error },
    heritage: { bg: shcColors.bentoPeach, color: shcColors.heritage },
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

export function SHCSectionTitle({ children, style }: { children: React.ReactNode; style?: any }) {
  return (
    <Text
      style={[
        {
          ...shcTypography.h2,
          color: shcColors.text,
          marginBottom: shcSpacing.sm,
          marginTop: shcSpacing.md,
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
      {categories.map((cat) => {
        const selected = cat.id === selectedId;
        const chipId = (cat.id || 'all').toLowerCase().replace(/\s+/g, '-');
        return (
          <Pressable
            key={cat.id || 'all'}
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