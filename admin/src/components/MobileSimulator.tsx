import React, { useState, useEffect } from 'react';
import { 
  Smartphone, X, Wifi, WifiOff, MapPin, 
  Play, Square, RefreshCw, CheckCircle, 
  AlertCircle, ShieldCheck, Battery, Navigation, User,
  Zap, Scale, Briefcase, Star
} from 'lucide-react';

interface MobileSimulatorProps {
  isOpen: boolean;
  onClose: () => void;
  onLocationSent?: () => void;
}

export const MobileSimulator: React.FC<MobileSimulatorProps> = ({ isOpen, onClose, onLocationSent }) => {
  const [selectedStaffCode, setSelectedStaffCode] = useState('EMP101');
  const [token, setToken] = useState<string | null>(null);
  const [staffInfo, setStaffInfo] = useState<any>(null);
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [workingSeconds, setWorkingSeconds] = useState(0);
  const [distanceKm, setDistanceKm] = useState(31.6);
  const [isOnline, setIsOnline] = useState(true);
  const [offlineQueue, setOfflineQueue] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'home' | 'tracking' | 'profile'>('home');
  const [simLat, setSimLat] = useState(17.4350);
  const [simLon, setSimLon] = useState(78.4112);
  const [gpsAccuracy, setGpsAccuracy] = useState(8.5);
  const [batteryLevel, setBatteryLevel] = useState(88);
  const [statusMsg, setStatusMsg] = useState('');

  // Quick staff credentials
  const demoStaff = [
    { code: 'EMP101', name: 'Rahul Kumar', dept: 'HVAC & Electrical' },
    { code: 'EMP102', name: 'Suresh Varma', dept: 'Plumbing Services' },
    { code: 'EMP104', name: 'Priya Sharma', dept: 'Appliance Repair' }
  ];

  // Auto-login selected demo staff
  useEffect(() => {
    if (!isOpen) return;
    handleStaffLogin(selectedStaffCode);
  }, [selectedStaffCode, isOpen]);

  // Working timer tick
  useEffect(() => {
    let interval: any = null;
    if (isOnDuty) {
      interval = setInterval(() => {
        setWorkingSeconds((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOnDuty]);

  const handleStaffLogin = async (code: string) => {
    try {
      setStatusMsg('Authenticating CogniTrack executive...');
      const res = await fetch('http://127.0.0.1:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employee_code: code, password: 'Password@123' })
      });
      if (res.ok) {
        const data = await res.json();
        setToken(data.access_token);
        setStaffInfo(data.user);
        
        // Fetch current duty status
        const statusRes = await fetch('http://127.0.0.1:8000/api/tracking/status', {
          headers: { Authorization: `Bearer ${data.access_token}` }
        });
        if (statusRes.ok) {
          const sData = await statusRes.json();
          setIsOnDuty(sData.is_on_duty);
          setDistanceKm(sData.today_distance_km);
          setWorkingSeconds(sData.working_seconds || 0);
          if (sData.last_latitude) setSimLat(sData.last_latitude);
          if (sData.last_longitude) setSimLon(sData.last_longitude);
        }
        setStatusMsg('');
      }
    } catch (e) {
      setStatusMsg('Login error');
    }
  };

  const toggleDuty = async () => {
    if (!token) return;
    try {
      if (!isOnDuty) {
        // Start duty
        const res = await fetch('http://127.0.0.1:8000/api/tracking/start', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            start_latitude: simLat,
            start_longitude: simLon,
            start_address: 'Banjara Hills, Hyderabad',
            battery_level: batteryLevel
          })
        });
        if (res.ok) {
          setIsOnDuty(true);
          setStatusMsg('Duty started! Background foreground service active.');
          if (onLocationSent) onLocationSent();
        }
      } else {
        // Stop duty
        const res = await fetch('http://127.0.0.1:8000/api/tracking/stop', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            end_latitude: simLat,
            end_longitude: simLon,
            end_address: 'Hitec City, Hyderabad',
            battery_level: batteryLevel
          })
        });
        if (res.ok) {
          setIsOnDuty(false);
          setStatusMsg('Duty completed. CogniTrack daily summary generated.');
          if (onLocationSent) onLocationSent();
        }
      }
    } catch (e) {
      setStatusMsg('Network error toggling duty');
    }
  };

  const simulateMovement = async () => {
    // Increment coordinate slightly (approx 200m movement in Hyderabad)
    const nextLat = simLat + (Math.random() - 0.4) * 0.003;
    const nextLon = simLon + (Math.random() - 0.4) * 0.003;
    setSimLat(nextLat);
    setSimLon(nextLon);

    const pt = {
      latitude: nextLat,
      longitude: nextLon,
      accuracy: gpsAccuracy,
      speed: 15.0 + Math.random() * 10,
      timestamp: new Date().toISOString(),
      battery_level: batteryLevel,
      client_id: `MOB-${Date.now()}`
    };

    if (isOnline && token) {
      try {
        const res = await fetch('http://127.0.0.1:8000/api/tracking/location', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify(pt)
        });
        if (res.ok) {
          setStatusMsg('GPS point synced to CogniTrack cloud in real-time!');
          setDistanceKm((prev) => +(prev + 0.25).toFixed(2));
          if (onLocationSent) onLocationSent();
        }
      } catch (e) {
        setOfflineQueue((prev) => [...prev, pt]);
        setStatusMsg('Network failed: stored point in SQLite offline queue');
      }
    } else {
      setOfflineQueue((prev) => [...prev, pt]);
      setStatusMsg(`Stored in local SQLite queue (${offlineQueue.length + 1} pending)`);
    }
  };

  const syncOfflineQueue = async () => {
    if (!token || offlineQueue.length === 0) return;
    setStatusMsg(`Uploading batch of ${offlineQueue.length} offline points...`);
    try {
      const res = await fetch('http://127.0.0.1:8000/api/tracking/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ locations: offlineQueue })
      });
      if (res.ok) {
        const data = await res.json();
        setOfflineQueue([]);
        setDistanceKm(data.current_distance_km);
        setStatusMsg(`Successfully batch synced ${data.total_accepted} offline locations!`);
        if (onLocationSent) onLocationSent();
      }
    } catch (e) {
      setStatusMsg('Failed to sync batch');
    }
  };

  if (!isOpen) return null;

  const hours = Math.floor(workingSeconds / 3600);
  const minutes = Math.floor((workingSeconds % 3600) / 60);
  const seconds = workingSeconds % 60;
  const timerStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15, 23, 42, 0.45)',
        backdropFilter: 'blur(8px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20
      }}
    >
      <div
        style={{
          width: 380,
          height: 750,
          background: '#F8FAFC',
          borderRadius: 44,
          border: '8px solid #FFFFFF',
          boxShadow: '0 25px 60px rgba(15, 23, 42, 0.18), 0 0 0 2px #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          position: 'relative'
        }}
      >
        {/* Device Notch */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 130,
            height: 20,
            background: '#E2E8F0',
            borderBottomLeftRadius: 14,
            borderBottomRightRadius: 14,
            zIndex: 100,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#94A3B8', marginRight: 8 }} />
          <div style={{ width: 36, height: 4, borderRadius: 2, background: '#CBD5E1' }} />
        </div>

        {/* Close Button top-right */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 14,
            right: 14,
            zIndex: 110,
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            color: '#0F172A',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            boxShadow: '0 2px 6px rgba(15, 23, 42, 0.08)'
          }}
        >
          <X size={15} />
        </button>

        {/* Android Status Bar */}
        <div
          style={{
            padding: '8px 24px 4px',
            marginTop: 18,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: 11,
            color: '#64748B',
            fontWeight: 700
          }}
        >
          <span>11:42 AM</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {isOnline ? <Wifi size={13} color="#059669" /> : <WifiOff size={13} color="#DC2626" />}
            <span>{batteryLevel}%</span>
            <Battery size={13} />
          </div>
        </div>

        {/* Staff Switcher demo controls with ExtraHand Gold Accent */}
        <div
          style={{
            padding: '8px 14px',
            background: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}
        >
          <select
            value={selectedStaffCode}
            onChange={(e) => setSelectedStaffCode(e.target.value)}
            style={{
              background: '#F8FAFC',
              color: '#0F172A',
              border: '1.5px solid #CBD5E1',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              padding: '4px 8px',
              outline: 'none'
            }}
          >
            {demoStaff.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>

          {/* Network Toggle Button */}
          <button
            onClick={() => {
              setIsOnline(!isOnline);
              setStatusMsg(isOnline ? 'Network dropped: storing in offline SQLite queue!' : 'Internet restored: ready to sync!');
            }}
            style={{
              padding: '4px 10px',
              borderRadius: 8,
              fontSize: 11,
              fontWeight: 700,
              background: isOnline ? '#ECFDF5' : '#FEF2F2',
              color: isOnline ? '#059669' : '#DC2626',
              border: `1px solid ${isOnline ? '#A7F3D0' : '#FECACA'}`,
              cursor: 'pointer'
            }}
          >
            {isOnline ? 'Online 🟢' : 'Offline 🔴'}
          </button>
        </div>

        {/* Foreground Service Notification Banner Simulation */}
        {isOnDuty && (
          <div
            style={{
              margin: '8px 12px',
              padding: '8px 12px',
              borderRadius: 10,
              background: '#ECFDF5',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              gap: 10
            }}
          >
            <ShieldCheck size={20} color="#059669" />
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#065F46' }}>CogniTrack Foreground Service Active</div>
              <div style={{ fontSize: 10, color: '#047857' }}>GPS active • Locked screen protected</div>
            </div>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981', boxShadow: '0 0 6px #10B981' }} />
          </div>
        )}

        {/* App Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '12px 16px' }}>
          {activeTab === 'home' && (
            <div>
              {/* CogniTrack Brand Header Capsule */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 26, height: 26, borderRadius: 8, background: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 14, fontWeight: 900, color: '#FFFFFF' }}>C</span>
                  </div>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#0F172A' }}>
                    Cogni<span style={{ color: '#2563EB' }}>Track</span>
                  </span>
                </div>
                <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', borderRadius: 12, padding: '2px 8px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <ShieldCheck size={11} color="#059669" />
                  <span style={{ fontSize: 9, fontWeight: 800, color: '#059669' }}>VERIFIED</span>
                </div>
              </div>

              <div style={{ marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: '#64748B', fontWeight: 500 }}>Good Morning,</span>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#0F172A' }}>{staffInfo?.name || 'Rahul Kumar'}</div>
                <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700 }}>{staffInfo?.department || 'HVAC & Electrical'} • {staffInfo?.employee_code || selectedStaffCode}</div>
              </div>

              {/* Status Banner */}
              <div
                style={{
                  padding: 14,
                  borderRadius: 14,
                  background: isOnDuty ? '#FFFBEB' : '#FFFFFF',
                  border: `1.5px solid ${isOnDuty ? '#FDE68A' : '#E2E8F0'}`,
                  boxShadow: '0 2px 6px rgba(15, 23, 42, 0.04)',
                  marginBottom: 12
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>DUTY STATUS</span>
                  <span style={{
                    fontSize: 10,
                    fontWeight: 800,
                    color: isOnDuty ? '#059669' : '#DC2626',
                    background: isOnDuty ? '#ECFDF5' : '#FEF2F2',
                    border: `1px solid ${isOnDuty ? '#A7F3D0' : '#FECACA'}`,
                    padding: '2px 8px',
                    borderRadius: 10
                  }}>
                    {isOnDuty ? 'ON DUTY' : 'OFF DUTY'}
                  </span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 10, fontWeight: 800, color: '#64748B' }}>GPS TELEMETRY</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: isOnDuty ? '#D97706' : '#94A3B8' }}>
                    {isOnDuty ? 'SIGNAL LOCKED' : 'STANDBY'}
                  </span>
                </div>
              </div>

              {/* Metrics Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Active Shift Time</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#D97706', marginTop: 2 }}>{timerStr}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 1px 3px rgba(15, 23, 42, 0.04)' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Today's Distance</div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginTop: 2 }}>{distanceKm} KM</div>
                </div>
              </div>

              {/* Duty Toggle Button with ExtraHand Styling */}
              <button
                onClick={toggleDuty}
                style={{
                  width: '100%',
                  padding: '12px',
                  borderRadius: 12,
                  fontWeight: 800,
                  fontSize: 13,
                  border: 'none',
                  color: isOnDuty ? '#FFFFFF' : '#0F172A',
                  background: isOnDuty ? 'linear-gradient(135deg, #EF4444, #DC2626)' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  marginBottom: 10,
                  boxShadow: isOnDuty ? '0 4px 15px rgba(239, 68, 68, 0.3)' : '0 4px 15px rgba(245, 158, 11, 0.35)'
                }}
              >
                {isOnDuty ? <Square size={16} /> : <Play size={16} fill="#0F172A" />}
                {isOnDuty ? 'END WORKING DUTY' : 'START DUTY & TRACKING'}
              </button>

              {/* Movement Simulation Controls */}
              {isOnDuty && (
                <div style={{ background: '#FEF3C7', padding: 10, borderRadius: 12, border: '1.5px solid #FCD34D', marginTop: 8 }}>
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#92400E', marginBottom: 4 }}>SIMULATOR ACTION</div>
                  <button
                    onClick={simulateMovement}
                    style={{
                      width: '100%',
                      padding: '8px',
                      fontSize: 11,
                      fontWeight: 800,
                      background: 'linear-gradient(135deg, #F59E0B, #D97706)',
                      color: '#0F172A',
                      border: 'none',
                      borderRadius: 8,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6,
                      boxShadow: '0 2px 8px rgba(245, 158, 11, 0.25)'
                    }}
                  >
                    <Navigation size={13} /> Send Next GPS Update (~200m)
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'tracking' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>CogniTrack GPS Diagnostics</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Last Telemetry Ping</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>{new Date().toLocaleTimeString()}</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>GPS Accuracy</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: '#059669' }}>{gpsAccuracy} meters (Sub-10m High)</div>
                </div>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Network Connectivity</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: isOnline ? '#059669' : '#DC2626' }}>
                    {isOnline ? 'Online (FastAPI Realtime)' : 'Offline (Local SQLite Buffer)'}
                  </div>
                </div>
                <div style={{ background: '#FFFFFF', padding: 10, borderRadius: 12, border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Offline Queue Pending</div>
                  <div style={{ fontSize: 15, fontWeight: 800, color: offlineQueue.length > 0 ? '#D97706' : '#64748B' }}>
                    {offlineQueue.length} records
                  </div>
                  {offlineQueue.length > 0 && isOnline && (
                    <button
                      onClick={syncOfflineQueue}
                      style={{
                        width: '100%',
                        marginTop: 6,
                        padding: '7px',
                        fontSize: 11,
                        fontWeight: 800,
                        background: '#10B981',
                        color: '#FFFFFF',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 4
                      }}
                    >
                      <RefreshCw size={12} /> Sync Now ({offlineQueue.length})
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'profile' && (
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 10 }}>Partner Profile</div>
              <div style={{ background: '#FFFFFF', padding: 12, borderRadius: 14, border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Partner Name</div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{staffInfo?.name}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Employee Code</div>
                  <div style={{ fontSize: 12, color: '#D97706', fontWeight: 800 }}>{staffInfo?.employee_code}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Department / Specialty</div>
                  <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{staffInfo?.department || 'Field Services'}</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Rating & Satisfaction</div>
                  <div style={{ fontSize: 12, color: '#D97706', fontWeight: 800 }}>★ 4.8 / 5.0 (98% Satisfaction)</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: '#64748B', fontWeight: 600 }}>Battery Optimization</div>
                  <div style={{ fontSize: 11, color: '#059669', fontWeight: 700 }}>✓ Whitelisted (Unrestricted background)</div>
                </div>
              </div>
            </div>
          )}

          {/* Status Message */}
          {statusMsg && (
            <div style={{ marginTop: 10, padding: '6px 10px', borderRadius: 8, background: '#FEF3C7', border: '1px solid #FCD34D', fontSize: 10, color: '#92400E', fontWeight: 700 }}>
              ℹ {statusMsg}
            </div>
          )}
        </div>

        {/* Mobile App Bottom Navigation Bar with Amber Gold Active Colors */}
        <div
          style={{
            height: 56,
            borderTop: '1px solid #E2E8F0',
            background: '#FFFFFF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-around'
          }}
        >
          <button
            onClick={() => setActiveTab('home')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'home' ? '#D97706' : '#94A3B8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontSize: 10,
              fontWeight: activeTab === 'home' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <MapPin size={16} />
            <span>Home</span>
          </button>
          <button
            onClick={() => setActiveTab('tracking')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'tracking' ? '#D97706' : '#94A3B8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontSize: 10,
              fontWeight: activeTab === 'tracking' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <Navigation size={16} />
            <span>Tracking</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            style={{
              background: 'none',
              border: 'none',
              color: activeTab === 'profile' ? '#D97706' : '#94A3B8',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 2,
              fontSize: 10,
              fontWeight: activeTab === 'profile' ? 800 : 600,
              cursor: 'pointer'
            }}
          >
            <User size={16} />
            <span>Profile</span>
          </button>
        </div>
      </div>
    </div>
  );
};
