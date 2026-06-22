// Web / non-native fallback — interactive map lives in location-map.native.tsx (react-native-maps).
// @ts-nocheck
import React, { useMemo } from 'react';
import { View, Image } from 'react-native';
import { getOsmTileGrid } from '@shc/utils';
import { shcColors, shcBorders, shcRadii } from './theme';

const MAP_TILE_ROWS = 3;
const MAP_PREVIEW_HEIGHT = 240;

export function SHCLocationDraggableMap({
  lat,
  lng,
  testID = 'location-map',
}: {
  lat: number;
  lng: number;
  onPinChange?: (coords: { lat: number; lng: number }) => void;
  testID?: string;
}) {
  const tiles = useMemo(() => getOsmTileGrid(lat, lng, 17), [lat, lng]);
  const tileHeight = MAP_PREVIEW_HEIGHT / MAP_TILE_ROWS;

  return (
    <View
      testID={testID}
      style={{
        height: MAP_PREVIEW_HEIGHT,
        width: '100%',
        borderRadius: shcRadii.md,
        overflow: 'hidden',
        borderWidth: shcBorders.brutal,
        borderColor: shcColors.border,
        backgroundColor: '#e8e0d5',
      }}
    >
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', width: '100%', height: MAP_PREVIEW_HEIGHT }}>
        {tiles.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: '33.333%', height: tileHeight }} resizeMode="cover" />
        ))}
      </View>
    </View>
  );
}