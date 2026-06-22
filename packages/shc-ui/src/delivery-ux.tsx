// Food-delivery UX patterns (Weavers Web 2025 + dev.to food-app guide + Zomato/Swiggy).
// @ts-nocheck
import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { shcColors, shcRadii, shcSpacing, shcBorders, shcShadows } from './theme';
import { SHCIcon, type SHCIconKey } from './icons';
import { SHCButton } from './primitives';
import {
  COLLECTION_ORDER_TIMELINE,
  getOrderTimelineIndex,
  getOrderStatusLabel,
} from '@shc/utils';

/**
 * Swiggy/Zomato-style sticky cart bar — docked above bottom tabs (NOT absolute in scroll content).
 * Principle 3: make ordering easy with one-tap checkout CTA while browsing.
 */
export function SHCStickyCartBar({
  itemCount,
  countLabel,
  totalLabel,
  previewName,
  onPress,
  testID = 'sticky-cart-bar',
}: {
  itemCount: number;
  countLabel: string;
  totalLabel: string;
  previewName?: string;
  onPress: () => void;
  testID?: string;
}) {
  if (itemCount <= 0) return null;

  const badge = itemCount > 99 ? '99+' : String(itemCount);

  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={`View cart, ${countLabel}, ${totalLabel}`}
      style={({ pressed }) => [
        stickyCartBarStyles.shell,
        pressed ? stickyCartBarStyles.pressed : null,
      ]}
    >
      <View style={stickyCartBarStyles.left}>
        <View style={stickyCartBarStyles.bagCircle}>
          <SHCIcon name="cart" size={18} color={shcColors.primary} active />
        </View>
        <View style={stickyCartBarStyles.copy}>
          <Text style={stickyCartBarStyles.countText} numberOfLines={1}>
            {countLabel}
          </Text>
          <Text style={stickyCartBarStyles.ctaText} numberOfLines={1}>
            View cart · PayNow
          </Text>
          {previewName ? (
            <Text style={stickyCartBarStyles.previewText} numberOfLines={1}>
              {previewName}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={stickyCartBarStyles.right}>
        <View style={stickyCartBarStyles.badge}>
          <Text style={stickyCartBarStyles.badgeText}>{badge}</Text>
        </View>
        <Text style={stickyCartBarStyles.totalText}>{totalLabel}</Text>
        <Text style={stickyCartBarStyles.chevron}>›</Text>
      </View>
    </Pressable>
  );
}

const stickyCartBarStyles = {
  shell: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: shcColors.primary,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.lg,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
    minHeight: 58,
    gap: shcSpacing.sm,
    ...shcShadows.brutal,
  },
  pressed: {
    backgroundColor: shcColors.primaryDark,
  },
  left: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: shcSpacing.sm,
    minWidth: 0,
  },
  bagCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: shcColors.onPrimary,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  countText: {
    color: shcColors.onPrimary,
    fontWeight: '900',
    fontSize: 14,
    letterSpacing: -0.2,
  },
  ctaText: {
    color: shcColors.onPrimary,
    fontWeight: '700',
    fontSize: 11,
    opacity: 0.92,
    marginTop: 1,
  },
  previewText: {
    color: shcColors.onPrimary,
    fontWeight: '600',
    fontSize: 10,
    opacity: 0.85,
    marginTop: 2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: shcSpacing.xs,
    flexShrink: 0,
  },
  badge: {
    minWidth: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: shcColors.accent,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '900',
    color: shcColors.text,
  },
  totalText: {
    color: shcColors.onPrimary,
    fontWeight: '900',
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  chevron: {
    color: shcColors.onPrimary,
    fontWeight: '900',
    fontSize: 20,
    lineHeight: 20,
    marginLeft: 2,
  },
};

/** @deprecated Use SHCStickyCartBar in tab chrome — absolute pills overlap tab bars */
export function SHCFloatingCartPill(props: {
  itemCount: number;
  totalLabel: string;
  onPress: () => void;
  testID?: string;
}) {
  const countLabel = props.itemCount === 1 ? '1 item' : `${props.itemCount} items`;
  return (
    <SHCStickyCartBar
      itemCount={props.itemCount}
      countLabel={countLabel}
      totalLabel={props.totalLabel}
      onPress={props.onPress}
      testID={props.testID}
    />
  );
}

/** Principle 5: seamless onboarding — browse first, sign in at checkout */
export function SHCGuestBrowseBar({
  onSignInPress,
  testID = 'guest-browse-bar',
}: {
  onSignInPress: () => void;
  testID?: string;
}) {
  return (
    <View style={guestBrowseStyles.shell} testID={testID}>
      <View style={guestBrowseStyles.copyWrap}>
        <Text style={guestBrowseStyles.eyebrow}>Guest browsing</Text>
        <Text style={guestBrowseStyles.copy}>Sign in to checkout and track orders</Text>
      </View>
      <SHCButton onPress={onSignInPress} size="md" testID={`${testID}-cta`}>
        Sign in
      </SHCButton>
    </View>
  );
}

const guestBrowseStyles = {
  shell: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: shcSpacing.sm,
    backgroundColor: shcColors.bentoYellow,
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    borderRadius: shcRadii.lg,
    paddingVertical: shcSpacing.md,
    paddingHorizontal: shcSpacing.md,
    marginBottom: shcSpacing.section,
    minHeight: 60,
    ...shcShadows.brutal,
  },
  copyWrap: {
    flex: 1,
    minWidth: 0,
    paddingRight: shcSpacing.xs,
  },
  eyebrow: {
    fontSize: 10,
    fontWeight: '800',
    color: shcColors.textLight,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  copy: {
    fontSize: 13,
    fontWeight: '800',
    color: shcColors.text,
    lineHeight: 18,
  },
};

/** Principle 4: personalization — location + tailored rail title */
export function SHCPersonalizedSectionHeader({
  title,
  subtitle,
  testID,
}: {
  title: string;
  subtitle?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ marginBottom: shcSpacing.xs }}>
      <Text style={{ fontSize: 16, fontWeight: '900', color: shcColors.text, letterSpacing: -0.3 }}>{title}</Text>
      {subtitle ? (
        <Text style={{ fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginTop: 2 }}>{subtitle}</Text>
      ) : null}
    </View>
  );
}

/** Principle 1 + trust: social proof strip (ratings, cooks, collection) */
const TRUST_ITEMS: { iconKey: SHCIconKey; label: string; sub: string }[] = [
  { iconKey: 'discover', label: '127+ cooks', sub: '28 SG areas' },
  { iconKey: 'orders', label: '4,892 meals', sub: 'This month' },
  { iconKey: 'compliance', label: 'Allergen ack', sub: 'Before checkout' },
  { iconKey: 'paynow', label: 'PayNow secure', sub: 'Manual confirm' },
];

export function SHCTrustStrip({ testID = 'trust-strip' }: { testID?: string }) {
  return (
    <View
      testID={testID}
      style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: shcSpacing.sm,
        marginTop: shcSpacing.section,
        marginBottom: shcSpacing.md,
      }}
    >
      {TRUST_ITEMS.map((item) => (
        <View
          key={item.label}
          style={{
            width: '48%',
            backgroundColor: shcColors.surface,
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            borderRadius: shcRadii.lg,
            padding: shcSpacing.sm,
            alignItems: 'center',
            ...shcShadows.brutalSm,
          }}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 16,
              backgroundColor: shcColors.bentoMint,
              borderWidth: shcBorders.brutal,
              borderColor: shcColors.border,
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 4,
            }}
          >
            <SHCIcon name={item.iconKey} size={16} color={shcColors.primary} active />
          </View>
          <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.text, textAlign: 'center' }}>{item.label}</Text>
          <Text style={{ fontSize: 9, fontWeight: '600', color: shcColors.textLight, textAlign: 'center', marginTop: 2 }}>
            {item.sub}
          </Text>
        </View>
      ))}
    </View>
  );
}

/** dev.to: real-time order updates — visual collection timeline */
export function SHCOrderTimeline({
  status,
  live = false,
  testID = 'order-timeline',
}: {
  status: string;
  live?: boolean;
  testID?: string;
}) {
  const current = getOrderTimelineIndex(status);
  const isCancelled = status === 'cancelled' || status === 'disputed';

  return (
    <View testID={testID} style={{ marginVertical: shcSpacing.md }}>
      {live && current >= 0 && !isCancelled && (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: shcSpacing.sm }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: shcColors.success }} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.success }}>Live updates</Text>
        </View>
      )}
      {isCancelled ? (
        <View
          style={{
            backgroundColor: shcColors.surfaceError,
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            borderRadius: shcRadii.md,
            padding: shcSpacing.md,
          }}
        >
          <Text style={{ fontWeight: '800', color: shcColors.error }}>{getOrderStatusLabel(status)}</Text>
        </View>
      ) : (
        COLLECTION_ORDER_TIMELINE.map((step, i) => {
          const done = current > i;
          const active = current === i;
          return (
            <View key={step.id} style={{ flexDirection: 'row', gap: shcSpacing.sm, marginBottom: shcSpacing.sm }}>
              <View style={{ alignItems: 'center', width: 28 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    borderWidth: shcBorders.brutal,
                    borderColor: done || active ? shcColors.primary : shcColors.borderLight,
                    backgroundColor: done ? shcColors.primary : active ? shcColors.bentoPeach : shcColors.surface,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {done ? (
                    <SHCIcon name="checkmark" size={12} color={shcColors.onPrimary} active />
                  ) : (
                    <Text style={{ fontSize: 10, fontWeight: '900', color: active ? shcColors.primary : shcColors.textLight }}>
                      {i + 1}
                    </Text>
                  )}
                </View>
                {i < COLLECTION_ORDER_TIMELINE.length - 1 && (
                  <View
                    style={{
                      width: 2,
                      flex: 1,
                      minHeight: 16,
                      backgroundColor: done ? shcColors.primary : shcColors.borderLight,
                      marginTop: 2,
                    }}
                  />
                )}
              </View>
              <View style={{ flex: 1, paddingBottom: shcSpacing.xs }}>
                <Text style={{ fontSize: 13, fontWeight: active ? '900' : '700', color: shcColors.text }}>{step.label}</Text>
                <Text style={{ fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginTop: 2 }}>{step.detail}</Text>
              </View>
            </View>
          );
        })
      )}
    </View>
  );
}

/** dev.to: make ordering easy — concise ingredients, allergens, nutrition */
export function SHCDishOrderingInfo({
  tier1 = [],
  tier2 = [],
  tier3 = [],
  ingredients = [],
  calories,
  caloriesConfidence,
  heritageNote,
  testID = 'dish-ordering-info',
}: {
  tier1?: string[];
  tier2?: string[];
  tier3?: string[];
  ingredients?: Array<{ name?: string; qty?: string; quantity?: string; unit?: string } | string>;
  calories?: number;
  caloriesConfidence?: 'full' | 'category';
  heritageNote?: string;
  testID?: string;
}) {
  return (
    <View testID={testID} style={{ gap: shcSpacing.md, marginBottom: shcSpacing.md }}>
      {heritageNote ? (
        <View
          style={{
            backgroundColor: shcColors.bentoYellow,
            borderWidth: shcBorders.brutal,
            borderColor: shcColors.border,
            borderRadius: shcRadii.md,
            padding: shcSpacing.md,
            ...shcShadows.brutalSm,
          }}
        >
          <Text style={{ fontSize: 13, fontWeight: '600', fontStyle: 'italic', color: shcColors.heritage }}>{heritageNote}</Text>
        </View>
      ) : null}

      <View
        style={{
          backgroundColor: shcColors.surface,
          borderWidth: shcBorders.brutal,
          borderColor: shcColors.border,
          borderRadius: shcRadii.lg,
          padding: shcSpacing.md,
          ...shcShadows.brutalSm,
        }}
      >
        <Text style={{ fontSize: 14, fontWeight: '900', color: shcColors.text, marginBottom: shcSpacing.sm }}>
          Ingredients &amp; allergens
        </Text>

        {tier1.length > 0 && (
          <Text style={{ fontSize: 12, fontWeight: '700', color: shcColors.error, marginBottom: 4 }}>
            Contains: {tier1.join(', ')}
          </Text>
        )}
        {tier2.length > 0 && (
          <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginBottom: 4 }}>
            May contain: {tier2.join(', ')}
          </Text>
        )}
        {tier3.length > 0 && (
          <Text style={{ fontSize: 12, fontWeight: '600', color: shcColors.textLight, marginBottom: 4 }}>
            Trace: {tier3.join(', ')}
          </Text>
        )}

        {ingredients.length > 0 && (
          <View style={{ marginTop: shcSpacing.sm, paddingTop: shcSpacing.sm, borderTopWidth: 1, borderTopColor: shcColors.borderLight }}>
            <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.textLight, marginBottom: 4 }}>INGREDIENTS</Text>
            {ingredients.slice(0, 8).map((ing, i) => {
              const label =
                typeof ing === 'string'
                  ? ing
                  : `${ing.name || ''}${ing.qty || ing.quantity ? ` — ${ing.qty || ing.quantity}${ing.unit ? ` ${ing.unit}` : ''}` : ''}`;
              return (
                <Text key={i} style={{ fontSize: 12, fontWeight: '600', color: shcColors.text, marginTop: 2 }}>
                  · {label}
                </Text>
              );
            })}
          </View>
        )}

        {calories != null && (
          <Text style={{ fontSize: 11, fontWeight: '700', color: shcColors.textLight, marginTop: shcSpacing.sm }}>
            ~{calories} cal per portion
            {caloriesConfidence === 'category' ? ' (category estimate)' : ''}
          </Text>
        )}
      </View>
    </View>
  );
}

/** dev.to: personalize — save favorite dishes */
export function SHCFavoriteButton({
  active,
  onPress,
  testID = 'favorite-btn',
}: {
  active: boolean;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      hitSlop={8}
      style={{
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: active ? shcColors.bentoPeach : shcColors.surface,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        alignItems: 'center',
        justifyContent: 'center',
        ...shcShadows.brutalSm,
      }}
      accessibilityRole="button"
      accessibilityLabel={active ? 'Remove from saved dishes' : 'Save dish'}
    >
      <Text style={{ fontSize: 18, color: active ? shcColors.primary : shcColors.textLight }}>{active ? '♥' : '♡'}</Text>
    </Pressable>
  );
}

/** dev.to: real-time — tap-through banner for in-progress orders on discover */
export function SHCActiveOrderBanner({
  statusLabel,
  dishName,
  collectionLabel,
  onPress,
  testID = 'active-order-banner',
}: {
  statusLabel: string;
  dishName?: string;
  collectionLabel?: string;
  onPress: () => void;
  testID?: string;
}) {
  return (
    <Pressable
      onPress={onPress}
      testID={testID}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: shcColors.bentoMint,
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        borderRadius: shcRadii.md,
        padding: shcSpacing.md,
        marginBottom: shcSpacing.section,
        ...shcShadows.brutalSm,
      }}
    >
      <View style={{ flex: 1, paddingRight: shcSpacing.sm }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: shcColors.success }} />
          <Text style={{ fontSize: 11, fontWeight: '800', color: shcColors.success }}>Order in progress</Text>
        </View>
        <Text style={{ fontSize: 14, fontWeight: '900', color: shcColors.text, marginTop: 4 }} numberOfLines={1}>
          {statusLabel}
        </Text>
        {dishName ? (
          <Text style={{ fontSize: 11, fontWeight: '600', color: shcColors.textLight, marginTop: 2 }} numberOfLines={1}>
            {dishName}
            {collectionLabel ? ` · ${collectionLabel}` : ''}
          </Text>
        ) : null}
      </View>
      <Text style={{ fontSize: 12, fontWeight: '900', color: shcColors.primary }}>Track →</Text>
    </Pressable>
  );
}