'use client';

import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useWindowVirtualizer } from '@tanstack/react-virtual';
import {
  chunkForGrid,
  VIRTUAL_DEFAULT_OVERSCAN,
  VIRTUAL_DISH_LIST_ROW_HEIGHT,
  VIRTUAL_DISH_ROW_HEIGHT,
  VIRTUAL_KITCHEN_ROW_HEIGHT,
} from '@shc/utils';
import { GourmeatDishCard, type DishCardProduct } from './SHCWebComponents';
import { ContainedVirtualRowList } from './ContainedVirtualList';

function useScrollMargin(ref: React.RefObject<HTMLElement | null>) {
  const [scrollMargin, setScrollMargin] = useState(0);

  useLayoutEffect(() => {
    const measure = () => {
      if (!ref.current) return;
      setScrollMargin(ref.current.offsetTop);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [ref]);

  return scrollMargin;
}

type DishGridProps = {
  products: DishCardProduct[];
  columns?: number;
  isFavorite?: (id: string) => boolean;
  isPopular?: (product: DishCardProduct) => boolean;
  onFavoritePress?: (product: DishCardProduct) => void;
  onAddPress?: (id: string) => void;
  testID?: string;
  rowHeight?: number;
};

/** Window-scroll dish grid — prod-safe for 100+ dishes on discover/search/category. */
export function VirtualDishGrid({
  products,
  columns = 2,
  isFavorite,
  isPopular,
  onFavoritePress,
  onAddPress,
  testID = 'dish-list-container',
  rowHeight = VIRTUAL_DISH_ROW_HEIGHT,
}: DishGridProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollMargin = useScrollMargin(anchorRef);
  const rows = useMemo(() => chunkForGrid(products, columns), [products, columns]);

  const virtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => rowHeight,
    overscan: VIRTUAL_DEFAULT_OVERSCAN,
    scrollMargin,
  });

  if (products.length === 0) return null;

  const gridClass =
    columns >= 3 ? 'grid grid-cols-2 sm:grid-cols-3 gap-3' : 'grid grid-cols-2 gap-3';

  return (
    <div ref={anchorRef} data-testid={testID}>
      <div
        style={{
          height: virtualizer.getTotalSize(),
          width: '100%',
          position: 'relative',
        }}
      >
        {virtualizer.getVirtualItems().map((vi) => {
          const row = rows[vi.index] ?? [];
          return (
            <div
              key={vi.key}
              data-index={vi.index}
              ref={virtualizer.measureElement}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transform: `translateY(${vi.start - scrollMargin}px)`,
              }}
            >
              <div className={gridClass}>
                {row.map((p) => (
                  <GourmeatDishCard
                    key={p.id}
                    product={p}
                    isFavorite={isFavorite?.(p.id)}
                    showPopular={isPopular?.(p)}
                    onFavoritePress={onFavoritePress ? () => onFavoritePress(p) : undefined}
                    onAddPress={onAddPress ? () => onAddPress(p.id) : undefined}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

type VirtualRowListProps<T> = {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  getKey: (item: T, index: number) => string;
  testID?: string;
  rowHeight?: number;
  className?: string;
};

/** Window-scroll vertical list for kitchens, tiffin rows, cook portal listings. */
export function VirtualRowList<T>({
  items,
  renderItem,
  getKey,
  testID = 'virtual-row-list',
  rowHeight = VIRTUAL_KITCHEN_ROW_HEIGHT,
  className,
}: VirtualRowListProps<T>) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const scrollMargin = useScrollMargin(anchorRef);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => rowHeight,
    overscan: VIRTUAL_DEFAULT_OVERSCAN,
    scrollMargin,
  });

  if (items.length === 0) return null;

  return (
    <div ref={anchorRef} data-testid={testID} className={className}>
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
                transform: `translateY(${vi.start - scrollMargin}px)`,
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

type SearchRowProps = {
  dishes: DishCardProduct[];
  onDishPress?: (id: string) => void;
  onAddPress?: (id: string) => void;
  testID?: string;
};

/** Compact virtual list for search overlay results. */
export function VirtualSearchDishList({
  dishes,
  onDishPress,
  onAddPress,
  testID = 'virtual-search-dish-list',
  maxHeightClassName,
}: SearchRowProps & { maxHeightClassName?: string }) {
  return (
    <ContainedVirtualRowList
      items={dishes}
      getKey={(d) => d.id}
      testID={testID}
      rowHeight={VIRTUAL_DISH_LIST_ROW_HEIGHT}
      maxHeightClassName={maxHeightClassName ?? 'max-h-72 overflow-y-auto'}
      renderItem={(d) => (
        <button
          type="button"
          onClick={() => onDishPress?.(d.id)}
          className="w-full flex items-center gap-3 p-3 rounded-xl border-2 border-[var(--shc-border-brutal)] bg-card mb-2 text-left hover:bg-muted/40"
          data-testid={`search-result-${d.id}`}
        >
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm truncate">{d.name}</p>
            <p className="text-xs text-muted-foreground truncate">{d.cook_name}</p>
          </div>
          {onAddPress ? (
            <span
              role="button"
              tabIndex={0}
              className="shrink-0 text-xs font-black text-primary px-2 py-1"
              onClick={(e) => {
                e.stopPropagation();
                onAddPress(d.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.stopPropagation();
                  onAddPress(d.id);
                }
              }}
            >
              ADD
            </span>
          ) : null}
        </button>
      )}
    />
  );
}
