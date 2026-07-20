import React, { useCallback, useMemo } from 'react';
import { View, type ViewStyle } from 'react-native';
import { FlashList, type FlashListProps, type ListRenderItemInfo } from '@shopify/flash-list';
import { chunkForGrid } from '@shc/utils';
import { shcSpacing } from '@shc/ui';

type VirtualDishGridProps<T extends { id: string }> = {
  data: T[];
  numColumns?: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  ListHeaderComponent?: FlashListProps<T>['ListHeaderComponent'];
  ListFooterComponent?: FlashListProps<T>['ListFooterComponent'];
  ListEmptyComponent?: FlashListProps<T>['ListEmptyComponent'];
  refreshControl?: FlashListProps<T>['refreshControl'];
  contentContainerStyle?: ViewStyle;
  testID?: string;
  scrollEnabled?: boolean;
};

/** FlashList 2-column dish grid — matches discover home, search, category at scale. */
export function VirtualDishGridFlashList<T extends { id: string }>({
  data,
  numColumns = 2,
  renderItem,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  refreshControl,
  contentContainerStyle,
  testID = 'dish-list-container',
  scrollEnabled = true,
}: VirtualDishGridProps<T>) {
  const keyExtractor = useCallback((item: T) => item.id, []);

  return (
    <FlashList
      data={data}
      renderItem={({ item, index }: ListRenderItemInfo<T>) => (
        <View style={{ flex: 1, paddingBottom: shcSpacing.md }}>{renderItem(item, index)}</View>
      )}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      refreshControl={refreshControl}
      contentContainerStyle={contentContainerStyle}
      testID={testID}
      scrollEnabled={scrollEnabled}
    />
  );
}

type VirtualRowFlashListProps<T> = {
  data: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  keyExtractor: (item: T, index: number) => string;
  ListHeaderComponent?: FlashListProps<T>['ListHeaderComponent'];
  ListFooterComponent?: FlashListProps<T>['ListFooterComponent'];
  ListEmptyComponent?: FlashListProps<T>['ListEmptyComponent'];
  contentContainerStyle?: ViewStyle;
  testID?: string;
  scrollEnabled?: boolean;
};

/** FlashList vertical rows — kitchens, tiffin browse, menu items. */
export function VirtualRowFlashList<T>({
  data,
  renderItem,
  keyExtractor,
  ListHeaderComponent,
  ListFooterComponent,
  ListEmptyComponent,
  contentContainerStyle,
  testID = 'virtual-row-list',
  scrollEnabled = true,
}: VirtualRowFlashListProps<T>) {
  const render = useCallback(
    ({ item, index }: ListRenderItemInfo<T>) => <>{renderItem(item, index)}</>,
    [renderItem]
  );

  return (
    <FlashList
      data={data}
      renderItem={render}
      keyExtractor={keyExtractor}
      ListHeaderComponent={ListHeaderComponent}
      ListFooterComponent={ListFooterComponent}
      ListEmptyComponent={ListEmptyComponent}
      contentContainerStyle={contentContainerStyle}
      testID={testID}
      scrollEnabled={scrollEnabled}
    />
  );
}

/** Pair items for manual 2-col layout when FlashList numColumns is awkward inside ScrollView. */
export function useDishGridRows<T>(items: T[], columns = 2): T[][] {
  return useMemo(() => chunkForGrid(items, columns), [items, columns]);
}
