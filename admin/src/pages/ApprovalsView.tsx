import React, { useState, useEffect } from 'react';
import { api, AssignedLocationJob } from '../services/api';
import { CheckSquare, Bell, AlertTriangle, CheckCircle, XCircle, Clock, ShieldAlert, Send } from 'lucide-react';

export const ApprovalsView: React.FC = () => {
  const [pendingVisits, setPendingVisits] = useState<AssignedLocationJob[]>([]);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [notificationMsg, setNotificationMsg] = useState('');
  const [sentAlerts, setSentAlerts] = useState<string[]>([]);

  useEffect(() => {
    loadApprovals();
  }, []);

  const loadApprovals = async () => {
    setLoading(true);
    try {
      const [jobs, anomalyList] = await Promise.all([
        api.getJobs(),
        api.getAnomalies()
      ]);
      setPendingVisits(jobs.filter(j => j.verification_status === 'PENDING' || j.status === 'COMPLETED'));
      setAnomalies(anomalyList);
    } catch (e) {
      console.error('Failed to load approvals', e);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.verifyJobVisit(id, 'APPROVED');
      await loadApprovals();
    } catch (e) {
      alert('Error approving visit');
    }
  };

  const handleReject = async (id: number) => {
    try {
      await api.verifyJobVisit(id, 'REJECTED');
      await loadApprovals();
    } catch (e) {
      alert('Error rejecting visit');
    }
  };

  const handleSendNotification = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notificationMsg.trim()) return;
    setSentAlerts([`[${new Date().toLocaleTimeString()}] Push Broadcast Sent: ${notificationMsg}`, ...sentAlerts]);
    setNotificationMsg('');
  };

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <CheckSquare size={24} color="#4F46E5" /> Approvals & Push Notifications Center
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
          Approve submitted visit reports, resolve attendance & GPS alerts, and broadcast target notifications to field executives.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
        {/* Approvals Queue */}
        <div>
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, marginBottom: 24 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={18} color="#4F46E5" /> Pending Visit Approvals ({pendingVisits.length})
            </h3>

            {loading ? (
              <div style={{ padding: 20, color: '#64748B' }}>Loading pending approvals...</div>
            ) : pendingVisits.length === 0 ? (
              <div style={{ padding: 20, textAlign: 'center', color: '#94A3B8' }}>All submitted field visits have been reviewed!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {pendingVisits.map(v => (
                  <div
                    key={v.id}
                    style={{
                      padding: 16,
                      borderRadius: 8,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#4F46E5' }}>{v.job_number}</span>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>{v.customer_name}</span>
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        Executive: <strong>{v.staff_name || 'Unassigned'}</strong> | {v.address}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8 }}>
                      <button
                        onClick={() => handleApprove(v.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#10B981',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <CheckCircle size={14} /> Approve
                      </button>
                      <button
                        onClick={() => handleReject(v.id)}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 6,
                          border: 'none',
                          background: '#EF4444',
                          color: '#FFFFFF',
                          fontWeight: 700,
                          fontSize: 12,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 4
                        }}
                      >
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GPS & Attendance Alerts */}
          <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <AlertTriangle size={18} color="#D97706" /> Flagged Attendance & GPS Alerts
            </h3>

            {anomalies.length === 0 ? (
              <div style={{ padding: 16, color: '#94A3B8' }}>No active attendance or GPS anomalies flagged.</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {anomalies.map(a => (
                  <div key={a.id} style={{ padding: 12, borderRadius: 8, background: '#FEF3C7', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#92400E' }}>{a.staff_name} - {a.anomaly_type}</div>
                      <div style={{ fontSize: 12, color: '#78350F' }}>{a.description}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 800, color: '#B45309' }}>{new Date(a.detected_at).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Push Notification Broadcaster */}
        <div style={{ background: '#FFFFFF', borderRadius: 12, border: '1px solid #E2E8F0', padding: 20, height: 'fit-content' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Bell size={18} color="#4F46E5" /> Broadcast Executive Notification
          </h3>

          <form onSubmit={handleSendNotification}>
            <textarea
              rows={4}
              placeholder="Type announcement or reminder message to field executives..."
              value={notificationMsg}
              onChange={e => setNotificationMsg(e.target.value)}
              style={{
                width: '100%',
                padding: 10,
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                outline: 'none',
                marginBottom: 12,
                resize: 'none'
              }}
            />
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px',
                borderRadius: 8,
                border: 'none',
                background: '#4F46E5',
                color: '#FFF',
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              <Send size={15} /> Push Alert Notification
            </button>
          </form>

          {sentAlerts.length > 0 && (
            <div style={{ marginTop: 20 }}>
              <h4 style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase' }}>Recent Broadcast Log</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12, color: '#334155' }}>
                {sentAlerts.map((log, i) => (
                  <div key={i} style={{ background: '#F1F5F9', padding: 8, borderRadius: 6 }}>{log}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
