/**
 * HomelyEats empty-screen illustrations (plate + cutlery, open box + hearts).
 * RN Views only — no external assets.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import type { EmptyIllustrationKind } from '@shc/utils';

const GOLD = '#F5C842';
const GOLD_DARK = '#E8A317';
const PLATE = '#F0EDE6';
const BOX = '#F5A623';
const HEART = '#E85D4C';

/** Plate with fork + knife — My Orders empty day */
export function EmptyOrdersPlateIllustration({ size = 120 }: { size?: number }) {
  const h = size * 0.55;
  return (
    <View
      style={[styles.row, { width: size * 1.4, height: h }]}
      accessibilityRole="image"
      accessibilityLabel="Empty plate"
      testID="empty-illust-no-orders"
    >
      {/* Fork */}
      <View style={[styles.fork, { height: h * 0.95 }]}>
        <View style={styles.forkTines}>
          <View style={styles.tine} />
          <View style={styles.tine} />
          <View style={styles.tine} />
        </View>
        <View style={styles.forkHandle} />
      </View>
      {/* Plate */}
      <View style={[styles.plateOuter, { width: size * 0.55, height: size * 0.55 }]}>
        <View style={[styles.plateInner, { width: size * 0.38, height: size * 0.38 }]} />
      </View>
      {/* Knife */}
      <View style={[styles.knife, { height: h * 0.95 }]}>
        <View style={styles.knifeBlade} />
        <View style={styles.knifeHandle} />
      </View>
    </View>
  );
}

/** Open yellow box with steam hearts — subscriptions empty */
export function EmptySubscriptionBoxIllustration({ size = 120 }: { size?: number }) {
  return (
    <View
      style={{ width: size, height: size, alignItems: 'center', justifyContent: 'flex-end' }}
      accessibilityRole="image"
      accessibilityLabel="Empty subscription box"
      testID="empty-illust-no-sub"
    >
      {/* Hearts / steam */}
      <View style={styles.steamRow}>
        <View style={[styles.heart, { transform: [{ rotate: '-18deg' }, { scale: 0.85 }] }]} />
        <View style={[styles.heart, styles.heartMid]} />
        <View style={[styles.heart, { transform: [{ rotate: '18deg' }, { scale: 0.85 }] }]} />
      </View>
      {/* Box body */}
      <View style={[styles.boxBody, { width: size * 0.72, height: size * 0.42 }]}>
        <View style={styles.boxFlapL} />
        <View style={styles.boxFlapR} />
        <View style={styles.boxInner} />
      </View>
    </View>
  );
}

export function EmptyIllustration({
  kind,
  size = 120,
}: {
  kind: EmptyIllustrationKind;
  size?: number;
}) {
  if (kind === 'no_orders') return <EmptyOrdersPlateIllustration size={size} />;
  return <EmptySubscriptionBoxIllustration size={size} />;
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  fork: {
    width: 14,
    alignItems: 'center',
  },
  forkTines: {
    flexDirection: 'row',
    gap: 2,
    height: '42%',
    alignItems: 'flex-end',
  },
  tine: {
    width: 3,
    height: '100%',
    backgroundColor: GOLD,
    borderRadius: 1.5,
  },
  forkHandle: {
    width: 5,
    flex: 1,
    backgroundColor: GOLD,
    borderRadius: 2.5,
    marginTop: 2,
  },
  plateOuter: {
    borderRadius: 999,
    backgroundColor: PLATE,
    borderWidth: 3,
    borderColor: GOLD_DARK,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plateInner: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: GOLD,
    opacity: 0.7,
  },
  knife: {
    width: 12,
    alignItems: 'center',
  },
  knifeBlade: {
    width: 8,
    height: '48%',
    backgroundColor: GOLD,
    borderTopLeftRadius: 2,
    borderTopRightRadius: 6,
  },
  knifeHandle: {
    width: 6,
    flex: 1,
    backgroundColor: GOLD_DARK,
    borderRadius: 2,
    marginTop: 2,
  },
  steamRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 10,
    marginBottom: 4,
    height: 36,
  },
  heart: {
    width: 14,
    height: 14,
    backgroundColor: HEART,
    borderRadius: 7,
    opacity: 0.9,
  },
  heartMid: {
    width: 18,
    height: 18,
    borderRadius: 9,
    marginBottom: 6,
  },
  boxBody: {
    backgroundColor: BOX,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: GOLD_DARK,
    overflow: 'hidden',
    position: 'relative',
  },
  boxFlapL: {
    position: 'absolute',
    top: -10,
    left: 4,
    width: '42%',
    height: 14,
    backgroundColor: GOLD,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 2,
    transform: [{ rotate: '-8deg' }],
  },
  boxFlapR: {
    position: 'absolute',
    top: -10,
    right: 4,
    width: '42%',
    height: 14,
    backgroundColor: GOLD,
    borderTopRightRadius: 6,
    borderTopLeftRadius: 2,
    transform: [{ rotate: '8deg' }],
  },
  boxInner: {
    margin: 10,
    flex: 1,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
});
