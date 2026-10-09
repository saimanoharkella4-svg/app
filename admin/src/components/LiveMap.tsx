import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { LiveStaffItem } from '../services/api';
import { Search, Compass, Battery, Gauge, Crosshair, Navigation, UserCheck } from 'lucide-react';

interface LiveMapProps {
  staffList: LiveStaffItem[];
  onSelectStaffRoute: (staffId: number) => void;
}

export const LiveMap: React.FC<LiveMapProps> = ({ staffList, onSelectStaffRoute }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ [key: number]: L.Marker }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterActiveOnly, setFilterActiveOnly] = useState(true);
  const [selectedStaff, setSelectedStaff] = useState<LiveStaffItem | null>(null);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center over Hyderabad
    const map = L.map(mapContainerRef.current, {
      center: [17.435, 78.41],
      zoom: 12,
      zoomControl: false
    });

    // OpenStreetMap tile layer (100% Free, No API Key Required)
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Markers when staffList changes - ONLY SHOW ACTIVE USERS
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    // Remove old markers not active or not in staff list
    Object.keys(markersRef.current).forEach((key) => {
      const id = Number(key);
      const staff = staffList.find((s) => s.staff_id === id);
      if (!staff || staff.status !== 'ACTIVE') {
        markersRef.current[id].remove();
        delete markersRef.current[id];
      }
    });

    const activeBounds: L.LatLngTuple[] = [];

    staffList.forEach((staff) => {
      // ONLY plot active duty users on the live radar map
      if (!staff.latitude || !staff.longitude || staff.status !== 'ACTIVE') return;

      const pinColor = '#10B981';
      const glowColor = 'rgba(16, 185, 129, 0.4)';

      // Custom HTML Marker
      const customIcon = L.divIcon({
        className: 'custom-staff-marker',
        html: `
          <div style="position: relative; width: 36px; height: 36px; display: flex; align-items: center; justify-content: center;">
            <div style="position: absolute; width: 36px; height: 36px; border-radius: 50%; background: ${glowColor}; animation: pulse-ring 2s infinite;"></div>
            <div style="width: 28px; height: 28px; border-radius: 50%; background: ${pinColor}; border: 2.5px solid #FFFFFF; box-shadow: 0 4px 10px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: #FFFFFF; font-weight: 800; font-size: 11px; z-index: 2;">
              ${staff.name.charAt(0)}
            </div>
            <div style="position: absolute; bottom: -8px; padding: 1px 5px; border-radius: 4px; background: rgba(15, 23, 42, 0.9); border: 1px solid rgba(255, 255, 255, 0.15); color: #FFFFFF; font-size: 9px; font-weight: 700; white-space: nowrap; pointer-events: none; z-index: 3;">
              ${staff.name.split(' ')[0]}
            </div>
          </div>
        `,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
        popupAnchor: [0, -20]
      });

      const popupContent = document.createElement('div');
      popupContent.style.minWidth = '220px';
      popupContent.style.padding = '8px 4px';
      popupContent.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: space-between; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 8px; margin-bottom: 8px;">
          <div>
            <div style="font-weight: 800; font-size: 15px; color: #0F172A;">${staff.name}</div>
            <div style="font-size: 11px; color: #64748B; font-weight: 500;">${staff.employee_code} • ${staff.role}</div>
          </div>
          <span style="font-size: 10px; font-weight: 700; padding: 2px 8px; border-radius: 12px; background: #ECFDF5; color: #059669; border: 1px solid #A7F3D0;">
            ACTIVE DUTY
          </span>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px; margin-bottom: 10px;">
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; border-radius: 8px;">
            <div style="color: #64748B; font-size: 10px; font-weight: 600;">Working Time</div>
            <div style="font-weight: 700; color: #0F172A; font-size: 12px;">${staff.working_duration || '--'}</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; border-radius: 8px;">
            <div style="color: #64748B; font-size: 10px; font-weight: 600;">Today's Dist</div>
            <div style="font-weight: 800; color: #D97706; font-size: 12px;">${staff.today_distance_km} KM</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; border-radius: 8px;">
            <div style="color: #64748B; font-size: 10px; font-weight: 600;">Accuracy</div>
            <div style="font-weight: 600; color: #334155;">${staff.accuracy ? staff.accuracy.toFixed(1) + ' m' : '--'}</div>
          </div>
          <div style="background: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px; border-radius: 8px;">
            <div style="color: #64748B; font-size: 10px; font-weight: 600;">Battery</div>
            <div style="font-weight: 600; color: #334155;">${staff.battery_level ? staff.battery_level + '%' : '--'}</div>
          </div>
        </div>

        <div style="font-size: 11px; color: #475569; margin-bottom: 10px; font-weight: 500;">
          📍 ${staff.current_area || 'Hyderabad'}
        </div>

        <button id="view-route-btn-${staff.staff_id}" style="width: 100%; background: linear-gradient(135deg, #F59E0B, #D97706); color: #0F172A; border: none; border-radius: 8px; padding: 8px; font-weight: 800; font-size: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 6px; box-shadow: 0 2px 8px rgba(245, 158, 11, 0.3);">
          View Today's Route →
        </button>
      `;

      if (markersRef.current[staff.staff_id]) {
        // Move existing marker smoothly
        const marker = markersRef.current[staff.staff_id];
        marker.setLatLng([staff.latitude, staff.longitude]);
        marker.setIcon(customIcon);
        marker.setPopupContent(popupContent);
      } else {
        // Create new marker
        const marker = L.marker([staff.latitude, staff.longitude], { icon: customIcon }).addTo(map);
        marker.bindPopup(popupContent);
        marker.on('popupopen', () => {
          setSelectedStaff(staff);
          setTimeout(() => {
            const btn = document.getElementById(`view-route-btn-${staff.staff_id}`);
            if (btn) {
              btn.onclick = () => onSelectStaffRoute(staff.staff_id);
            }
          }, 50);
        });
        markersRef.current[staff.staff_id] = marker;
      }

      activeBounds.push([staff.latitude, staff.longitude]);
    });
  }, [staffList]);

  // Filter staff list
  const filteredStaff = staffList.filter((s) => {
    const matchesSearch =
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.employee_code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesActive = filterActiveOnly ? s.status === 'ACTIVE' : true;
    return matchesSearch && matchesActive;
  });

  const handleFlyToStaff = (staff: LiveStaffItem) => {
    setSelectedStaff(staff);
    if (staff.latitude && staff.longitude && mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([staff.latitude, staff.longitude], 15, { duration: 1.2 });
      const marker = markersRef.current[staff.staff_id];
      if (marker) marker.openPopup();
    }
  };

  const handleFitAll = () => {
    if (!mapInstanceRef.current) return;
    const pts = staffList
      .filter((s) => s.status === 'ACTIVE' && s.latitude && s.longitude)
      .map((s) => [s.latitude!, s.longitude!] as L.LatLngTuple);
    if (pts.length > 0) {
      mapInstanceRef.current.fitBounds(L.latLngBounds(pts), { padding: [50, 50] });
    }
  };

  const clickTimeoutRef = useRef<{ [key: number]: any }>({});

  const handleCardClick = (staff: LiveStaffItem) => {
    if (clickTimeoutRef.current[staff.staff_id]) {
      clearTimeout(clickTimeoutRef.current[staff.staff_id]);
      clickTimeoutRef.current[staff.staff_id] = null;
    }
    clickTimeoutRef.current[staff.staff_id] = setTimeout(() => {
      handleFlyToStaff(staff);
    }, 220);
  };

  const handleCardDoubleClick = (staff: LiveStaffItem) => {
    if (clickTimeoutRef.current[staff.staff_id]) {
      clearTimeout(clickTimeoutRef.current[staff.staff_id]);
      clickTimeoutRef.current[staff.staff_id] = null;
    }
    onSelectStaffRoute(staff.staff_id);
  };

  return (
    <div style={{ position: 'relative', width: '100%', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
      {/* Map Container */}
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%', zIndex: 1 }} />

      {/* Side Overlay Panel for Staff List */}
      <div
        className="glass-panel"
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          width: 340,
          maxHeight: 'calc(100vh - 110px)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 1000,
          padding: 16,
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(16px)',
          border: '1.5px solid #E2E8F0',
          boxShadow: '0 10px 30px rgba(15, 23, 42, 0.12)',
          borderRadius: 16
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Compass size={18} color="#D97706" />
            <span style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>Active Staff Radar</span>
          </div>
          <button
            onClick={handleFitAll}
            className="btn-secondary"
            style={{ padding: '4px 8px', fontSize: 11 }}
            title="Fit active duty markers in view"
          >
            <Crosshair size={12} /> Fit Active
          </button>
        </div>

        {/* Search & Filter */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} color="#64748B" style={{ position: 'absolute', left: 10, top: 11 }} />
            <input
              type="text"
              placeholder="Search staff or EMP ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field"
              style={{ width: '100%', paddingLeft: 32, fontSize: 13, height: 38 }}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#475569', cursor: 'pointer', fontWeight: 600 }}>
            <input
              type="checkbox"
              checked={filterActiveOnly}
              onChange={(e) => setFilterActiveOnly(e.target.checked)}
              style={{ accentColor: '#10B981' }}
            />
            Show active duty staff only
          </label>
        </div>

        {/* Staff Items List */}
        <div style={{ overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: 8, paddingRight: 4 }}>
          {filteredStaff.map((staff) => {
            const isActive = staff.status === 'ACTIVE';
            const isSelected = selectedStaff?.staff_id === staff.staff_id;
            const hasCoords = staff.latitude && staff.longitude;

            return (
              <div
                key={staff.staff_id}
                onClick={() => handleCardClick(staff)}
                onDoubleClick={() => handleCardDoubleClick(staff)}
                title="Single-click to focus on map | Double-click to view Today's Route Map"
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  background: isSelected ? '#EEF2FF' : '#FFFFFF',
                  border: `1.5px solid ${isSelected ? '#4F46E5' : '#E2E8F0'}`,
                  boxShadow: isSelected ? '0 4px 12px rgba(79, 70, 229, 0.2)' : '0 1px 3px rgba(15, 23, 42, 0.04)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        background: isActive ? '#10B981' : '#94A3B8',
                        color: '#FFFFFF',
                        fontWeight: 800,
                        fontSize: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      {staff.name.charAt(0)}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{staff.name}</div>
                      <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>{staff.employee_code}</div>
                    </div>
                  </div>
                  <span className={`badge ${isActive ? 'badge-active' : 'badge-offline'}`}>
                    {staff.status}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3, marginTop: 6, fontSize: 11, color: '#64748B' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, color: '#334155' }}>📍 {staff.current_area || 'Hyderabad'}</span>
                    <span style={{ fontWeight: 800, color: '#D97706' }}>{staff.today_distance_km} KM</span>
                  </div>

                  {hasCoords && (
                    <div style={{ fontSize: 10, fontFamily: 'monospace', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                      <span>GPS: {staff.latitude?.toFixed(4)}, {staff.longitude?.toFixed(4)}</span>
                      <span style={{ color: '#4F46E5', fontWeight: 700 }}>DbClick for Route &rarr;</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
