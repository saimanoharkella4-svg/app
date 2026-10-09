import React from 'react';
import { 
  MapPin, Users, Navigation, Briefcase, 
  BarChart3, AlertTriangle, LogOut, Activity, ChevronRight,
  FileSpreadsheet, CheckSquare, Clock, Settings, LayoutDashboard
} from 'lucide-react';
import { StaffUser } from '../services/api';

interface SidebarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  user: StaffUser | null;
  onLogout: () => void;
  isWsConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onTabChange,
  user,
  onLogout,
  isWsConnected
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
    { id: 'staff', label: 'Executive Management', icon: <Users size={18} /> },
    { id: 'excel-import', label: 'Excel Import & Assign', icon: <FileSpreadsheet size={18} /> },
    { id: 'live-map', label: 'Live Field Monitoring', icon: <MapPin size={18} />, badge: 'LIVE' },
    { id: 'reports', label: 'Weekly Reports', icon: <BarChart3 size={18} /> },
    { id: 'visit-reports', label: 'Visit Reports & Verify', icon: <Briefcase size={18} /> },
    { id: 'settings', label: 'Settings & Permissions', icon: <Settings size={18} /> },
  ];

  return (
    <aside
      style={{
        width: 270,
        minWidth: 270,
        height: '100vh',
        background: '#FFFFFF',
        borderRight: '1px solid #E2E8F0',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: '2px 0 12px rgba(15, 23, 42, 0.03)',
        userSelect: 'none'
      }}
    >
      {/* Top Header / Branding */}
      <div>
        <div style={{ padding: '24px 20px 20px 20px', borderBottom: '1px solid #F1F5F9' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: 12,
                background: 'linear-gradient(135deg, #4F46E5, #3730A3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 14px rgba(79, 70, 229, 0.35)'
              }}
            >
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#FFFFFF"
                strokeWidth="2.4"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
                <circle cx="12" cy="12" r="4" stroke="#06B6D4" strokeWidth="2.2" fill="#06B6D4" fillOpacity="0.3" />
                <path d="M12 2V5" stroke="#FFFFFF" />
                <path d="M12 19V22" stroke="#FFFFFF" />
                <path d="M2 12H5" stroke="#FFFFFF" />
                <path d="M19 12H22" stroke="#FFFFFF" />
              </svg>
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 19, fontWeight: 900, color: '#0F172A', letterSpacing: '-0.03em' }}>
                  Cogni<span style={{ color: '#4F46E5' }}>Track</span>
                </span>
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: 4,
                    background: '#EEF2FF',
                    color: '#4338CA',
                    border: '1px solid #C7D2FE',
                    letterSpacing: '0.05em'
                  }}
                >
                  ADMIN
                </span>
              </div>
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 500, marginTop: 1 }}>
                Telemetry Console
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Category Header */}
        <div style={{ padding: '20px 20px 8px 20px', fontSize: 11, fontWeight: 800, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
          Main Operations
        </div>

        {/* Nav Items List */}
        <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  width: '100%',
                  padding: '11px 14px',
                  borderRadius: 10,
                  fontSize: 13.5,
                  fontWeight: isActive ? 700 : 600,
                  color: isActive ? '#4338CA' : '#475569',
                  background: isActive ? '#EEF2FF' : 'transparent',
                  border: isActive ? '1px solid #C7D2FE' : '1px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                  <span style={{ color: isActive ? '#4F46E5' : '#64748B', display: 'flex', alignItems: 'center' }}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>
                {item.badge ? (
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      padding: '2px 6px',
                      borderRadius: 10,
                      background: item.badgeColor ? '#FEF2F2' : '#ECFDF5',
                      color: item.badgeColor || '#059669',
                      border: `1px solid ${item.badgeColor ? '#FECACA' : '#A7F3D0'}`
                    }}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isActive && <ChevronRight size={15} color="#4338CA" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Controls / Profile Footer */}
      <div style={{ padding: '16px 16px 20px 16px', display: 'flex', flexDirection: 'column', gap: 12, borderTop: '1px solid #F1F5F9' }}>
        {/* WS Radar Connection Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '10px 12px',
            borderRadius: 10,
            background: isWsConnected ? '#F0FDF4' : '#EEF2FF',
            border: `1px solid ${isWsConnected ? '#DCFCE7' : '#C7D2FE'}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: isWsConnected ? '#10B981' : '#4F46E5',
                boxShadow: isWsConnected ? '0 0 8px rgba(16, 185, 129, 0.6)' : 'none'
              }}
            />
            <span style={{ fontSize: 12, fontWeight: 700, color: isWsConnected ? '#166534' : '#4338CA' }}>
              {isWsConnected ? 'Live Telemetry Radar' : 'Connecting Stream...'}
            </span>
          </div>
          <Activity size={14} color={isWsConnected ? '#166534' : '#4338CA'} />
        </div>

        {/* User Card & Logout */}
        {user && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 12px',
              borderRadius: 12,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  border: '1px solid #CBD5E1',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 800,
                  fontSize: 14,
                  color: '#1E293B'
                }}
              >
                {user.name.charAt(0)}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A', lineHeight: 1.2 }}>
                  {user.name}
                </span>
                <span style={{ fontSize: 11, color: '#64748B', fontWeight: 500 }}>
                  {user.role}
                </span>
              </div>
            </div>
            <button
              onClick={onLogout}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                padding: 6,
                borderRadius: 6,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#94A3B8',
                transition: 'all 0.15s ease'
              }}
              title="Sign Out"
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
            >
              <LogOut size={16} />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
};
