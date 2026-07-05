import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

vi.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  AntDesign: () => null,
  MaterialIcons: () => null,
  FontAwesome: () => null,
}));

vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    const { fill: _fill, priority: _priority, ...rest } = props;
    return React.createElement('img', rest);
  },
}));

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children?: React.ReactNode;
    href?: string;
  }) => React.createElement('a', { href, ...props }, children),
}));

vi.mock('lucide-react', () => {
  const Icon = () => null;
  return new Proxy(
    { default: Icon },
    { get: (_target, prop) => (prop === 'default' ? Icon : Icon) }
  );
});

vi.mock('react-native', () => {
  const React = require('react');
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
  return {
    Modal: ({ visible, children }: { visible?: boolean; children?: React.ReactNode }) =>
      visible ? React.createElement('div', { 'data-testid': 'rn-modal' }, children) : null,
    View: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('div', mapProps(props), children),
    Text: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('span', mapProps(props), children),
    TextInput: (props: Record<string, unknown>) => React.createElement('textarea', mapProps(props)),
    Pressable: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('div', { role: 'button', tabIndex: 0, ...mapProps(props) }, children),
    ScrollView: ({ children, ...props }: { children?: React.ReactNode }) =>
      React.createElement('div', mapProps(props), children),
    Image: (props: Record<string, unknown>) => React.createElement('img', mapProps(props)),
    Animated: {
      View: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement('div', mapProps(props), children),
      Text: ({ children, ...props }: { children?: React.ReactNode }) =>
        React.createElement('span', mapProps(props), children),
      Image: (props: Record<string, unknown>) => React.createElement('img', mapProps(props)),
      Value: class {
        constructor(public _v = 0) {}
        setValue() {}
        interpolate() {
          return 0;
        }
      },
      timing: () => ({ start: (cb?: () => void) => cb?.() }),
      spring: () => ({ start: (cb?: () => void) => cb?.() }),
    },
    Easing: { out: () => {}, in: () => {}, ease: () => {} },
    StyleSheet: { create: <T extends Record<string, unknown>>(s: T) => s },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false) },
    Platform: { OS: 'ios' },
  };
});

