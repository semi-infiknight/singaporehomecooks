// Family Values UI helpers — morphing labels, chevrons, tabs, shared image, celebration.
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, Text, View, StyleSheet, Image, type ImageStyle, type StyleProp } from 'react-native';
import {
  computeMorphingLabelSegments,
  morphingLabelTarget,
  shouldReduceMotion,
  tabSlideDirection,
  TAB_SLIDE_OFFSET,
  type MilestoneId,
  milestoneStorageKey,
  shouldShowMilestone,
  markMilestoneSeen,
} from './family-values-core';
import { gourmeatColors, shcSpacing } from './theme';

export function SHCMorphingLabel({
  from,
  to,
  style,
  testID = 'shc-morph-label',
}: {
  from: string;
  to: string;
  style?: object;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const segments = useMemo(() => computeMorphingLabelSegments(from, to), [from, to]);
  const target = morphingLabelTarget(segments);
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0.6)).current;

  useEffect(() => {
    if (reduce) return;
    opacity.setValue(0.6);
    Animated.timing(opacity, { toValue: 1, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [to, opacity, reduce]);

  return (
    <Animated.Text style={[styles.morphLabel, style, { opacity }]} testID={testID}>
      {target}
    </Animated.Text>
  );
}

export function SHCChevronNav({ back, size = 18, color = gourmeatColors.text }: { back?: boolean; size?: number; color?: string }) {
  const rotate = useRef(new Animated.Value(back ? 1 : 0)).current;
  const reduce = shouldReduceMotion();

  useEffect(() => {
    if (reduce) return;
    Animated.timing(rotate, {
      toValue: back ? 1 : 0,
      duration: 200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [back, reduce, rotate]);

  const spin = rotate.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <Animated.Text style={{ fontSize: size, fontWeight: '800', color, transform: [{ rotate: reduce ? (back ? '180deg' : '0deg') : spin }] }}>
      ›
    </Animated.Text>
  );
}

export function SHCDirectionalTabScene({
  tabIndex,
  prevIndex,
  children,
  testID,
}: {
  tabIndex: number;
  prevIndex: number;
  children: React.ReactNode;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const direction = tabSlideDirection(prevIndex, tabIndex);
  const fromX = direction === 'left' ? TAB_SLIDE_OFFSET : direction === 'right' ? -TAB_SLIDE_OFFSET : 0;
  const translateX = useRef(new Animated.Value(reduce ? 0 : fromX)).current;
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0.85)).current;

  useEffect(() => {
    if (reduce || direction === 'none') return;
    translateX.setValue(fromX);
    opacity.setValue(0.85);
    Animated.parallel([
      Animated.timing(translateX, { toValue: 0, duration: 220, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [tabIndex, direction, fromX, opacity, reduce, translateX]);

  return (
    <Animated.View style={{ flex: 1, opacity, transform: [{ translateX }] }} testID={testID}>
      {children}
    </Animated.View>
  );
}

const sharedImageRegistry = new Map<string, { x: number; y: number; w: number; h: number }>();

export function registerSharedDishLayout(id: string, layout: { x: number; y: number; w: number; h: number }) {
  sharedImageRegistry.set(id, layout);
}

export function SHCSharedDishImage({
  dishId,
  uri,
  style,
  hero = false,
  testID,
}: {
  dishId: string;
  uri: string;
  style?: StyleProp<ImageStyle>;
  hero?: boolean;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const scale = useRef(new Animated.Value(hero && !reduce ? 1.02 : 1)).current;

  useEffect(() => {
    if (reduce || !hero) return;
    scale.setValue(1.02);
    Animated.spring(scale, { toValue: 1, friction: 8, tension: 80, useNativeDriver: true }).start();
  }, [dishId, hero, reduce, scale]);

  return (
    <Animated.View style={{ transform: [{ scale }] }}>
      <Image source={{ uri }} style={style} testID={testID || `shared-dish-${dishId}`} resizeMode="cover" />
    </Animated.View>
  );
}

export function SHCCelebration({
  visible,
  message,
  onDone,
  testID = 'shc-celebration',
}: {
  visible: boolean;
  message: string;
  onDone?: () => void;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    if (!visible) return;
    if (reduce) {
      const t = setTimeout(() => onDone?.(), 1200);
      return () => clearTimeout(t);
    }
    opacity.setValue(0);
    scale.setValue(0.9);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 320, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 6, useNativeDriver: true }),
    ]).start();
    const t = setTimeout(() => {
      Animated.timing(opacity, { toValue: 0, duration: 400, useNativeDriver: true }).start(() => onDone?.());
    }, 2200);
    return () => clearTimeout(t);
  }, [visible, onDone, opacity, reduce, scale]);

  if (!visible) return null;

  return (
    <Animated.View style={[styles.celebration, { opacity, transform: [{ scale }] }]} testID={testID} pointerEvents="none">
      <Text style={styles.celebrationEmoji}>🎉</Text>
      <Text style={styles.celebrationMsg}>{message}</Text>
    </Animated.View>
  );
}

/** In-memory milestone guard — apps persist via SecureStore/AsyncStorage wrapper. */
export function useMilestoneCelebration(
  id: MilestoneId,
  userId: string,
  storage?: { get: (k: string) => Promise<string | null>; set: (k: string, v: string) => Promise<void> }
) {
  const [seen, setSeen] = useState<Record<string, boolean>>({});
  const [show, setShow] = useState(false);
  const key = milestoneStorageKey(id, userId);

  useEffect(() => {
    if (!storage || !userId) return;
    storage.get(key).then((v) => {
      if (v === '1') setSeen((s) => ({ ...s, [key]: true }));
    });
  }, [key, storage, userId]);

  const triggerIfFirst = async () => {
    if (!shouldShowMilestone(id, userId, seen)) return false;
    setShow(true);
    setSeen((s) => markMilestoneSeen(id, userId, s));
    if (storage) await storage.set(key, '1');
    return true;
  };

  const dismiss = () => setShow(false);

  return { show, triggerIfFirst, dismiss, key };
}

const styles = StyleSheet.create({
  morphLabel: { fontWeight: '800', fontSize: 15, color: gourmeatColors.onPrimary },
  celebration: {
    position: 'absolute',
    left: shcSpacing.md,
    right: shcSpacing.md,
    top: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: 16,
    padding: shcSpacing.lg,
    zIndex: 9999,
    borderWidth: 2,
    borderColor: gourmeatColors.text,
  },
  celebrationEmoji: { fontSize: 40, marginBottom: shcSpacing.sm },
  celebrationMsg: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: gourmeatColors.text },
});