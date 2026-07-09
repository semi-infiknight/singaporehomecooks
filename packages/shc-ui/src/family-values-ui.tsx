// Family Values UI helpers — morphing labels, chevrons, tabs, shared image, celebration.
// @ts-nocheck
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Text,
  View,
  Pressable,
  StyleSheet,
  Image,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {
  computeMorphingLabelSegments,
  shouldReduceMotion,
  tabSlideDirection,
  TAB_SLIDE_OFFSET,
  type MilestoneId,
  milestoneStorageKey,
  isValidSecureStoreKey,
  shouldShowMilestone,
  markMilestoneSeen,
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  computeSharedHeroTransform,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  applySharedDishPress,
  navigateSharedDishPress,
  cacheSharedDishLayoutFromRef,
  wizardCtaMorphOnStepEnter,
  wizardCtaMorphFromTransition,
} from './family-values-core';
import { gourmeatColors, shcSpacing, shcRadii } from './theme';
import { SHCButton, SHCButtonText } from './primitives';

export {
  registerSharedDishLayout,
  getSharedDishLayout,
  clearSharedDishLayout,
  computeSharedHeroTransform,
  getSyncHeroTransformForDish,
  HERO_RECT_MOBILE,
  HERO_RECT_WEB,
} from './family-values-core';

/** Keep thumbnail layout warm so PDP hero morph has origin before async measure returns. */
export function useSharedDishLayoutCache(dishId: string, imageRef: React.RefObject<View | null>) {
  const refreshCache = useCallback(() => {
    const node = imageRef.current;
    if (!node) return;
    cacheSharedDishLayoutFromRef(dishId, (cb) => node.measureInWindow(cb));
  }, [dishId, imageRef]);

  useEffect(() => {
    refreshCache();
  }, [refreshCache]);

  return refreshCache;
}

/** Single press path: measure thumbnail → register layout → always navigate. */
export function useSharedDishPress(
  dishId: string,
  imageRef: React.RefObject<View | null>,
  onNavigate?: () => void
) {
  useSharedDishLayoutCache(dishId, imageRef);

  return useCallback(() => {
    const node = imageRef.current;
    if (!node) {
      navigateSharedDishPress(dishId, getSharedDishLayout(dishId) ?? null, onNavigate);
      return;
    }
    node.measureInWindow((x, y, w, h) => {
      navigateSharedDishPress(dishId, { x, y, w, h }, onNavigate);
    });
  }, [dishId, imageRef, onNavigate]);
}

/** One outer Pressable per dish card — children receive measureRef for SHCSharedDishImage. */
export function SharedDishNavSurface({
  dishId,
  onNavigate,
  testID,
  style,
  children,
}: {
  dishId: string;
  onNavigate?: () => void;
  testID?: string;
  style?: StyleProp<ViewStyle> | ((state: { pressed: boolean }) => StyleProp<ViewStyle>);
  children: (api: { measureRef: React.RefObject<View | null> }) => React.ReactNode;
}) {
  const measureRef = useRef<View | null>(null);
  const handlePress = useSharedDishPress(dishId, measureRef, onNavigate);

  return (
    <Pressable onPress={handlePress} testID={testID} style={style} accessibilityRole="button">
      {children({ measureRef })}
    </Pressable>
  );
}

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
  const sharedText = segments
    .filter((s) => s.kind === 'shared')
    .map((s) => s.text)
    .join('');
  const outText = segments
    .filter((s) => s.kind === 'out')
    .map((s) => s.text)
    .join('');
  const inText = segments
    .filter((s) => s.kind === 'in')
    .map((s) => s.text)
    .join('');
  const outOpacity = useRef(new Animated.Value(1)).current;
  const inOpacity = useRef(new Animated.Value(from === to ? 1 : 0)).current;
  const containerOpacity = useRef(new Animated.Value(reduce ? 1 : 0.9)).current;

  useEffect(() => {
    if (from === to || reduce) {
      outOpacity.setValue(0);
      inOpacity.setValue(1);
      containerOpacity.setValue(1);
      return;
    }
    outOpacity.setValue(1);
    inOpacity.setValue(0);
    containerOpacity.setValue(0.9);
    Animated.parallel([
      Animated.timing(containerOpacity, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.sequence([
        Animated.delay(100),
        Animated.timing(outOpacity, { toValue: 0, duration: 160, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(inOpacity, { toValue: 1, duration: 200, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      ]),
    ]).start();
  }, [from, to, reduce, outOpacity, inOpacity, containerOpacity]);

  if (from === to) {
    return (
      <Animated.Text style={[styles.morphLabel, style, { opacity: containerOpacity }]} testID={testID}>
        {to}
      </Animated.Text>
    );
  }

  return (
    <Animated.Text style={[styles.morphLabel, style, { opacity: containerOpacity }]} testID={testID}>
      {sharedText}
      {outText ? <Animated.Text style={{ opacity: outOpacity }}>{outText}</Animated.Text> : null}
      {inText ? <Animated.Text style={{ opacity: inOpacity }}>{inText}</Animated.Text> : null}
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
  const [heroRect, setHeroRect] = useState(HERO_RECT_MOBILE);
  const scale = useRef(new Animated.Value(1)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const morphStarted = useRef(false);

  const measureHeroRect = useCallback(() => {
    if (!hero) return;
    const node = containerRef.current;
    if (!node) return;
    node.measureInWindow((x, y, w, h) => {
      if (w <= 0 || h <= 0) return;
      setHeroRect((prev) => {
        if (prev.x === x && prev.y === y && prev.w === w && prev.h === h) return prev;
        return { x, y, w, h };
      });
    });
  }, [hero]);

  const runHeroMorph = useCallback(
    (attempt = 0) => {
      if (!hero || reduce || morphStarted.current) return;
      const sync = getSyncHeroTransformForDish(dishId, heroRect);
      if (!sync.hasOrigin) {
        if (attempt < 12) requestAnimationFrame(() => runHeroMorph(attempt + 1));
        return;
      }
      morphStarted.current = true;
      scale.setValue(sync.initialScale);
      translateX.setValue(sync.translateX);
      translateY.setValue(sync.translateY);
      Animated.parallel([
        Animated.spring(scale, { toValue: 1, friction: 8, tension: 70, useNativeDriver: true }),
        Animated.spring(translateX, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
        Animated.spring(translateY, { toValue: 0, friction: 8, tension: 70, useNativeDriver: true }),
      ]).start(() => clearSharedDishLayout(dishId));
    },
    [dishId, hero, heroRect, reduce, scale, translateX, translateY]
  );

  useEffect(() => {
    morphStarted.current = false;
    if (hero && !reduce) measureHeroRect();
  }, [dishId, hero, reduce, measureHeroRect]);

  useEffect(() => {
    if (hero && !reduce) runHeroMorph(0);
  }, [dishId, hero, reduce, heroRect, runHeroMorph]);

  const setRefs = useCallback(
    (node: View | null) => {
      (containerRef as React.MutableRefObject<View | null>).current = node;
      if (typeof measureRef === 'function') measureRef(node);
      else if (measureRef && 'current' in measureRef) (measureRef as React.MutableRefObject<View | null>).current = node;
    },
    [measureRef]
  );

  const cacheLayout = useCallback(() => {
    if (hero) return;
    const node = containerRef.current;
    if (!node) return;
    cacheSharedDishLayoutFromRef(dishId, (cb) => node.measureInWindow(cb));
  }, [dishId, hero]);

  return (
    <Animated.View
      ref={setRefs}
      onLayout={() => {
        cacheLayout();
        measureHeroRect();
      }}
      style={{ transform: [{ scale }, { translateX }, { translateY }] }}
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
  const prevStepRef = useRef(step);
  const prevEditingRef = useRef(editing);
  const [morph, setMorph] = useState(() => wizardCtaMorphOnStepEnter(step, total, editing));

  useEffect(() => {
    if (prevStepRef.current !== step) {
      setMorph(wizardCtaMorphFromTransition(prevStepRef.current, step, total, editing));
      prevStepRef.current = step;
      prevEditingRef.current = editing;
      return;
    }
    if (step >= total && prevEditingRef.current !== editing) {
      setMorph({ from: 'Review', to: editing ? 'Save changes' : 'Publish' });
      prevEditingRef.current = editing;
    }
  }, [step, total, editing]);

  const { from, to } = morph;
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
    if (!storage || !userId || !isValidSecureStoreKey(key)) return;
    storage.get(key).then((v) => {
      if (v === '1') setSeen((s) => ({ ...s, [key]: true }));
    });
  }, [key, storage, userId]);

  const triggerIfFirst = async () => {
    if (!shouldShowMilestone(id, userId, seen)) return false;
    setShow(true);
    setSeen((s) => markMilestoneSeen(id, userId, s));
    if (storage && isValidSecureStoreKey(key)) await storage.set(key, '1');
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