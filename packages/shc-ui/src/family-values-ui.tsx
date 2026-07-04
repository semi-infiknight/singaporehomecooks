// Family Values UI helpers — morphing labels, chevrons, tabs, shared image, celebration.
// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  computeSharedHeroTransform,
  wizardCtaMorphFrom,
} from './family-values-core';
import { gourmeatColors, shcSpacing, shcRadii } from './theme';
import { SHCButton, SHCButtonText } from './primitives';

export {
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  computeSharedHeroTransform,
} from './family-values-core';

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

export function SHCSharedDishImage({
  dishId,
  uri,
  style,
  hero = false,
  measureRef,
  testID,
}: {
  dishId: string;
  uri: string;
  style?: StyleProp<ImageStyle>;
  hero?: boolean;
  /** Attach ref for parent to measureInWindow before navigation. */
  measureRef?: React.Ref<View>;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const containerRef = useRef<View>(null);
  const pendingOrigin = hero && !reduce ? getSharedDishLayout(dishId) : undefined;
  const scale = useRef(new Animated.Value(pendingOrigin ? 0.55 : 1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const [ready, setReady] = useState(!hero || reduce || !pendingOrigin);

  const runHeroMorph = useCallback(() => {
    const origin = getSharedDishLayout(dishId);
    if (!origin || reduce) {
      scale.setValue(1);
      translateX.setValue(0);
      translateY.setValue(0);
      setReady(true);
      return;
    }
    containerRef.current?.measureInWindow((x, y, w, h) => {
      const t = computeSharedHeroTransform(origin, { x, y, w, h });
      scale.setValue(t.initialScale);
      translateX.setValue(t.translateX);
      translateY.setValue(t.translateY);
      setReady(true);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
      ]).start(() => clearSharedDishLayout(dishId));
    });
  }, [dishId, reduce, scale, translateX, translateY]);

  useEffect(() => {
    if (hero && !reduce) {
      requestAnimationFrame(runHeroMorph);
    }
  }, [hero, reduce, runHeroMorph]);

  const setRefs = useCallback(
    (node: View | null) => {
      (containerRef as React.MutableRefObject<View | null>).current = node;
      if (typeof measureRef === 'function') measureRef(node);
      else if (measureRef && 'current' in measureRef) (measureRef as React.MutableRefObject<View | null>).current = node;
    },
    [measureRef]
  );

  return (
    <Animated.View
      ref={setRefs}
      style={{ opacity: ready ? 1 : 0.01, transform: [{ scale }, { translateX }, { translateY }] }}
      onLayout={hero && !reduce ? runHeroMorph : undefined}
      testID={`shared-dish-wrap-${dishId}`}
    >
      <Image source={{ uri }} style={style} testID={testID || `shared-dish-${dishId}`} resizeMode="cover" />
    </Animated.View>
  );
}

/** Listing wizard primary CTA with morphing label + chevron on all steps. */
export function ListingWizardMorphCta({
  step,
  total = 4,
  editing = false,
  onPress,
  disabled,
  testID,
  showChevron = true,
}: {
  step: number;
  total?: number;
  editing?: boolean;
  onPress: () => void;
  disabled?: boolean;
  testID?: string;
  showChevron?: boolean;
}) {
  const { from, to } = wizardCtaMorphFrom(step, total, editing);
  return (
    <SHCButton onPress={onPress} disabled={disabled} testID={testID} style={styles.wizardCta}>
      <View style={styles.wizardCtaInner}>
        <SHCMorphingLabel from={from} to={to} testID={`${testID}-morph`} />
        {showChevron && step < total ? <SHCChevronNav color={gourmeatColors.onPrimary} /> : null}
      </View>
    </SHCButton>
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
  wizardCta: { marginTop: shcSpacing.sm },
  wizardCtaInner: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  celebration: {
    position: 'absolute',
    left: shcSpacing.md,
    right: shcSpacing.md,
    top: '30%',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.96)',
    borderRadius: shcRadii.lg,
    padding: shcSpacing.lg,
    zIndex: 9999,
    borderWidth: 2,
    borderColor: gourmeatColors.text,
  },
  celebrationEmoji: { fontSize: 40, marginBottom: shcSpacing.sm },
  celebrationMsg: { fontSize: 17, fontWeight: '800', textAlign: 'center', color: gourmeatColors.text },
});