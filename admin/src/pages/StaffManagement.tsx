import React, { useState } from 'react';
import { StaffUser, api } from '../services/api';
import { UserPlus, Search, Phone, Mail, Shield, CheckCircle } from 'lucide-react';

interface StaffManagementProps {
  staffList: StaffUser[];
  onRefresh: () => void;
  onViewRoute: (id: number) => void;
}

export const StaffManagement: React.FC<StaffManagementProps> = ({ staffList, onRefresh, onViewRoute }) => {
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    employee_code: '',
    name: '',
    phone: '',
    email: '',
    password: 'Password@123',
    role: 'USER',
    department: 'Field Services'
  });
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const filtered = staffList.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.employee_code.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await api.createStaff(formData);
      setShowAddModal(false);
      setFormData({
        employee_code: '',
        name: '',
        phone: '',
        email: '',
        password: 'Password@123',
        role: 'FIELD_STAFF',
        department: 'Field Services'
      });
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create staff');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
            Field Staff Directory
          </h1>
          <p style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
            Manage service providers, tracking permissions, and credentials across Hyderabad zones
          </p>
        </div>

        <button onClick={() => setShowAddModal(true)} className="btn-primary">
          <UserPlus size={16} /> Add Field Staff
        </button>
      </div>

      {/* Search Bar */}
      <div style={{ marginBottom: 16, maxWidth: 360 }}>
        <input
          type="text"
          placeholder="Search by name, ID or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input-field"
          style={{ width: '100%' }}
        />
      </div>

      {/* Table */}
      <div className="glass-panel" style={{ overflow: 'hidden' }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>Employee Code</th>
              <th>Name</th>
              <th>Phone</th>
              <th>Email</th>
              <th>Department</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((staff) => (
              <tr key={staff.id}>
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: '#38BDF8' }}>
                    {staff.employee_code}
                  </span>
                </td>
                <td>
                  <div style={{ fontWeight: 700, color: 'var(--text-main)' }}>{staff.name}</div>
                </td>
                <td>
                  <span style={{ color: '#CBD5E1' }}>{staff.phone}</span>
                </td>
                <td>
                  <span style={{ color: '#94A3B8' }}>{staff.email}</span>
                </td>
                <td>
                  <span style={{ color: '#CBD5E1' }}>{staff.department || 'Field Services'}</span>
                </td>
                <td>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                      background:
                        staff.role === 'SUPER_ADMIN'
                          ? '#FEF3C7'
                          : staff.role === 'OPERATIONS_MANAGER'
                          ? '#EFF6FF'
                          : '#F1F5F9',
                      color:
                        staff.role === 'SUPER_ADMIN'
                          ? '#B45309'
                          : staff.role === 'OPERATIONS_MANAGER'
                          ? '#1D4ED8'
                          : '#475569',
                      border:
                        staff.role === 'SUPER_ADMIN'
                          ? '1px solid #FDE68A'
                          : staff.role === 'OPERATIONS_MANAGER'
                          ? '1px solid #BFDBFE'
                          : '1px solid #E2E8F0',
                    }}
                  >
                    {staff.role === 'SUPER_ADMIN'
                      ? 'Super Admin'
                      : staff.role === 'OPERATIONS_MANAGER'
                      ? 'Ops Manager'
                      : 'Field Staff'}
                  </span>
                </td>
                <td>
                  <span className={`badge ${staff.status === 'ACTIVE' ? 'badge-active' : 'badge-offline'}`}>
                    {staff.status}
                  </span>
                </td>
                <td>
                  <button
                    onClick={() => onViewRoute(staff.id)}
                    className="btn-secondary"
                    style={{ padding: '4px 10px', fontSize: 11 }}
                  >
                    View Route
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5000
          }}
        >
          <div className="glass-panel" style={{ width: 440, padding: 24, background: '#0F172A' }}>
            <h3 style={{ fontSize: 18, fontWeight: 800, color: '#FFFFFF', marginBottom: 16 }}>
              Add New Field Staff
            </h3>

            {errorMsg && (
              <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#F87171', fontSize: 12, marginBottom: 12 }}>
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Employee Code</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. EMP106"
                  value={formData.employee_code}
                  onChange={(e) => setFormData({ ...formData, employee_code: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Phone Number</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. +91 98765 43299"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="ramesh@cognitrack.io"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>System Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="input-field"
                  style={{ width: '100%', background: '#FFFFFF', cursor: 'pointer' }}
                >
                  <option value="USER">Field Staff (Mobile App & Tracking)</option>
                  <option value="ADMIN">System Admin (Full Console Access)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, color: '#94A3B8', display: 'block', marginBottom: 4 }}>Department / Service Category</label>
                <input
                  type="text"
                  placeholder="HVAC, Plumbing, Electrical..."
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="input-field"
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 12 }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                >
                  {isSubmitting ? 'Creating...' : 'Create Staff'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
