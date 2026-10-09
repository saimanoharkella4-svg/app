import React from 'react';
import { 
  MapPin, Users, Navigation, Briefcase, 
  BarChart3, AlertTriangle, LogOut, Smartphone 
} from 'lucide-react';
import { StaffUser } from '../services/api';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: StaffUser | null;
  onLogout: () => void;
  isWsConnected: boolean;
  onOpenSimulator: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  isWsConnected,
  onOpenSimulator
}) => {
  const navItems = [
    { id: 'live-map', label: 'Live Map', icon: <MapPin size={17} /> },
    { id: 'staff', label: 'Marketing Executives', icon: <Users size={17} /> },
    { id: 'route-history', label: 'Route History', icon: <Navigation size={17} /> },
    { id: 'jobs', label: 'Field Tasks & Schedules', icon: <Briefcase size={17} /> },
    { id: 'reports', label: 'Reports & Export', icon: <BarChart3 size={17} /> },
    { id: 'anomalies', label: 'GPS Alerts', icon: <AlertTriangle size={17} /> },
  ];

  return (
    <header
      style={{
        height: 68,
        borderBottom: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px'
      }}
    >
      {/* Brand Logo & Name Matching CogniTrack */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #4F46E5, #4338CA)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)'
          }}
        >
          <svg
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#FFFFFF"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
            <circle cx="12" cy="12" r="4" stroke="#06B6D4" strokeWidth="2.2" fill="#06B6D4" fillOpacity="0.25" />
            <path d="M12 2V5" stroke="#FFFFFF" />
            <path d="M12 19V22" stroke="#FFFFFF" />
            <path d="M2 12H5" stroke="#FFFFFF" />
            <path d="M19 12H22" stroke="#FFFFFF" />
          </svg>
        </div>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
              Cogni<span style={{ color: '#4F46E5' }}>Track</span>
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 800,
                padding: '2px 7px',
                borderRadius: 4,
                background: '#EEF2FF',
                color: '#4338CA',
                border: '1px solid #C7D2FE'
              }}
            >
              ADMIN
            </span>
          </div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
            Field Operations & Telemetry Console
          </div>
        </div>
      </div>

      {/* Nav Tabs */}
      <nav style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {navItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '8px 14px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: isActive ? 700 : 600,
                color: isActive ? '#4338CA' : '#475569',
                background: isActive ? '#EEF2FF' : 'transparent',
                border: isActive ? '1px solid #C7D2FE' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              <span style={{ color: isActive ? '#4F46E5' : '#64748B' }}>{item.icon}</span>
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Right Controls: WebSocket status, Mobile App Simulator, Admin Profile & Logout */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* Live WS Status */}
        <div
          title={isWsConnected ? 'WebSocket live updates active' : 'Connecting to live updates...'}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 700,
            padding: '4px 10px',
            borderRadius: 20,
            background: isWsConnected ? '#ECFDF5' : '#EEF2FF',
            border: `1px solid ${isWsConnected ? '#A7F3D0' : '#C7D2FE'}`,
            color: isWsConnected ? '#059669' : '#4F46E5'
          }}
        >
          <span
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              backgroundColor: isWsConnected ? '#10B981' : '#4F46E5'
            }}
          />
          {isWsConnected ? 'Live Radar' : 'Connecting'}
        </div>

        {/* Mobile Staff App Simulator Button */}
        <button
          onClick={onOpenSimulator}
          className="btn-primary"
          style={{ padding: '7px 14px', fontSize: 12 }}
          title="Open staff mobile app interactive simulator"
        >
          <Smartphone size={15} />
          Mobile Executive App
        </button>

        {/* User Badge */}
        {user && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, paddingLeft: 8, borderLeft: '1px solid #E2E8F0' }}>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: '#EEF2FF',
                border: '1.5px solid #C7D2FE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: 13,
                color: '#4338CA'
              }}
            >
              {user.name.charAt(0)}
            </div>
            <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                {user.name}
              </span>
              <span style={{ fontSize: 11, color: '#64748B' }}>
                {user.role}
              </span>
            </div>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '6px 10px', marginLeft: 4 }}
              title="Logout"
            >
              <LogOut size={14} color="#64748B" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
};
