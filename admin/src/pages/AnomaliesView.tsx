import React, { useState, useEffect } from 'react';
import { api, GpsAnomalyItem } from '../services/api';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

export const AnomaliesView: React.FC = () => {
  const [anomalies, setAnomalies] = useState<GpsAnomalyItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnomalies();
  }, []);

  const loadAnomalies = async () => {
    try {
      const data = await api.getAnomalies();
      setAnomalies(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      <div style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldAlert size={24} color="#D97706" />
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            GPS Anomaly & Audit Logs
          </h1>
        </div>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          Automated alerts for poor GPS accuracy, speed anomalies, or unexpected jumps requiring review
        </p>
      </div>

      <div className="glass-panel" style={{ overflow: 'hidden', backgroundColor: '#FFFFFF', borderColor: '#E2E8F0' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Staff Member</th>
              <th>Anomaly Type</th>
              <th>Description</th>
              <th>Severity</th>
              <th>Detected Timestamp</th>
              <th>Review Status</th>
            </tr>
          </thead>
          <tbody>
            {anomalies.map((a) => (
              <tr key={a.id}>
                <td style={{ fontWeight: 700, color: '#64748B' }}>#{a.id}</td>
                <td>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>{a.staff_name}</span>
                </td>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: '#B45309', background: '#FEF3C7', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>
                    {a.anomaly_type}
                  </span>
                </td>
                <td>
                  <span style={{ color: 'var(--text-muted)' }}>{a.description}</span>
                </td>
                <td>
                  <span className={`badge ${a.severity === 'HIGH' ? 'badge-offline' : 'badge-break'}`}>
                    {a.severity}
                  </span>
                </td>
                <td style={{ color: '#64748B' }}>{new Date(a.detected_at).toLocaleString()}</td>
                <td>
                  <span className="badge badge-neutral">
                    {a.reviewed ? 'Reviewed ✓' : 'Under Review'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
