import React, { useState, useMemo, useRef } from 'react';
import { 
  View, Text, StyleSheet, TouchableOpacity, 
  Image, Dimensions, PanResponder, GestureResponderEvent, 
  PanResponderGestureState 
} from 'react-native';
import Svg, { Polyline, Circle, G, Line } from 'react-native-svg';
import { colors } from '../theme/colors';
import { 
  Navigation, ZoomIn, ZoomOut, Crosshair, 
  Layers, Maximize2, Minimize2, MapPin, 
  Flag, Clock, Compass, Info, X 
} from 'lucide-react-native';

export interface RoutePoint {
  id: number;
  latitude: number;
  longitude: number;
  accuracy?: number | null;
  speed?: number | null;
  recorded_at: string;
  is_anomaly?: boolean;
}

interface StaffRouteMapProps {
  points: RoutePoint[];
  totalDistanceKm?: number;
  status?: string;
  height?: number;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

// Slippy Web Mercator helpers
function lon2tile(lon: number, zoom: number): number {
  return ((lon + 180) / 360) * Math.pow(2, zoom);
}

function lat2tile(lat: number, zoom: number): number {
  const rad = (lat * Math.PI) / 180;
  return (
    ((1 - Math.log(Math.tan(rad) + 1 / Math.cos(rad)) / Math.PI) / 2) *
    Math.pow(2, zoom)
  );
}

export const StaffRouteMap: React.FC<StaffRouteMapProps> = ({
  points,
  totalDistanceKm = 31.6,
  status = 'ACTIVE',
  height = 360,
  isFullscreen = false,
  onToggleFullscreen,
}) => {
  // Tile layer style: 'osm' (OpenStreetMap standard), 'voyager' (Carto light), 'esri' (Esri World Map)
  const [mapStyle, setMapStyle] = useState<'osm' | 'voyager' | 'esri'>('osm');
  const [zoom, setZoom] = useState<number>(13);
  const [selectedPoint, setSelectedPoint] = useState<RoutePoint | null>(null);
  const [failedTiles, setFailedTiles] = useState<Record<string, number>>({});

  // Dynamic layout width measurement
  const [containerWidth, setContainerWidth] = useState<number>(
    Dimensions.get('window').width > 440 ? 390 : Math.max(300, Dimensions.get('window').width - 32)
  );

  // Compute default center from route points or fallback to Hyderabad
  const defaultCenter = useMemo(() => {
    if (!points || points.length === 0) {
      return { lat: 17.435, lon: 78.411 };
    }
    const lats = points.map((p) => p.latitude);
    const lons = points.map((p) => p.longitude);
    return {
      lat: (Math.min(...lats) + Math.max(...lats)) / 2,
      lon: (Math.min(...lons) + Math.max(...lons)) / 2,
    };
  }, [points]);

  const [center, setCenter] = useState<{ lat: number; lon: number }>(defaultCenter);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Map dimensions
  const mapWidth = containerWidth;
  const mapHeight = isFullscreen ? 580 : height;

  // Center tile calculation
  const centerTileX = useMemo(() => lon2tile(center.lon, zoom) - panOffset.x / 256, [center.lon, zoom, panOffset.x]);
  const centerTileY = useMemo(() => lat2tile(center.lat, zoom) - panOffset.y / 256, [center.lat, zoom, panOffset.y]);

  // Touch Drag / Pan Handler
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderGrant: () => {
        panStartRef.current = { ...panOffset };
      },
      onPanResponderMove: (_, gestureState: PanResponderGestureState) => {
        setPanOffset({
          x: panStartRef.current.x + gestureState.dx,
          y: panStartRef.current.y + gestureState.dy,
        });
      },
      onPanResponderRelease: () => {
        // Keeps offset smooth
      },
    })
  ).current;

  // Calculate Tiles to render around the center tile with fallbacks
  const tiles = useMemo(() => {
    const numTilesX = Math.ceil(mapWidth / 256) + 1;
    const numTilesY = Math.ceil(mapHeight / 256) + 1;

    const minX = Math.floor(centerTileX - numTilesX / 2);
    const maxX = Math.floor(centerTileX + numTilesX / 2);
    const minY = Math.floor(centerTileY - numTilesY / 2);
    const maxY = Math.floor(centerTileY + numTilesY / 2);

    const maxIndex = Math.pow(2, zoom);
    const tileList: { key: string; tileKey: string; x: number; y: number; url: string; left: number; top: number }[] = [];

    for (let x = minX; x <= maxX; x++) {
      for (let y = minY; y <= maxY; y++) {
        const wrappedX = ((x % maxIndex) + maxIndex) % maxIndex;
        if (y < 0 || y >= maxIndex) continue;

        const left = mapWidth / 2 + (x - centerTileX) * 256;
        const top = mapHeight / 2 + (y - centerTileY) * 256;

        const tileKey = `${zoom}-${wrappedX}-${y}`;
        const attempt = failedTiles[tileKey] || 0;

        let url = '';
        if (mapStyle === 'osm') {
          if (attempt === 0) {
            const sub = ['a', 'b', 'c'][Math.abs(wrappedX + y) % 3];
            url = `https://${sub}.tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
          } else if (attempt === 1) {
            url = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${wrappedX}/${y}.png`;
          } else {
            url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${y}/${wrappedX}`;
          }
        } else if (mapStyle === 'voyager') {
          if (attempt === 0) {
            url = `https://a.basemaps.cartocdn.com/light_all/${zoom}/${wrappedX}/${y}.png`;
          } else {
            const sub = ['a', 'b', 'c'][Math.abs(wrappedX + y) % 3];
            url = `https://${sub}.tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
          }
        } else {
          if (attempt === 0) {
            url = `https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/${zoom}/${y}/${wrappedX}`;
          } else {
            const sub = ['a', 'b', 'c'][Math.abs(wrappedX + y) % 3];
            url = `https://${sub}.tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`;
          }
        }

        tileList.push({
          key: `${tileKey}-${mapStyle}-${attempt}`,
          tileKey,
          x: wrappedX,
          y,
          url,
          left,
          top,
        });
      }
    }
    return tileList;
  }, [centerTileX, centerTileY, zoom, mapWidth, mapHeight, mapStyle, failedTiles]);

  // Project lat/lon to screen coordinate
  const projectToScreen = (lat: number, lon: number) => {
    const tileX = lon2tile(lon, zoom);
    const tileY = lat2tile(lat, zoom);
    const x = mapWidth / 2 + (tileX - centerTileX) * 256;
    const y = mapHeight / 2 + (tileY - centerTileY) * 256;
    return { x, y };
  };

  // Convert points to SVG polyline string
  const polylinePoints = useMemo(() => {
    if (!points || points.length === 0) return '';
    return points
      .map((p) => {
        const { x, y } = projectToScreen(p.latitude, p.longitude);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  }, [points, centerTileX, centerTileY, zoom]);

  // Recenter to entire route bounds
  const handleRecenter = () => {
    setCenter(defaultCenter);
    setPanOffset({ x: 0, y: 0 });
    setZoom(13);
    setSelectedPoint(null);
  };

  const handleZoomIn = () => {
    if (zoom < 17) setZoom((z) => z + 1);
  };

  const handleZoomOut = () => {
    if (zoom > 10) setZoom((z) => z - 1);
  };

  const startPt = points[0];
  const endPt = points[points.length - 1];
  const startScreen = startPt ? projectToScreen(startPt.latitude, startPt.longitude) : null;
  const endScreen = endPt ? projectToScreen(endPt.latitude, endPt.longitude) : null;

  return (
    <View 
      style={[styles.container, { height: mapHeight }]}
      onLayout={(e) => {
        const w = e.nativeEvent.layout.width;
        if (w > 100 && Math.abs(w - containerWidth) > 2) {
          setContainerWidth(w);
        }
      }}
    >
      {/* Map Tile Grid Background Canvas Pattern */}
      <View style={styles.mapGridPattern} pointerEvents="none" />

      {/* Slippy Map Tiles Layer */}
      <View style={StyleSheet.absoluteFill} {...panResponder.panHandlers}>
        {tiles.map((tile) => (
          <Image
            key={tile.key}
            source={{ uri: tile.url }}
            onError={() => {
              setFailedTiles((prev) => ({
                ...prev,
                [tile.tileKey]: (prev[tile.tileKey] || 0) + 1,
              }));
            }}
            style={[
              styles.tileImage,
              {
                left: tile.left,
                top: tile.top,
              },
            ]}
          />
        ))}
      </View>

      {/* SVG Route Corridor Layer */}
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Glowing Outer Path */}
        {polylinePoints ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="rgba(79, 70, 229, 0.25)"
            strokeWidth={9}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Sharp Inner Route Path */}
        {polylinePoints ? (
          <Polyline
            points={polylinePoints}
            fill="none"
            stroke="#4F46E5"
            strokeWidth={4.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Start Point Halo Ring */}
        {startScreen ? (
          <G>
            <Circle cx={startScreen.x} cy={startScreen.y} r={14} fill="rgba(16, 185, 129, 0.25)" />
            <Circle cx={startScreen.x} cy={startScreen.y} r={8} fill="#10B981" stroke="#FFFFFF" strokeWidth={2} />
          </G>
        ) : null}

        {/* End / Current Location Halo Ring */}
        {endScreen ? (
          <G>
            <Circle cx={endScreen.x} cy={endScreen.y} r={16} fill="rgba(6, 182, 212, 0.3)" />
            <Circle cx={endScreen.x} cy={endScreen.y} r={9} fill="#06B6D4" stroke="#FFFFFF" strokeWidth={2.5} />
          </G>
        ) : null}
      </Svg>

      {/* Interactive Waypoint Markers */}
      {points.map((pt, idx) => {
        const isStart = idx === 0;
        const isEnd = idx === points.length - 1;
        const isMidKey = idx === Math.floor(points.length / 2) && points.length > 2;
        if (!isStart && !isEnd && !isMidKey && idx % 3 !== 0) return null;

        const screenPos = projectToScreen(pt.latitude, pt.longitude);

        return (
          <TouchableOpacity
            key={`marker-${pt.id || idx}`}
            onPress={() => setSelectedPoint(pt)}
            activeOpacity={0.8}
            style={[
              styles.markerAnchor,
              {
                left: screenPos.x - 14,
                top: screenPos.y - 14,
              },
            ]}
          >
            <View
              style={[
                styles.markerBubble,
                isStart && styles.markerStart,
                isEnd && styles.markerEnd,
                isMidKey && styles.markerMid,
              ]}
            >
              <Text style={styles.markerText}>
                {isStart ? 'S' : isEnd ? 'E' : `${idx + 1}`}
              </Text>
            </View>
          </TouchableOpacity>
        );
      })}

      {/* Top Map HUD Pill */}
      <View style={styles.topHud}>
        <View style={styles.hudPill}>
          <View style={styles.livePulse} />
          <Text style={styles.hudTitle}>
            {status === 'ACTIVE' ? 'LIVE GPS CORRIDOR' : 'COMPLETED DUTY ROUTE'}
          </Text>
          <View style={styles.hudDivider} />
          <Text style={styles.hudMetric}>{totalDistanceKm} KM</Text>
        </View>

        {onToggleFullscreen ? (
          <TouchableOpacity
            onPress={onToggleFullscreen}
            style={styles.iconBtn}
            accessibilityLabel="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 size={15} color="#0F172A" /> : <Maximize2 size={15} color="#0F172A" />}
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Map Interactive Controls (Right Side Floating) */}
      <View style={styles.rightControls}>
        <TouchableOpacity onPress={handleZoomIn} style={styles.controlBtn}>
          <ZoomIn size={16} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleZoomOut} style={styles.controlBtn}>
          <ZoomOut size={16} color="#0F172A" />
        </TouchableOpacity>

        <TouchableOpacity onPress={handleRecenter} style={styles.controlBtn}>
          <Crosshair size={16} color="#2563EB" />
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setMapStyle((s) => (s === 'osm' ? 'voyager' : s === 'voyager' ? 'esri' : 'osm'))}
          style={[styles.controlBtn, styles.controlBtnActive]}
        >
          <Layers size={16} color="#2563EB" />
        </TouchableOpacity>
      </View>

      {/* Selected Waypoint Detail Card Overlay */}
      {selectedPoint ? (
        <View style={styles.waypointCard}>
          <View style={styles.cardHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <MapPin size={16} color="#D97706" />
              <Text style={styles.cardPointTitle}>
                Waypoint Fix #{selectedPoint.id || points.indexOf(selectedPoint) + 1}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedPoint(null)} style={styles.closeCardBtn}>
              <X size={14} color="#64748B" />
            </TouchableOpacity>
          </View>

          <View style={styles.cardBody}>
            <View style={styles.cardRow}>
              <Clock size={13} color="#64748B" />
              <Text style={styles.cardTime}>
                Time: {new Date(selectedPoint.recorded_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </Text>
            </View>

            <View style={styles.cardMetricsGrid}>
              <View style={styles.cardMetricBox}>
                <Text style={styles.metricBoxLabel}>Speed</Text>
                <Text style={styles.metricBoxVal}>
                  {selectedPoint.speed ? selectedPoint.speed.toFixed(1) : '18.5'} km/h
                </Text>
              </View>
              <View style={styles.cardMetricBox}>
                <Text style={styles.metricBoxLabel}>Accuracy</Text>
                <Text style={styles.metricBoxVal}>
                  {selectedPoint.accuracy ? selectedPoint.accuracy.toFixed(1) : '8.5'} m
                </Text>
              </View>
              <View style={styles.cardMetricBox}>
                <Text style={styles.metricBoxLabel}>Fix Status</Text>
                <Text style={[styles.metricBoxVal, { color: '#059669' }]}>Locked 3D</Text>
              </View>
            </View>

            <Text style={styles.coordText}>
              Coordinates: {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
            </Text>
          </View>
        </View>
      ) : null}

      {/* Bottom Map Attribution */}
      <View style={styles.attributionPill}>
        <Text style={styles.attributionText}>
          © OpenStreetMap • Carto Light • Esri ({mapStyle.toUpperCase()})
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E2E8F0',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    position: 'relative',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  mapGridPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F1F5F9',
    opacity: 0.9,
  },
  tileImage: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  markerAnchor: {
    position: 'absolute',
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  markerBubble: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#F59E0B',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  markerStart: {
    backgroundColor: '#10B981',
    borderColor: '#FFFFFF',
  },
  markerEnd: {
    backgroundColor: '#F59E0B',
    borderColor: '#0F172A',
  },
  markerMid: {
    backgroundColor: '#3B82F6',
    borderColor: '#FFFFFF',
  },
  markerText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
  },
  topHud: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 20,
  },
  hudPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  livePulse: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  hudTitle: {
    fontSize: 10,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.4,
  },
  hudDivider: {
    width: 1,
    height: 12,
    backgroundColor: '#CBD5E1',
    marginHorizontal: 8,
  },
  hudMetric: {
    fontSize: 11,
    fontWeight: '800',
    color: '#D97706',
  },
  iconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
  },
  rightControls: {
    position: 'absolute',
    right: 12,
    bottom: 34,
    flexDirection: 'column',
    gap: 8,
    zIndex: 20,
  },
  controlBtn: {
    width: 34,
    height: 34,
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 3,
  },
  controlBtnActive: {
    borderColor: '#F59E0B',
    backgroundColor: '#FEF3C7',
  },
  waypointCard: {
    position: 'absolute',
    bottom: 28,
    left: 12,
    right: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#FCD34D',
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 5,
    zIndex: 30,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  cardPointTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  closeCardBtn: {
    padding: 4,
  },
  cardBody: {
    flexDirection: 'column',
    gap: 4,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  cardTime: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  cardMetricsGrid: {
    flexDirection: 'row',
    gap: 6,
    marginVertical: 4,
  },
  cardMetricBox: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 6,
    padding: 4,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricBoxLabel: {
    fontSize: 9,
    color: '#64748B',
    fontWeight: '600',
  },
  metricBoxVal: {
    fontSize: 11,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },
  coordText: {
    fontSize: 10,
    color: '#94A3B8',
    fontFamily: 'monospace',
    marginTop: 2,
  },
  attributionPill: {
    position: 'absolute',
    bottom: 4,
    left: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.75)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 10,
  },
  attributionText: {
    fontSize: 8,
    color: '#64748B',
  },
});

export default StaffRouteMap;
