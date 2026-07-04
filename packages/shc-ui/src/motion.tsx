// Motion primitives — Moti when available; static fallbacks for SSR/monorepo edge cases.
// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { Animated, View, Easing } from 'react-native';
import { shouldReduceMotion } from './family-values-core';

let MotiView: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  MotiView = require('moti').MotiView;
} catch {
  MotiView = null;
}

export function SHCFadeIn({
  children,
  delay = 0,
  fromY = 8,
  testID,
}: {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  testID?: string;
}) {
  const reduce = shouldReduceMotion();
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const translateY = useRef(new Animated.Value(reduce ? 0 : fromY)).current;

  useEffect(() => {
    if (reduce) return;
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 300, delay, useNativeDriver: true }),
      Animated.timing(translateY, { toValue: 0, duration: 300, delay, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [delay, fromY, opacity, reduce, translateY]);

  if (MotiView && !reduce) {
    return (
      <MotiView
        from={{ opacity: 0, translateY: fromY }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'timing', duration: 300, delay }}
        testID={testID}
      >
        {children}
      </MotiView>
    );
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }} testID={testID}>
      {children}
    </Animated.View>
  );
}

export function SHCStaggerIn({
  children,
  index = 0,
  fromY = 8,
}: {
  children: React.ReactNode;
  index?: number;
  fromY?: number;
}) {
  return <SHCFadeIn delay={index * 60} fromY={fromY}>{children}</SHCFadeIn>;
}

export function SHCWizardPane({
  stepKey,
  children,
}: {
  stepKey: string | number;
  children: React.ReactNode;
}) {
  const reduce = shouldReduceMotion();
  const opacity = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  const translateX = useRef(new Animated.Value(reduce ? 0 : 16)).current;

  useEffect(() => {
    if (reduce) return;
    opacity.setValue(0);
    translateX.setValue(16);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 280, useNativeDriver: true }),
      Animated.timing(translateX, { toValue: 0, duration: 280, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
    ]).start();
  }, [stepKey, opacity, reduce, translateX]);

  if (MotiView && !reduce) {
    return (
      <MotiView
        key={String(stepKey)}
        from={{ opacity: 0, translateX: 16 }}
        animate={{ opacity: 1, translateX: 0 }}
        transition={{ type: 'timing', duration: 280 }}
      >
        {children}
      </MotiView>
    );
  }

  return (
    <Animated.View style={{ opacity, transform: [{ translateX }] }}>
      {children}
    </Animated.View>
  );
}