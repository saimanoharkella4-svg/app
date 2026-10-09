import React from 'react';
import { 
  MapPin, Users, Navigation, Briefcase, 
  BarChart3, AlertTriangle, Clock, RefreshCw
} from 'lucide-react';
import { StaffUser } from '../services/api';

interface HeaderProps {
  currentTab: string;
  user: StaffUser | null;
  onRefresh?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, user, onRefresh }) => {
  const getTabDetails = () => {
    switch (currentTab) {
      case 'live-map':
        return {
          title: 'Live Field Operations Radar',
          subtitle: 'Real-time telemetry tracking & active executive monitor',
          icon: <MapPin size={20} color="#4F46E5" />
        };
      case 'staff':
        return {
          title: 'Marketing Executives Directory',
          subtitle: 'Manage active field staff roster, accounts, and assignments',
          icon: <Users size={20} color="#4F46E5" />
        };
      case 'route-history':
        return {
          title: 'Route History Inspector',
          subtitle: 'Replay historical route paths, stops, and distance telemetry',
          icon: <Navigation size={20} color="#4F46E5" />
        };
      case 'jobs':
        return {
          title: 'Field Tasks & Schedules',
          subtitle: 'Assign tasks, monitor field visits, and review completion proof',
          icon: <Briefcase size={20} color="#4F46E5" />
        };
      case 'reports':
        return {
          title: 'Reports & Telemetry Analytics',
          subtitle: 'Comprehensive export & cumulative working hours analysis',
          icon: <BarChart3 size={20} color="#4F46E5" />
        };
      case 'anomalies':
        return {
          title: 'GPS Anomaly & Audit Logs',
          subtitle: 'Automated alerts for poor GPS accuracy, speed, or location jumps',
          icon: <AlertTriangle size={20} color="#EF4444" />
        };
      default:
        return {
          title: 'Operations Console',
          subtitle: 'CogniTrack Fleet Management Platform',
          icon: <MapPin size={20} color="#4F46E5" />
        };
    }
  };

  const currentDetails = getTabDetails();
  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <header
      style={{
        height: 64,
        minHeight: 64,
        background: '#FFFFFF',
        borderBottom: '1px solid #E2E8F0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 28px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
        zIndex: 50
      }}
    >
      {/* Active Page Header & Icon */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#EEF2FF',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '1px solid #C7D2FE'
          }}
        >
          {currentDetails.icon}
        </div>
        <div>
          <h1 style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.2 }}>
            {currentDetails.title}
          </h1>
          <p style={{ fontSize: 11, color: '#64748B', margin: 0, fontWeight: 500 }}>
            {currentDetails.subtitle}
          </p>
        </div>
      </div>

      {/* Right Controls: Date & Refresh Action */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* Date Display */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            fontSize: 12,
            fontWeight: 600,
            color: '#64748B',
            background: '#F8FAFC',
            padding: '6px 12px',
            borderRadius: 8,
            border: '1px solid #E2E8F0'
          }}
        >
          <Clock size={14} color="#94A3B8" />
          <span>{todayStr}</span>
        </div>

        {/* Refresh Button */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="btn-secondary"
            style={{ padding: '6px 12px', fontSize: 12 }}
            title="Refresh dashboard data"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        )}
      </div>
    </header>
  );
};
