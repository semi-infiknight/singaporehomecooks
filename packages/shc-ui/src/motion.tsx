// Motion primitives — static fallbacks (Reanimated/Moti break when @shc/ui loads from monorepo).
// @ts-nocheck
import React from 'react';
import { View } from 'react-native';

export function SHCFadeIn({
  children,
  testID,
}: {
  children: React.ReactNode;
  delay?: number;
  fromY?: number;
  testID?: string;
}) {
  return <View testID={testID}>{children}</View>;
}

export function SHCStaggerIn({
  children,
}: {
  children: React.ReactNode;
  index?: number;
  fromY?: number;
}) {
  return <>{children}</>;
}

export function SHCWizardPane({
  children,
}: {
  stepKey: string | number;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}