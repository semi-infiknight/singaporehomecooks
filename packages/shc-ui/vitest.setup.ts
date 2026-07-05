import '@testing-library/jest-dom/vitest';
import React from 'react';
import { vi } from 'vitest';

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
    StyleSheet: { create: <T extends Record<string, unknown>>(s: T) => s },
    useWindowDimensions: () => ({ width: 390, height: 844 }),
    AccessibilityInfo: { isReduceMotionEnabled: () => Promise.resolve(false) },
    Platform: { OS: 'ios' },
  };
});

