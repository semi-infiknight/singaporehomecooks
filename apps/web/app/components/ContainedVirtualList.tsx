'use client';

import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { VIRTUAL_DEFAULT_OVERSCAN } from '@shc/utils';

type ContainedVirtualRowListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
  testID?: string;
  rowHeight?: number;
  className?: string;
  maxHeightClassName?: string;
};

/** Scroll-container virtual list — search dropdowns, panels with max-height. */
export function ContainedVirtualRowList<T>({
  items,
  renderItem,
  getKey,
  testID = 'contained-virtual-row-list',
  rowHeight = 88,
  className,
  maxHeightClassName = 'max-h-80 overflow-y-auto',
}: ContainedVirtualRowListProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: items.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: VIRTUAL_DEFAULT_OVERSCAN,
  });

  if (items.length === 0) return null;

  return (
    <div ref={parentRef} data-testid={testID} className={`${maxHeightClassName} ${className ?? ''}`.trim()}>
      <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
        {virtualizer.getVirtualItems().map((vi) => {
          const item = items[vi.index];
          if (item == null) return null;
          return (
            <div
              key={getKey(item, vi.index)}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start}px)`,
              }}
            >
              {renderItem(item, vi.index)}
            </div>
          );
        })}
      </div>
    </div>
  );
}
