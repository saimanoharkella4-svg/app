import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, UserCheck, Search, ShieldAlert } from 'lucide-react';

interface AttendanceRecord {
  staff_id: number;
  employee_code: string;
  name: string;
  region: string;
  department: string;
  status: 'PRESENT' | 'ABSENT';
  shift_status: string;
  clock_in: string | null;
  clock_out: string | null;
  is_late: boolean;
  working_minutes: number;
  distance_km: number;
  stc_status: string;
}

export const AttendanceView: React.FC = () => {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadAttendance();
  }, []);

  const loadAttendance = async () => {
    setLoading(true);
    try {
      const data = await api.getAttendanceSTC();
      setRecords(data);
    } catch (e) {
      console.error('Failed to load attendance', e);
    } finally {
      setLoading(false);
    }
  };

  const filteredRecords = records.filter(r =>
    searchQuery === '' ||
    r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.employee_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const presentCount = records.filter(r => r.status === 'PRESENT').length;
  const absentCount = records.filter(r => r.status === 'ABSENT').length;
  const lateCount = records.filter(r => r.is_late).length;

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <Clock size={24} color="#4F46E5" /> Attendance & Shift Time Control (STC)
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            Track daily field check-ins, late arrivals, early departures, and active shift status.
          </p>
        </div>
        <button
          onClick={loadAttendance}
          style={{
            padding: '9px 16px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            background: '#FFFFFF',
            color: '#334155',
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Refresh STC Logs
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #E2E8F0' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Marketing Execs</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{records.length}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #DCFCE7' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}>Present & On Duty</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#15803D', marginTop: 4 }}>{presentCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #FEE2E2' }}>
          <div style={{ fontSize: 12, color: '#991B1B', fontWeight: 600 }}>Absent / Off-Duty</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#B91C1C', marginTop: 4 }}>{absentCount}</div>
        </div>
        <div style={{ background: '#FFFFFF', padding: 18, borderRadius: 12, border: '1px solid #FEF3C7' }}>
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 600 }}>Late Arrivals (&gt;9:30 AM)</div>
          <div style={{ fontSize: 24, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{lateCount}</div>
        </div>
      </div>

      {/* Search Input */}
      <div style={{ marginBottom: 20, position: 'relative', maxWidth: 400 }}>
        <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
        <input
          type="text"
          placeholder="Filter executive attendance by name, code or region..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '10px 14px 10px 38px',
            borderRadius: 8,
            border: '1px solid #CBD5E1',
            fontSize: 13,
            outline: 'none',
            background: '#FFFFFF'
          }}
        />
      </div>

      {/* Attendance Log Table */}
      <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 13 }}>
          <thead>
            <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #E2E8F0', color: '#64748B', fontWeight: 700 }}>
              <th style={{ padding: '14px 18px' }}>Executive Details</th>
              <th style={{ padding: '14px 18px' }}>Region & Department</th>
              <th style={{ padding: '14px 18px' }}>Today's Status</th>
              <th style={{ padding: '14px 18px' }}>Clock-In Time</th>
              <th style={{ padding: '14px 18px' }}>Clock-Out Time</th>
              <th style={{ padding: '14px 18px' }}>Punctuality</th>
              <th style={{ padding: '14px 18px' }}>Field Distance</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#94A3B8' }}>Loading STC logs...</td>
              </tr>
            ) : filteredRecords.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: 30, textAlign: 'center', color: '#94A3B8' }}>No attendance logs found.</td>
              </tr>
            ) : (
              filteredRecords.map(r => (
                <tr key={r.staff_id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 700, color: '#0F172A' }}>{r.name}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{r.employee_code}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <div style={{ fontWeight: 600, color: '#334155' }}>{r.region}</div>
                    <div style={{ fontSize: 11, color: '#64748B' }}>{r.department}</div>
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    <span
                      style={{
                        padding: '4px 10px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 800,
                        background: r.status === 'PRESENT' ? '#DCFCE7' : '#FEE2E2',
                        color: r.status === 'PRESENT' ? '#15803D' : '#B91C1C'
                      }}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#0F172A' }}>
                    {r.clock_in ? new Date(r.clock_in).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : '--'}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 600, color: '#64748B' }}>
                    {r.clock_out ? new Date(r.clock_out).toLocaleTimeString('en-IN', { timeStyle: 'short' }) : 'Active Shift'}
                  </td>
                  <td style={{ padding: '14px 18px' }}>
                    {r.status === 'ABSENT' ? (
                      <span style={{ fontSize: 11, color: '#94A3B8' }}>--</span>
                    ) : r.is_late ? (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#D97706', background: '#FEF3C7', padding: '3px 8px', borderRadius: 4 }}>
                        LATE ARRIVAL
                      </span>
                    ) : (
                      <span style={{ fontSize: 11, fontWeight: 700, color: '#166534', background: '#DCFCE7', padding: '3px 8px', borderRadius: 4 }}>
                        ON TIME
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '14px 18px', fontWeight: 700, color: '#4F46E5' }}>
                    {r.distance_km} KM
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
