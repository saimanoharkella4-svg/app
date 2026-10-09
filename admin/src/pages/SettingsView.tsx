import React, { useState } from 'react';
import { api, StaffUser } from '../services/api';
import { Settings, Shield, MapPin, Target, FileSpreadsheet, Download, History, Save } from 'lucide-react';

interface SettingsViewProps {
  currentUser: StaffUser | null;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ currentUser }) => {
  const [dailyTarget, setDailyTarget] = useState<number>(6);
  const [weeklyTarget, setWeeklyTarget] = useState<number>(36);
  const [selectedRegion, setSelectedRegion] = useState<string>('Hyderabad North');
  const [isSaved, setIsSaved] = useState(false);

  const handleSave = () => {
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const auditLogs = [
    { id: 1, action: 'LOCATION_ASSIGNMENT', details: 'Assigned 4 new merchant locations to EMP101 (Rahul Kumar)', user: 'Vikram Rao (ADMIN)', time: 'Today 10:15 AM' },
    { id: 2, action: 'EXECUTIVE_UPDATE', details: 'Updated region access permissions for EMP104 to Hyderabad North', user: 'Vikram Rao (ADMIN)', time: 'Yesterday 04:30 PM' },
    { id: 3, action: 'TARGET_CONFIG', details: 'Updated daily visit target threshold to 6 visits/day', user: 'Vikram Rao (ADMIN)', time: '2026-10-07 11:00 AM' },
  ];

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <Settings size={24} color="#4F46E5" /> System Settings & Access Control
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
          Configure RBAC roles, regional access bounds, visit targets, download master Excel templates, and inspect audit logs.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Role & Target Config */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Target size={18} color="#4F46E5" /> Visit Targets & Reporting Configuration
          </h3>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Default Daily Location Visit Target per Executive:
            </label>
            <input
              type="number"
              value={dailyTarget}
              onChange={e => setDailyTarget(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Weekly Target Achievement Goal:
            </label>
            <input
              type="number"
              value={weeklyTarget}
              onChange={e => setWeeklyTarget(Number(e.target.value))}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none'
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Managed Operational Region:
            </label>
            <select
              value={selectedRegion}
              onChange={e => setSelectedRegion(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none'
              }}
            >
              <option value="Hyderabad North">Hyderabad North (Hitec City, Gachibowli, Kukatpally)</option>
              <option value="Hyderabad South">Hyderabad South (Secunderabad, Banjara Hills)</option>
              <option value="Telangana Central">Telangana Central Region</option>
            </select>
          </div>

          <button
            onClick={handleSave}
            style={{
              padding: '10px 20px',
              borderRadius: 8,
              border: 'none',
              background: '#4F46E5',
              color: '#FFF',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6
            }}
          >
            <Save size={16} /> {isSaved ? 'Settings Saved!' : 'Save Configuration'}
          </button>
        </div>

        {/* Master Excel Templates & Export Center */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <FileSpreadsheet size={18} color="#10B981" /> Excel Templates & Export Center
          </h3>

          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Download pre-formatted Excel template workbooks for importing location schedules and generating aggregated field reports.
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 20 }}>
            <a
              href={api.getExcelTemplateUrl()}
              download
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Download Location Assignment Import Template (.xlsx)</span>
              <Download size={16} color="#4F46E5" />
            </a>

            <a
              href={api.getExcelExportUrl()}
              download
              style={{
                padding: '12px 16px',
                borderRadius: 8,
                background: '#F8FAFC',
                border: '1px solid #CBD5E1',
                color: '#0F172A',
                fontWeight: 700,
                fontSize: 13,
                textDecoration: 'none',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}
            >
              <span>Export Full Field Operations Excel Workbook (.xlsx)</span>
              <Download size={16} color="#10B981" />
            </a>
          </div>
        </div>
      </div>

      {/* Audit Logs */}
      <div style={{ marginTop: 28, background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
          <History size={18} color="#64748B" /> Audit Trail & Assignment History
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {auditLogs.map(log => (
            <div key={log.id} style={{ padding: 12, borderRadius: 8, background: '#F8FAFC', border: '1px solid #F1F5F9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '2px 6px', borderRadius: 4, marginRight: 8 }}>
                  {log.action}
                </span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1E293B' }}>{log.details}</span>
                <div style={{ fontSize: 11, color: '#64748B', marginTop: 2 }}>Performed by: {log.user}</div>
              </div>
              <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{log.time}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
