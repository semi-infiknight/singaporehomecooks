// Moti motion primitives — Zomato-style fade/slide entrances.
// @ts-nocheck
import React from 'react';
import { AnimatePresence, MotiView } from 'moti';
import { shcMotion } from './theme';

export function SHCFadeIn({
  children,
  delay = 0,
  fromY = 10,
  testID,
}: {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  testID?: string;
}) {
  return (
    <MotiView
      testID={testID}
      from={{ opacity: 0, translateY: fromY }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: shcMotion.fadeInMs, delay }}
    >
      {children}
    </MotiView>
  );
}

export function SHCStaggerIn({
  children,
  index = 0,
  fromY = 12,
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
  return (
    <AnimatePresence exitBeforeEnter>
      <MotiView
        key={String(stepKey)}
        from={{ opacity: 0, translateX: 20 }}
        animate={{ opacity: 1, translateX: 0 }}
        exit={{ opacity: 0, translateX: -16 }}
        transition={{ type: 'spring', damping: shcMotion.springSelect.damping, stiffness: shcMotion.springSelect.stiffness }}
      >
        {children}
      </MotiView>
    </AnimatePresence>
  );
}

