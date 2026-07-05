// Family Values tray system — React Native bottom sheet overlay.
// @ts-nocheck
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  AccessibilityInfo,
  Platform,
} from 'react-native';
import {
  type TrayFrame,
  type TrayHeight,
  TRAY_HEIGHT_PX,
  pushTray,
  popTray,
  dismissTray,
  currentTray,
  shouldReduceMotion,
} from './family-values-core';
import { gourmeatColors, shcBorders, shcRadii, shcShadows, shcSpacing } from './theme';
import { SHCIcon } from './icons';

export type TrayContentInput = React.ReactNode | (() => React.ReactNode);

type TrayContextValue = {
  stack: TrayFrame[];
  openTray: (frame: TrayFrame, content: TrayContentInput) => void;
  pushTrayContent: (frame: TrayFrame, content: TrayContentInput) => void;
  popTray: () => void;
  dismiss: () => void;
  contentMap: Record<string, () => React.ReactNode>;
};

const TrayContext = createContext<TrayContextValue | null>(null);

export function useSHCTray(): TrayContextValue {
  const ctx = useContext(TrayContext);
  if (!ctx) throw new Error('useSHCTray must be used within SHCTrayProvider');
  return ctx;
}

export function SHCTrayProvider({ children }: { children: React.ReactNode }) {
  const [stack, setStack] = useState<TrayFrame[]>([]);
  const [contentMap, setContentMap] = useState<Record<string, () => React.ReactNode>>({});
  const [reduceMotion, setReduceMotion] = useState(false);

  React.useEffect(() => {
    if (Platform.OS === 'web') return;
    AccessibilityInfo.isReduceMotionEnabled?.().then(setReduceMotion).catch(() => {});
  }, []);

  const wrapTrayContent = useCallback((content: TrayContentInput): (() => React.ReactNode) => {
    if (typeof content === 'function') return content;
    return () => content;
  }, []);

  const openTray = useCallback(
    (frame: TrayFrame, content: TrayContentInput) => {
      setContentMap((m) => ({ ...m, [frame.id]: wrapTrayContent(content) }));
      setStack([frame]);
    },
    [wrapTrayContent]
  );

  const pushTrayContent = useCallback(
    (frame: TrayFrame, content: TrayContentInput) => {
      setContentMap((m) => ({ ...m, [frame.id]: wrapTrayContent(content) }));
      setStack((s) => pushTray(s, frame));
    },
    [wrapTrayContent]
  );

  const pop = useCallback(() => setStack((s) => popTray(s)), []);
  const dismiss = useCallback(() => {
    setStack([]);
    setContentMap({});
  }, []);

  const value = useMemo(
    () => ({ stack, openTray, pushTrayContent, popTray: pop, dismiss, contentMap }),
    [stack, openTray, pushTrayContent, pop, dismiss, contentMap]
  );

  return (
    <TrayContext.Provider value={value}>
      {children}
      <SHCTrayOverlay reduceMotion={reduceMotion} />
    </TrayContext.Provider>
  );
}

function trayHeightPx(height: TrayHeight, maxH: number): number {
  return Math.min(TRAY_HEIGHT_PX[height], maxH * 0.92);
}

function SHCTrayOverlay({ reduceMotion }: { reduceMotion: boolean }) {
  const { stack, popTray: pop, dismiss, contentMap } = useSHCTray();
  const frame = currentTray(stack);
  const { height: winH } = useWindowDimensions();
  const visible = !!frame;
  const noMotion = reduceMotion || shouldReduceMotion();

  if (!visible || !frame) return null;

  const trayH = trayHeightPx(frame.height, winH);
  const depth = stack.length;
  const renderContent = contentMap[frame.id];
  const content = renderContent?.();

  return (
    <Modal visible transparent animationType={noMotion ? 'none' : 'fade'} onRequestClose={depth > 1 ? pop : dismiss}>
      <Pressable style={styles.backdrop} onPress={dismiss} accessibilityLabel="Dismiss tray" testID="shc-tray-backdrop">
        <Pressable
          style={[styles.sheet, { height: trayH, paddingBottom: shcSpacing.lg }]}
          onPress={(e) => e.stopPropagation?.()}
          testID={`shc-tray-${frame.id}`}
        >
          <View style={styles.handle} />
          <View style={styles.header}>
            <Pressable
              onPress={depth > 1 ? pop : dismiss}
              hitSlop={12}
              accessibilityLabel={depth > 1 ? 'Back' : 'Close'}
              testID="shc-tray-nav"
            >
              <SHCIcon name={depth > 1 ? 'chevron-back' : 'close'} size={22} color={gourmeatColors.text} />
            </Pressable>
            <Text style={styles.title} numberOfLines={1}>
              {frame.title}
            </Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.body}>{content}</View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

/** Single-action tray content helper */
export function SHCTrayAction({
  message,
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  destructive,
  testID = 'shc-tray-action',
}: {
  message: string;
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel?: string;
  onSecondary?: () => void;
  destructive?: boolean;
  testID?: string;
}) {
  return (
    <View style={styles.actionWrap} testID={testID}>
      <Text style={styles.actionMessage}>{message}</Text>
      <Pressable
        style={[styles.actionBtn, destructive && styles.actionDestructive]}
        onPress={onPrimary}
        testID={`${testID}-primary`}
      >
        <Text style={[styles.actionBtnText, destructive && styles.actionDestructiveText]}>{primaryLabel}</Text>
      </Pressable>
      {secondaryLabel && onSecondary ? (
        <Pressable style={styles.actionSecondary} onPress={onSecondary} testID={`${testID}-secondary`}>
          <Text style={styles.actionSecondaryText}>{secondaryLabel}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: gourmeatColors.surface,
    borderTopLeftRadius: shcRadii.lg,
    borderTopRightRadius: shcRadii.lg,
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.text,
    borderBottomWidth: 0,
    ...shcShadows.brutal,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: gourmeatColors.textMuted,
    marginTop: shcSpacing.sm,
    marginBottom: shcSpacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: shcSpacing.md,
    paddingBottom: shcSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: gourmeatColors.border,
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: '800',
    color: gourmeatColors.text,
  },
  body: {
    flex: 1,
    paddingHorizontal: shcSpacing.md,
    paddingTop: shcSpacing.md,
  },
  actionWrap: { gap: shcSpacing.md },
  actionMessage: { fontSize: 15, fontWeight: '500', color: gourmeatColors.text, lineHeight: 22 },
  actionBtn: {
    backgroundColor: gourmeatColors.primary,
    paddingVertical: shcSpacing.md,
    borderRadius: shcRadii.md,
    alignItems: 'center',
    borderWidth: shcBorders.brutal,
    borderColor: gourmeatColors.text,
  },
  actionDestructive: { backgroundColor: '#FEE2E2' },
  actionBtnText: { fontWeight: '800', fontSize: 15, color: '#FFF' },
  actionDestructiveText: { color: '#B91C1C' },
  actionSecondary: { alignItems: 'center', paddingVertical: shcSpacing.sm },
  actionSecondaryText: { fontWeight: '600', color: gourmeatColors.textMuted },
});

export type { TrayFrame, TrayHeight };