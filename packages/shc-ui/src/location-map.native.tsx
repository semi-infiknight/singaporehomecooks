// Native draggable map — Apple Maps on iOS; OSM tile picker on Android (no Google API key required).
// @ts-nocheck
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Image, PanResponder, Pressable, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { dragOffsetToCoordinates, getOsmTileGrid, nudgeCoordinates } from '@shc/utils';
import { shcColors, shcBorders, shcRadii } from './theme';

const MAP_HEIGHT = 240;
const TILE_ROWS = 3;
const TILE_ZOOM = 17;

function regionFor(lat: number, lng: number) {
  return {
    latitude: lat,
    longitude: lng,
    latitudeDelta: 0.006,
    longitudeDelta: 0.006,
  };
}

function AndroidOsmPinMap({
  lat,
  lng,
  onPinChange,
  testID = 'location-map',
}: {
  lat: number;
  lng: number;
  onPinChange: (coords: { lat: number; lng: number }) => void;
  testID?: string;
}) {
  const tiles = useMemo(() => getOsmTileGrid(lat, lng, TILE_ZOOM), [lat, lng]);
  const tileHeight = MAP_HEIGHT / TILE_ROWS;
  const [frameSize, setFrameSize] = useState({ width: 360, height: MAP_HEIGHT });
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const dragStart = useRef({ lat, lng });

  useEffect(() => {
    dragStart.current = { lat, lng };
    setDrag({ x: 0, y: 0 });
  }, [lat, lng]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        dragStart.current = { lat, lng };
      },
      onPanResponderMove: (_, g) => {
        setDrag({ x: g.dx, y: g.dy });
      },
      onPanResponderRelease: (_, g) => {
        setDrag({ x: 0, y: 0 });
        if (Math.abs(g.dx) < 2 && Math.abs(g.dy) < 2) return;
        const next = dragOffsetToCoordinates(
          dragStart.current.lat,
          dragStart.current.lng,
          g.dx,
          g.dy,
          frameSize.width,
          frameSize.height,
          TILE_ZOOM,
        );
        onPinChange(next);
      },
      onPanResponderTerminate: () => setDrag({ x: 0, y: 0 }),
    }),
  ).current;

  const nudge = (dir: 'n' | 's' | 'e' | 'w') => {
    const next = nudgeCoordinates(lat, lng, dir);
    onPinChange({ lat: next.lat, lng: next.lng });
  };

  return (
    <View
      style={styles.frame}
      testID={testID}
      onLayout={(e) => {
        const { width, height } = e.nativeEvent.layout;
        if (width > 0 && height > 0) setFrameSize({ width, height });
      }}
    >
      <View style={styles.tileGrid}>
        {tiles.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: '33.333%', height: tileHeight }} resizeMode="cover" />
        ))}
      </View>
      <View
        style={[
          styles.pinOverlay,
          { transform: [{ translateX: drag.x }, { translateY: drag.y }] },
        ]}
        {...pan.panHandlers}
      >
        <View style={styles.pinHead} />
        <View style={styles.pinTail} />
      </View>
      <View style={styles.androidHint}>
        <Text style={styles.androidHintText}>Drag the pin · arrows to nudge</Text>
        <View style={styles.androidNudgeRow}>
          <Pressable onPress={() => nudge('w')} style={styles.nudgeBtn} testID="location-map-w">
            <Text style={styles.nudgeText}>←</Text>
          </Pressable>
          <Pressable onPress={() => nudge('n')} style={styles.nudgeBtn} testID="location-map-n">
            <Text style={styles.nudgeText}>↑</Text>
          </Pressable>
          <Pressable onPress={() => nudge('e')} style={styles.nudgeBtn} testID="location-map-e">
            <Text style={styles.nudgeText}>→</Text>
          </Pressable>
          <Pressable onPress={() => nudge('s')} style={styles.nudgeBtn} testID="location-map-s">
            <Text style={styles.nudgeText}>↓</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

function IosDraggableMap({
  lat,
  lng,
  onPinChange,
  testID = 'location-map',
}: {
  lat: number;
  lng: number;
  onPinChange: (coords: { lat: number; lng: number }) => void;
  testID?: string;
}) {
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    mapRef.current?.animateToRegion(regionFor(lat, lng), 220);
  }, [lat, lng]);

  return (
    <View style={styles.frame} testID={testID}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={regionFor(lat, lng)}
        onPress={(e) => {
          const { latitude, longitude } = e.nativeEvent.coordinate;
          onPinChange({ lat: latitude, lng: longitude });
        }}
        showsUserLocation={false}
        showsMyLocationButton={false}
        rotateEnabled={false}
        pitchEnabled={false}
      >
        <Marker
          coordinate={{ latitude: lat, longitude: lng }}
          draggable
          onDragEnd={(e) => {
            const { latitude, longitude } = e.nativeEvent.coordinate;
            onPinChange({ lat: latitude, lng: longitude });
          }}
          pinColor={shcColors.primary}
        />
      </MapView>
    </View>
  );
}

export function SHCLocationDraggableMap({
  lat,
  lng,
  onPinChange,
  testID = 'location-map',
}: {
  lat: number;
  lng: number;
  onPinChange: (coords: { lat: number; lng: number }) => void;
  testID?: string;
}) {
  if (Platform.OS === 'android') {
    return <AndroidOsmPinMap lat={lat} lng={lng} onPinChange={onPinChange} testID={testID} />;
  }
  return <IosDraggableMap lat={lat} lng={lng} onPinChange={onPinChange} testID={testID} />;
}

const styles = StyleSheet.create({
  frame: {
    height: MAP_HEIGHT,
    width: '100%',
    borderRadius: shcRadii.md,
    overflow: 'hidden',
    borderWidth: shcBorders.brutal,
    borderColor: shcColors.border,
    backgroundColor: '#e8e0d5',
    marginBottom: 8,
    position: 'relative',
  },
  map: {
    width: '100%',
    height: MAP_HEIGHT,
  },
  tileGrid: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', height: MAP_HEIGHT },
  pinOverlay: {
    position: 'absolute',
    top: '42%',
    left: '50%',
    marginLeft: -14,
    marginTop: -36,
    alignItems: 'center',
    zIndex: 2,
    padding: 12,
  },
  pinHead: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: shcColors.primary,
    borderWidth: 2,
    borderColor: '#fff',
  },
  pinTail: {
    width: 0,
    height: 0,
    borderLeftWidth: 7,
    borderRightWidth: 7,
    borderTopWidth: 11,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: shcColors.primary,
    marginTop: -2,
  },
  androidHint: {
    position: 'absolute',
    left: 8,
    right: 8,
    bottom: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: shcColors.border,
    paddingHorizontal: 8,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 6,
  },
  androidHintText: { fontSize: 10, fontWeight: '700', color: shcColors.text, flex: 1 },
  androidNudgeRow: { flexDirection: 'row', gap: 4 },
  nudgeBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: shcColors.border,
    backgroundColor: shcColors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nudgeText: { fontSize: 12, fontWeight: '800', color: shcColors.text },
});