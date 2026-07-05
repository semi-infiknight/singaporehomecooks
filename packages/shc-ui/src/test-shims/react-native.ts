import React from 'react';

const mapProps = (props: Record<string, unknown>) => {
  const { testID, onPress, onChangeText, children, style, ...rest } = props;
  const resolvedStyle =
    typeof style === 'function' ? (style as (s: { pressed: boolean }) => object)({ pressed: false }) : style;
  return {
    ...rest,
    'data-testid': testID,
    onClick: onPress,
    onChange: onChangeText
      ? (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
          (onChangeText as (v: string) => void)(e.target.value)
      : undefined,
    style: resolvedStyle,
    children,
  };
};

export const Modal = ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) =>
  visible ? React.createElement('div', { 'data-testid': 'rn-modal' }, children) : null;
export const View = ({ children, ...props }: { children?: React.ReactNode }) =>
  React.createElement('div', mapProps(props), children);
export const Text = ({ children, ...props }: { children?: React.ReactNode }) =>
  React.createElement('span', mapProps(props), children);
export const TextInput = (props: Record<string, unknown>) => React.createElement('textarea', mapProps(props));
export const Pressable = ({ children, ...props }: { children?: React.ReactNode }) =>
  React.createElement('div', { role: 'button', tabIndex: 0, ...mapProps(props) }, children);
export const ScrollView = ({ children, ...props }: { children?: React.ReactNode }) =>
  React.createElement('div', mapProps(props), children);
export const Image = (props: Record<string, unknown>) => React.createElement('img', mapProps(props));
export const StyleSheet = { create: <T extends Record<string, unknown>>(s: T) => s };
export const useWindowDimensions = () => ({ width: 390, height: 844 });
export const AccessibilityInfo = { isReduceMotionEnabled: () => Promise.resolve(false) };
export const Platform = { OS: 'ios' };
export const Animated = {
  View,
  Text,
  Image,
  Value: class {
    constructor(public _v = 0) {}
    setValue() {}
    interpolate() {
      return 0;
    }
  },
  timing: () => ({ start: (cb?: () => void) => cb?.() }),
  spring: () => ({ start: (cb?: () => void) => cb?.() }),
};
export const Easing = { out: () => {}, in: () => {}, ease: () => {} };