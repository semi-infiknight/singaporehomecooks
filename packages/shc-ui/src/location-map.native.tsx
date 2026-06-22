// Native draggable map — Apple Maps on iOS; OSM tile picker on Android (no Google API key required).
// @ts-nocheck
import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, Platform, Image, PanResponder, Pressable, Text } from 'react-native';
import MapView, { Marker, UrlTile } from 'react-native-maps';
import { getOsmTileGrid, nudgeCoordinates } from '@shc/utils';
import { shcColors, shcBorders, shcRadii } from './theme';

const MAP_HEIGHT = 240;
const TILE_ROWS = 3;

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
  const tiles = useMemo(() => getOsmTileGrid(lat, lng, 17), [lat, lng]);
  const tileHeight = MAP_HEIGHT / TILE_ROWS;
  const start = useRef({ lat, lng });

  useEffect(() => {
    start.current = { lat, lng };
  }, [lat, lng]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        start.current = { lat, lng };
      },
      onPanResponderRelease: (_, g) => {
        const dx = g.dx;
        const dy = g.dy;
        if (Math.abs(dx) < 6 && Math.abs(dy) < 6) return;
        let nextLat = start.current.lat;
        let nextLng = start.current.lng;
        const step = 0.00012;
        if (dy < -8) nextLat += step;
        if (dy > 8) nextLat -= step;
        if (dx > 8) nextLng += step;
        if (dx < -8) nextLng -= step;
        onPinChange({ lat: nextLat, lng: nextLng });
      },
    })
  ).current;

  const nudge = (dir: 'n' | 's' | 'e' | 'w') => {
    const next = nudgeCoordinates(lat, lng, dir);
    onPinChange({ lat: next.lat, lng: next.lng });
  };

  return (
    <View style={styles.frame} testID={testID}>
      <View style={styles.tileGrid}>
        {tiles.map((uri, i) => (
          <Image key={`${uri}-${i}`} source={{ uri }} style={{ width: '33.333%', height: tileHeight }} resizeMode="cover" />
        ))}
      </View>
      <View style={styles.pinOverlay} {...pan.panHandlers}>
        <View style={styles.pinHead} />
        <View style={styles.pinTail} />
      </View>
      <View style={styles.androidHint}>
        <Text style={styles.androidHintText}>Drag pin · tap arrows to nudge</Text>
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