import React from 'react';
import { OverviewStats, LiveStaffItem, ExtraHandJob } from '../services/api';
import { Users, MapPin, CheckCircle, Clock, Navigation, TrendingUp, UserCheck, Calendar } from 'lucide-react';

interface DashboardViewProps {
  overviewStats: OverviewStats | null;
  liveStaff: LiveStaffItem[];
  jobs: ExtraHandJob[];
  onNavigateTab: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  overviewStats,
  liveStaff,
  jobs,
  onNavigateTab
}) => {
  const totalExecutives = overviewStats?.total_staff_count || liveStaff.length;
  const activeExecutives = overviewStats?.active_staff_count || 0;
  const totalAssignedLocations = jobs.length;
  const visitedLocations = jobs.filter(j => j.status === 'COMPLETED').length;
  const pendingLocations = jobs.filter(j => j.status !== 'COMPLETED').length;
  const attendanceRate = totalExecutives > 0 ? Math.round((activeExecutives / totalExecutives) * 100) : 0;

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0 }}>
          Field Operations Executive Dashboard
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
          Real-time summary of marketing executives, assigned merchant locations, visit completion, and weekly activity.
        </p>
      </div>

      {/* Top 5 KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Marketing Execs</span>
            <Users size={20} color="#4F46E5" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>{totalExecutives}</div>
          <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, marginTop: 4 }}>Active Field Workforce</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Assigned Locations</span>
            <MapPin size={20} color="#06B6D4" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#0F172A', marginTop: 8 }}>{totalAssignedLocations}</div>
          <div style={{ fontSize: 11, color: '#64748B', fontWeight: 600, marginTop: 4 }}>Target Merchant Outlets</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #DCFCE7', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Visited vs Pending</span>
            <CheckCircle size={20} color="#10B981" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#15803D', marginTop: 8 }}>{visitedLocations} <span style={{ fontSize: 16, color: '#94A3B8' }}>/ {pendingLocations}</span></div>
          <div style={{ fontSize: 11, color: '#166534', fontWeight: 700, marginTop: 4 }}>Completed Visits</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Today's Attendance</span>
            <UserCheck size={20} color="#D97706" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#D97706', marginTop: 8 }}>{activeExecutives} <span style={{ fontSize: 16, color: '#94A3B8' }}>({attendanceRate}%)</span></div>
          <div style={{ fontSize: 11, color: '#D97706', fontWeight: 700, marginTop: 4 }}>On Duty & Tracking</div>
        </div>

        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 6px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Fleet Distance Today</span>
            <Navigation size={20} color="#6366F1" />
          </div>
          <div style={{ fontSize: 26, fontWeight: 900, color: '#4338CA', marginTop: 8 }}>{overviewStats?.total_distance_today_km || 0} KM</div>
          <div style={{ fontSize: 11, color: '#6366F1', fontWeight: 700, marginTop: 4 }}>Aggregate Breadcrumbs</div>
        </div>
      </div>

      {/* Main Grid: Active Executives & Today's Visit Breakdown */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Active Executives Table */}
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Marketing Executives Live Radar
            </h3>
            <button
              onClick={() => onNavigateTab('live-map')}
              style={{ background: 'none', border: 'none', color: '#4F46E5', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Open Live Map Radar &rarr;
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#F8FAFC', color: '#64748B', borderBottom: '1px solid #E2E8F0' }}>
                <th style={{ padding: '10px 12px' }}>Executive</th>
                <th style={{ padding: '10px 12px' }}>Current Region</th>
                <th style={{ padding: '10px 12px' }}>Duty Status</th>
                <th style={{ padding: '10px 12px' }}>Distance</th>
                <th style={{ padding: '10px 12px' }}>Visits Done</th>
              </tr>
            </thead>
            <tbody>
              {liveStaff.map(s => (
                <tr key={s.staff_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '12px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{s.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{s.employee_code}</div>
                  </td>
                  <td style={{ padding: '12px', color: '#334155', fontWeight: 600 }}>{s.current_area}</td>
                  <td style={{ padding: '12px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: 10,
                        fontSize: 10,
                        fontWeight: 800,
                        background: s.status === 'ACTIVE' ? '#DCFCE7' : '#FEF3C7',
                        color: s.status === 'ACTIVE' ? '#166534' : '#92400E'
                      }}
                    >
                      {s.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#4F46E5' }}>{s.today_distance_km} KM</td>
                  <td style={{ padding: '12px', fontWeight: 700, color: '#10B981' }}>{s.jobs_completed_today} / {s.jobs_today}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Quick Action Navigation Shortcuts */}
        <div style={{ background: '#FFFFFF', padding: 20, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16 }}>
            Admin Operations Modules
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <button
              onClick={() => onNavigateTab('staff')}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#0F172A', cursor: 'pointer' }}
            >
              Executive Management &rarr;
            </button>
            <button
              onClick={() => onNavigateTab('excel-import')}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#0F172A', cursor: 'pointer' }}
            >
              Excel Location Import & Assignment &rarr;
            </button>
            <button
              onClick={() => onNavigateTab('visit-reports')}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#0F172A', cursor: 'pointer' }}
            >
              Visit Reports & Verification &rarr;
            </button>
            <button
              onClick={() => onNavigateTab('reports')}
              style={{ padding: 12, borderRadius: 8, border: '1px solid #CBD5E1', background: '#F8FAFC', textAlign: 'left', fontWeight: 700, fontSize: 13, color: '#0F172A', cursor: 'pointer' }}
            >
              Weekly Reports & PDF Exports &rarr;
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
