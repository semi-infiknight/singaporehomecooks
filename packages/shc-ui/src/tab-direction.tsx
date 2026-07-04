// Directional tab navigation context — Family Values fluidity.
// @ts-nocheck
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { SHCDirectionalTabScene } from './family-values-ui';

type TabDirectionContextValue = {
  tabIndex: number;
  prevIndex: number;
  notifyTabChange: (routeKey: string) => void;
};

const TabDirectionContext = createContext<TabDirectionContextValue | null>(null);

export function TabDirectionProvider({
  children,
  routeOrder,
}: {
  children: React.ReactNode;
  routeOrder: string[];
}) {
  const [tabIndex, setTabIndex] = useState(0);
  const [prevIndex, setPrevIndex] = useState(0);

  const notifyTabChange = useCallback(
    (routeKey: string) => {
      const next = routeOrder.indexOf(routeKey);
      if (next < 0) return;
      setTabIndex((current) => {
        setPrevIndex(current);
        return next;
      });
    },
    [routeOrder]
  );

  const value = useMemo(
    () => ({ tabIndex, prevIndex, notifyTabChange }),
    [tabIndex, prevIndex, notifyTabChange]
  );

  return <TabDirectionContext.Provider value={value}>{children}</TabDirectionContext.Provider>;
}

export function useTabDirection(): TabDirectionContextValue {
  const ctx = useContext(TabDirectionContext);
  if (!ctx) {
    return {
      tabIndex: 0,
      prevIndex: 0,
      notifyTabChange: () => {},
    };
  }
  return ctx;
}

/** Wrap each main tab screen for directional slide transitions. */
export function DirectionalTabScreen({
  children,
  testID,
}: {
  children: React.ReactNode;
  testID?: string;
}) {
  const { tabIndex, prevIndex } = useTabDirection();
  return (
    <SHCDirectionalTabScene tabIndex={tabIndex} prevIndex={prevIndex} testID={testID}>
      {children}
    </SHCDirectionalTabScene>
  );
}