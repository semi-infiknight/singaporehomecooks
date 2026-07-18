// Orders tab live cue — mint neo-brutalist cooking animation when a meal is being prepared.
// @ts-nocheck
import React, { useEffect, useRef } from 'react';
import { View, Animated, Easing, AccessibilityInfo } from 'react-native';
import { SHCIcon, type SHCTabIconKey } from './icons';
import { gourmeatColors, shcColors } from './theme';

function useSteamLoop(values: Animated.Value[], reduce: boolean) {
  useEffect(() => {
    if (reduce) return;
    const loops = values.map((v, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(v, {
            toValue: 1,
            duration: 900,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(v, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      )
    );
    loops.forEach((l) => l.start());
    return () => loops.forEach((l) => l.stop());
  }, [values, reduce]);
}

function SteamWisp({ progress, x }: { progress: Animated.Value; x: number }) {
  const translateY = progress.interpolate({ inputRange: [0, 1], outputRange: [0, -10] });
  const opacity = progress.interpolate({ inputRange: [0, 0.2, 0.85, 1], outputRange: [0, 0.85, 0.35, 0] });
  const scale = progress.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.1] });
  return (
    <Animated.View
      style={{
        position: 'absolute',
        top: -2,
        left: x,
        width: 4,
        height: 4,
        borderRadius: 2,
        backgroundColor: shcColors.success,
        opacity,
        transform: [{ translateY }, { scale }],
      }}
    />
  );
}

export function SHCOrdersTabCookingIcon({
  iconKey,
  active = false,
  color,
  size = 22,
  testID = 'orders-tab-cooking',
}: {
  iconKey: SHCTabIconKey;
  active?: boolean;
  color?: string;
  size?: number;
  testID?: string;
}) {
  const iconColor = color ?? (active ? gourmeatColors.navActive : 'rgba(255,255,255,0.55)');
  const [reduce, setReduce] = React.useState(false);
  const steam0 = useRef(new Animated.Value(0)).current;
  const steam1 = useRef(new Animated.Value(0)).current;
  const steam2 = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduce);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduce);
    return () => sub.remove();
  }, []);

  useSteamLoop([steam0, steam1, steam2], reduce);

  useEffect(() => {
    if (reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse, reduce]);

  const scale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });

  return (
    <View
      testID={testID}
      style={{ width: size + 10, height: size + 14, alignItems: 'center', justifyContent: 'flex-end' }}
    >
      {!reduce ? (
        <>
          <SteamWisp progress={steam0} x={size * 0.15} />
          <SteamWisp progress={steam1} x={size * 0.42} />
          <SteamWisp progress={steam2} x={size * 0.68} />
        </>
      ) : null}
      <Animated.View
        style={{
          transform: reduce ? undefined : [{ scale }],
          backgroundColor: shcColors.bentoMint,
          borderRadius: 8,
          borderWidth: 1.5,
          borderColor: shcColors.border,
          paddingHorizontal: 3,
          paddingVertical: 2,
        }}
      >
        <SHCIcon name={iconKey} active={active} size={size} color={iconColor} />
      </Animated.View>
      <View
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: 7,
          height: 7,
          borderRadius: 4,
          backgroundColor: shcColors.success,
          borderWidth: 1.5,
          borderColor: gourmeatColors.nav,
        }}
      />
    </View>
  );
}
