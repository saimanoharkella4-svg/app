import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import { RouteData } from '../services/api';
import { Navigation, Clock, Flag, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface RouteMapProps {
  routeData: RouteData | null;
  isLoading: boolean;
}

export const RouteMap: React.FC<RouteMapProps> = ({ routeData, isLoading }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const polylineRef = useRef<L.Polyline | null>(null);
  const markersRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [17.435, 78.41],
      zoom: 12,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;
    markersRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !routeData || !markersRef.current) return;

    markersRef.current.clearLayers();
    if (polylineRef.current) {
      polylineRef.current.remove();
      polylineRef.current = null;
    }

    if (!routeData.points || routeData.points.length === 0) return;

    const latLngs: L.LatLngTuple[] = routeData.points.map((p) => [p.latitude, p.longitude]);

    // Draw route polyline with gradient style
    const polyline = L.polyline(latLngs, {
      color: '#0EA5E9',
      weight: 5,
      opacity: 0.85,
      lineJoin: 'round'
    }).addTo(map);
    polylineRef.current = polyline;

    // Start Marker (Green Flag)
    const firstPoint = routeData.points[0];
    const startIcon = L.divIcon({
      className: 'start-marker',
      html: `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #10B981; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(16,185,129,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 14px; font-weight: 800;">
          S
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const startMarker = L.marker([firstPoint.latitude, firstPoint.longitude], { icon: startIcon });
    startMarker.bindPopup(`
      <div style="padding: 4px; color: #0F172A;">
        <div style="font-weight: 800; color: #059669; font-size: 13px;">🚩 Route Start Point</div>
        <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Time: ${new Date(firstPoint.recorded_at).toLocaleTimeString()}</div>
        <div style="font-size: 11px; color: #334155;">Coordinates: ${firstPoint.latitude.toFixed(4)}, ${firstPoint.longitude.toFixed(4)}</div>
      </div>
    `);
    markersRef.current.addLayer(startMarker);

    // End Marker (Red / Blue Pin)
    const lastPoint = routeData.points[routeData.points.length - 1];
    const endIcon = L.divIcon({
      className: 'end-marker',
      html: `
        <div style="width: 32px; height: 32px; border-radius: 50%; background: #EF4444; border: 3px solid #FFFFFF; box-shadow: 0 4px 12px rgba(239,68,68,0.5); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-size: 14px; font-weight: 800;">
          E
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });
    const endMarker = L.marker([lastPoint.latitude, lastPoint.longitude], { icon: endIcon });
    endMarker.bindPopup(`
      <div style="padding: 4px; color: #0F172A;">
        <div style="font-weight: 800; color: #DC2626; font-size: 13px;">🏁 ${routeData.status === 'COMPLETED' ? 'Route End Point' : 'Latest Known Position'}</div>
        <div style="font-size: 11px; color: #64748B; margin-top: 4px;">Time: ${new Date(lastPoint.recorded_at).toLocaleTimeString()}</div>
        <div style="font-size: 11px; color: #334155;">Coordinates: ${lastPoint.latitude.toFixed(4)}, ${lastPoint.longitude.toFixed(4)}</div>
        <div style="font-size: 11px; color: #D97706; font-weight: 800; margin-top: 2px;">Total Distance: ${routeData.total_distance_km} KM</div>
      </div>
    `);
    markersRef.current.addLayer(endMarker);

    // Intermediate Waypoint dots
    routeData.points.slice(1, -1).forEach((pt, idx) => {
      const isAnomaly = pt.is_anomaly;
      const dot = L.circleMarker([pt.latitude, pt.longitude], {
        radius: isAnomaly ? 6 : 4,
        fillColor: isAnomaly ? '#EF4444' : '#F59E0B',
        color: '#FFFFFF',
        weight: 1.5,
        opacity: 0.9,
        fillOpacity: 0.8
      });

      dot.bindPopup(`
        <div style="padding: 4px; font-size: 11px; color: #0F172A;">
          <div style="font-weight: 800; color: ${isAnomaly ? '#DC2626' : '#D97706'};">Waypoint #${idx + 2} ${isAnomaly ? '⚠ Anomaly' : ''}</div>
          <div style="color: #475569;">Time: ${new Date(pt.recorded_at).toLocaleTimeString()}</div>
          <div style="color: #475569;">Speed: ${pt.speed ? pt.speed.toFixed(1) + ' km/h' : '--'}</div>
          <div style="color: #475569;">Accuracy: ${pt.accuracy ? pt.accuracy.toFixed(1) + ' m' : '--'}</div>
          ${pt.battery_level ? `<div style="color: #475569;">Battery: ${pt.battery_level}%</div>` : ''}
          ${isAnomaly ? `<div style="color: #DC2626; font-weight: 700; margin-top: 4px;">Reason: ${pt.anomaly_reason}</div>` : ''}
        </div>
      `);
      markersRef.current!.addLayer(dot);
    });

    // Fit map to full route bounds
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });
  }, [routeData]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Map Element */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Floating Route Summary Card */}
      {routeData && (
        <div
          className="glass-panel"
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            width: 360,
            zIndex: 1000,
            padding: 18,
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(16px)',
            border: '1.5px solid #E2E8F0',
            boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
            borderRadius: 16
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#FEF3C7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Navigation size={18} color="#D97706" />
              </div>
              <div>
                <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{routeData.staff_name}</div>
                <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{routeData.employee_code} • {routeData.date}</div>
              </div>
            </div>
            <span className={`badge ${routeData.status === 'ACTIVE' ? 'badge-active' : 'badge-neutral'}`}>
              {routeData.status}
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, margin: '14px 0' }}>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Total Distance</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#D97706' }}>{routeData.total_distance_km} KM</div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', padding: 12, borderRadius: 10 }}>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600 }}>Recorded Points</div>
              <div style={{ fontSize: 20, fontWeight: 800, color: '#059669' }}>{routeData.points.length}</div>
            </div>
          </div>

          <div style={{ fontSize: 12, color: '#475569', display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Clock size={14} color="#64748B" />
              <span>Login: <b style={{ color: '#0F172A' }}>{new Date(routeData.login_time).toLocaleTimeString()}</b></span>
              {routeData.logout_time && <span>• Logout: <b style={{ color: '#0F172A' }}>{new Date(routeData.logout_time).toLocaleTimeString()}</b></span>}
            </div>
          </div>
        </div>
      )}

      {isLoading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            color: '#FFFFFF',
            fontWeight: 600
          }}
        >
          Loading route path...
        </div>
      )}
    </div>
  );
};
