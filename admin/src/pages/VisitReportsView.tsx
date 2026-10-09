import React, { useState, useEffect } from 'react';
import { api, AssignedLocationJob } from '../services/api';
import { CheckCircle, XCircle, Clock, MapPin, Phone, Camera, AlertCircle, Search, Filter } from 'lucide-react';

export const VisitReportsView: React.FC = () => {
  const [visits, setVisits] = useState<AssignedLocationJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  useEffect(() => {
    loadVisits();
  }, []);

  const loadVisits = async () => {
    setLoading(true);
    try {
      const data = await api.getJobs();
      setVisits(data);
    } catch (e) {
      console.error('Failed to load visit reports', e);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (id: number, status: 'APPROVED' | 'REJECTED') => {
    try {
      await api.verifyJobVisit(id, status);
      await loadVisits();
    } catch (e) {
      alert('Failed to update visit verification status');
    }
  };

  const filteredVisits = visits.filter(v => {
    const matchesSearch = searchQuery === '' || 
      v.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      v.job_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (v.staff_name && v.staff_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      v.address.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (filterStatus === 'ALL') return true;
    if (filterStatus === 'PENDING_VERIFICATION') return v.verification_status === 'PENDING' && v.status === 'COMPLETED';
    if (filterStatus === 'APPROVED') return v.verification_status === 'APPROVED';
    if (filterStatus === 'REJECTED') return v.verification_status === 'REJECTED';
    if (filterStatus === 'COMPLETED') return v.status === 'COMPLETED';
    return true;
  });

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Header Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
            <MapPin size={24} color="#4F46E5" /> Visit Reports & Verification Center
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
            Review field visit proof, geotagged photos, merchant notes, and approve submitted visits.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={loadVisits}
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
            Refresh Visits
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 260 }}>
          <Search size={16} color="#94A3B8" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            placeholder="Search by Customer, Executive, Visit ID, or Address..."
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

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Filter size={16} color="#64748B" />
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            style={{
              padding: '10px 14px',
              borderRadius: 8,
              border: '1px solid #CBD5E1',
              fontSize: 13,
              fontWeight: 600,
              background: '#FFFFFF',
              color: '#1E293B',
              outline: 'none'
            }}
          >
            <option value="ALL">All Visits ({visits.length})</option>
            <option value="PENDING_VERIFICATION">Pending Approval</option>
            <option value="APPROVED">Approved Visits</option>
            <option value="REJECTED">Rejected Visits</option>
            <option value="COMPLETED">Completed Field Visits</option>
          </select>
        </div>
      </div>

      {/* Visit Reports Grid / Table */}
      {loading ? (
        <div style={{ padding: 40, textAlign: 'center', color: '#64748B' }}>Loading Visit Reports...</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {filteredVisits.map(v => {
            const isApproved = v.verification_status === 'APPROVED';
            const isRejected = v.verification_status === 'REJECTED';
            const isCompleted = v.status === 'COMPLETED';

            return (
              <div
                key={v.id}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 12,
                  border: `1px solid ${isApproved ? '#BBF7D0' : isRejected ? '#FECACA' : '#E2E8F0'}`,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  padding: 20,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}
              >
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                      <span style={{ fontSize: 11, fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '3px 8px', borderRadius: 4 }}>
                        {v.job_number}
                      </span>
                      <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: '6px 0 2px 0' }}>
                        {v.customer_name}
                      </h3>
                      <div style={{ fontSize: 12, color: '#64748B', display: 'flex', alignItems: 'center', gap: 4 }}>
                        <Phone size={12} /> {v.customer_phone}
                      </div>
                    </div>

                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 800,
                        padding: '4px 10px',
                        borderRadius: 12,
                        background: isApproved ? '#DCFCE7' : isRejected ? '#FEE2E2' : '#FEF3C7',
                        color: isApproved ? '#166534' : isRejected ? '#991B1B' : '#92400E'
                      }}
                    >
                      {v.verification_status || 'PENDING'}
                    </span>
                  </div>

                  <div style={{ fontSize: 13, color: '#334155', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <MapPin size={15} color="#64748B" /> {v.address}
                  </div>

                  <div style={{ background: '#F8FAFC', padding: 12, borderRadius: 8, marginBottom: 12, fontSize: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>Assigned Executive:</span>
                      <span style={{ fontWeight: 700, color: '#0F172A' }}>{v.staff_name || 'Unassigned'}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ color: '#64748B' }}>Scheduled Time:</span>
                      <span style={{ fontWeight: 600 }}>{new Date(v.scheduled_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                    {v.completion_time && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#64748B' }}>Visited Time:</span>
                        <span style={{ fontWeight: 600, color: '#059669' }}>{new Date(v.completion_time).toLocaleTimeString('en-IN', { timeStyle: 'short' })}</span>
                      </div>
                    )}
                  </div>

                  {v.outcome && (
                    <div style={{ fontSize: 12, color: '#475569', marginBottom: 12, background: '#F1F5F9', padding: 10, borderRadius: 6 }}>
                      <strong>Outcome Notes:</strong> {v.outcome}
                    </div>
                  )}

                  {v.photo_url && (
                    <div
                      onClick={() => setSelectedPhoto(v.photo_url || null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 8,
                        fontSize: 12,
                        color: '#4F46E5',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: 12,
                        background: '#EEF2FF',
                        padding: '8px 12px',
                        borderRadius: 6
                      }}
                    >
                      <Camera size={16} /> View Geo-Tagged Visit Photo
                    </div>
                  )}
                </div>

                <div style={{ paddingTop: 12, borderTop: '1px solid #F1F5F9', display: 'flex', gap: 10 }}>
                  <button
                    onClick={() => handleVerify(v.id, 'APPROVED')}
                    disabled={isApproved}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: isApproved ? '#E2E8F0' : '#10B981',
                      color: isApproved ? '#94A3B8' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: isApproved ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <CheckCircle size={15} /> Approve Visit
                  </button>

                  <button
                    onClick={() => handleVerify(v.id, 'REJECTED')}
                    disabled={isRejected}
                    style={{
                      flex: 1,
                      padding: '8px 12px',
                      borderRadius: 6,
                      border: 'none',
                      background: isRejected ? '#E2E8F0' : '#EF4444',
                      color: isRejected ? '#94A3B8' : '#FFFFFF',
                      fontWeight: 700,
                      fontSize: 12,
                      cursor: isRejected ? 'default' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 6
                    }}
                  >
                    <XCircle size={15} /> Reject
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Photo Modal */}
      {selectedPhoto && (
        <div
          onClick={() => setSelectedPhoto(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000
          }}
        >
          <div style={{ background: '#FFFFFF', padding: 16, borderRadius: 12, maxWidth: 500, width: '90%' }}>
            <img src={selectedPhoto} alt="Visit Proof" style={{ width: '100%', height: 'auto', borderRadius: 8 }} />
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{ padding: '8px 16px', background: '#0F172A', color: '#FFF', borderRadius: 6, border: 'none', cursor: 'pointer' }}
              >
                Close Proof
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
