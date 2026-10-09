import React, { useState } from 'react';
import { AssignedLocationJob, api, StaffUser } from '../services/api';
import { 
  MapPin, Clock, Calendar, CheckCircle2, 
  AlertCircle, Plus, Filter, UserCheck, ShieldCheck, X,
  FileSpreadsheet, Upload, Download
} from 'lucide-react';

interface JobsViewProps {
  jobs: AssignedLocationJob[];
  staffList?: StaffUser[];
  onRefresh?: () => void;
}

export const JobsView: React.FC<JobsViewProps> = ({ jobs, staffList = [], onRefresh }) => {
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [staffFilter, setStaffFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL'); // ALL, PAST_7_DAYS, TODAY, UPCOMING
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);

  // Form state for assigning new location
  const [assignForm, setAssignForm] = useState({
    staff_id: staffList[0]?.id || 2,
    location_name: '',
    address: '',
    scheduled_time: '',
    service_type: 'Field Visit & Merchant Verification',
    notes: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Excel Import state
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  // Date filtering logic
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const past7DaysStart = new Date(todayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
  const upcomingEnd = new Date(todayStart.getTime() + 7 * 24 * 60 * 60 * 1000);

  const filteredJobs = jobs.filter((j) => {
    // Status Filter
    if (statusFilter !== 'ALL' && j.status !== statusFilter) return false;

    // Staff Filter
    if (staffFilter !== 'ALL' && String(j.staff_id) !== staffFilter) return false;

    // Date Range Filter
    const jobDate = new Date(j.scheduled_time);
    if (dateRangeFilter === 'PAST_7_DAYS') {
      return jobDate >= past7DaysStart && jobDate < todayStart;
    }
    if (dateRangeFilter === 'TODAY') {
      const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return jobDate >= todayStart && jobDate < tomorrow;
    }
    if (dateRangeFilter === 'UPCOMING') {
      const tomorrow = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000);
      return jobDate >= tomorrow && jobDate <= upcomingEnd;
    }
    return true;
  });

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignForm.location_name || !assignForm.address || !assignForm.scheduled_time) {
      alert('Please fill in location name, address, and scheduled date & time.');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.assignLocation({
        staff_id: Number(assignForm.staff_id),
        location_name: assignForm.location_name,
        address: assignForm.address,
        scheduled_time: new Date(assignForm.scheduled_time).toISOString(),
        service_type: assignForm.service_type,
        notes: assignForm.notes
      });
      setIsAssignModalOpen(false);
      setAssignForm({
        staff_id: staffList[0]?.id || 2,
        location_name: '',
        address: '',
        scheduled_time: '',
        service_type: 'Field Visit & Merchant Verification',
        notes: ''
      });
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to assign location');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExcelImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!excelFile) {
      alert('Please select an Excel (.xlsx) or CSV file to import.');
      return;
    }

    setIsImporting(true);
    setImportResult(null);
    try {
      const res = await api.importExcelSchedules(excelFile);
      setImportResult(res.message || 'Excel file imported successfully!');
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to import Excel file');
    } finally {
      setIsImporting(false);
    }
  };

  // Metrics
  const totalCount = filteredJobs.length;
  const completedCount = filteredJobs.filter((j) => j.status === 'COMPLETED').length;
  const inProgressCount = filteredJobs.filter((j) => j.status === 'IN_PROGRESS').length;
  const pendingCount = filteredJobs.filter((j) => j.status === 'ASSIGNED' || j.status === 'PENDING').length;

  return (
    <div style={{ padding: '24px 32px' }}>
      {/* Top Header & New Assignment / Excel Action Buttons */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em', margin: 0 }}>
            Assigned Field Locations & Schedule Monitoring
          </h1>
          <p style={{ fontSize: 13, color: '#64748B', marginTop: 4, margin: 0 }}>
            Track assigned visit locations for each marketing executive across past 7 days, today, and upcoming schedule.
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => { setImportResult(null); setIsExcelModalOpen(true); }}
            className="btn-secondary"
            style={{ padding: '10px 16px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, borderColor: '#059669', color: '#047857', background: '#ECFDF5' }}
          >
            <FileSpreadsheet size={16} />
            Import Excel / Bulk Assign
          </button>

          <button
            onClick={() => setIsAssignModalOpen(true)}
            className="btn-primary"
            style={{ padding: '10px 18px', fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Plus size={16} />
            Assign New Location Visit
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14, marginBottom: 20 }}>
        <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: 12, padding: '14px 18px', boxShadow: '0 2px 8px rgba(0,0,0,0.02)' }}>
          <div style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>Total Assigned Locations</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', marginTop: 4 }}>{totalCount}</div>
        </div>

        <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#166534', fontWeight: 700 }}>Visited & Verified</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#059669', marginTop: 4 }}>{completedCount}</div>
        </div>

        <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#92400E', fontWeight: 700 }}>Currently En Route / On Site</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#D97706', marginTop: 4 }}>{inProgressCount}</div>
        </div>

        <div style={{ background: '#EEF2FF', border: '1px solid #C7D2FE', borderRadius: 12, padding: '14px 18px' }}>
          <div style={{ fontSize: 12, color: '#3730A3', fontWeight: 700 }}>Scheduled / Pending Visit</div>
          <div style={{ fontSize: 22, fontWeight: 900, color: '#4338CA', marginTop: 4 }}>{pendingCount}</div>
        </div>
      </div>

      {/* Filter Row: Executive, Date Window, Status */}
      <div
        style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: 14,
          padding: '14px 20px',
          marginBottom: 20,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Executive Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Executive:</span>
            <select
              value={staffFilter}
              onChange={(e) => setStaffFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F172A',
                background: '#F8FAFC',
                outline: 'none'
              }}
            >
              <option value="ALL">All Executives</option>
              {staffList.filter(s => s.role !== 'ADMIN').map((s) => (
                <option key={s.id} value={String(s.id)}>
                  {s.name} ({s.employee_code})
                </option>
              ))}
            </select>
          </div>

          {/* Date Window Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>Time Period:</span>
            <select
              value={dateRangeFilter}
              onChange={(e) => setDateRangeFilter(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                color: '#0F172A',
                background: '#F8FAFC',
                outline: 'none'
              }}
            >
              <option value="ALL">Full Schedule History</option>
              <option value="PAST_7_DAYS">Past 7 Days (Before 1 Week Monitoring)</option>
              <option value="TODAY">Today Only</option>
              <option value="UPCOMING">Upcoming 7 Days</option>
            </select>
          </div>
        </div>

        {/* Status Filter Chips */}
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'ALL', label: 'All Status' },
            { id: 'COMPLETED', label: 'Visited ✓' },
            { id: 'IN_PROGRESS', label: 'On Site' },
            { id: 'ASSIGNED', label: 'Pending' }
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setStatusFilter(item.id)}
              style={{
                fontSize: 12,
                fontWeight: statusFilter === item.id ? 800 : 600,
                padding: '6px 12px',
                borderRadius: 8,
                border: statusFilter === item.id ? '1px solid #4F46E5' : '1px solid #E2E8F0',
                background: statusFilter === item.id ? '#EEF2FF' : '#FFFFFF',
                color: statusFilter === item.id ? '#4338CA' : '#475569',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Location Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: 16 }}>
        {filteredJobs.map((job) => {
          const isCompleted = job.status === 'COMPLETED';
          const isInProgress = job.status === 'IN_PROGRESS';
          const schedDate = new Date(job.scheduled_time);
          const dateStr = schedDate.toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
          const timeStr = schedDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

          return (
            <div
              key={job.id}
              className="glass-panel"
              style={{
                padding: 18,
                backgroundColor: '#FFFFFF',
                borderColor: isCompleted ? '#A7F3D0' : isInProgress ? '#FDE68A' : '#E2E8F0',
                borderRadius: 14
              }}
            >
              {/* Card Header: Code & Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontWeight: 800,
                    fontSize: 11,
                    color: '#4338CA',
                    background: '#EEF2FF',
                    padding: '3px 8px',
                    borderRadius: 6,
                    border: '1px solid #C7D2FE'
                  }}
                >
                  {job.job_number}
                </span>

                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: isCompleted ? '#ECFDF5' : isInProgress ? '#FFFBEB' : '#F1F5F9',
                    color: isCompleted ? '#059669' : isInProgress ? '#D97706' : '#475569',
                    border: `1px solid ${isCompleted ? '#A7F3D0' : isInProgress ? '#FDE68A' : '#CBD5E1'}`
                  }}
                >
                  {isCompleted ? 'VISITED & VERIFIED' : isInProgress ? 'CURRENTLY ON SITE' : 'SCHEDULED PENDING'}
                </span>
              </div>

              {/* Location Name & Type */}
              <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A', marginBottom: 4 }}>
                {job.customer_name}
              </div>
              <div style={{ fontSize: 12, color: '#4F46E5', fontWeight: 600, marginBottom: 12 }}>
                {job.service_type}
              </div>

              {/* Details Body */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 12.5, color: '#475569', margin: '10px 0' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                  <MapPin size={15} color="#64748B" style={{ marginTop: 2, flexShrink: 0 }} />
                  <span>{job.address}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Calendar size={14} color="#64748B" />
                  <span>Scheduled: <b style={{ color: '#0F172A' }}>{dateStr} at {timeStr}</b></span>
                </div>

                {/* Arrival / Telemetry Verification Proof */}
                {isCompleted && (
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: 8,
                      padding: '8px 10px',
                      fontSize: 11.5,
                      color: '#166534',
                      fontWeight: 600,
                      marginTop: 4,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6
                    }}
                  >
                    <CheckCircle2 size={15} color="#10B981" />
                    <span>
                      Visited at {job.arrival_time ? new Date(job.arrival_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : timeStr} • {job.time_on_site_minutes || 45} mins on site
                    </span>
                  </div>
                )}
              </div>

              {/* Footer: Assigned Staff Member */}
              <div
                style={{
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: 10,
                  marginTop: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: 12
                }}
              >
                <span style={{ color: '#64748B', fontWeight: 600 }}>Assigned Executive:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: '50%',
                      background: '#EEF2FF',
                      color: '#4338CA',
                      fontWeight: 800,
                      fontSize: 10,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: '1px solid #C7D2FE'
                    }}
                  >
                    {job.staff_name ? job.staff_name.charAt(0) : '?'}
                  </div>
                  <span style={{ fontWeight: 800, color: '#0F172A' }}>
                    {job.staff_name || 'Unassigned'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign Location Visit Modal */}
      {isAssignModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 520,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Assign Target Location Visit
              </h2>
              <button
                onClick={() => setIsAssignModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Select Field Executive *
                </label>
                <select
                  value={assignForm.staff_id}
                  onChange={(e) => setAssignForm({ ...assignForm, staff_id: Number(e.target.value) })}
                  className="input-field"
                  style={{ width: '100%', height: 40 }}
                >
                  {staffList.filter(s => s.role !== 'ADMIN').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employee_code}) - {s.department}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Target Location / Place Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Madhapur Commercial Hub / Hitec Cyber Towers"
                  value={assignForm.location_name}
                  onChange={(e) => setAssignForm({ ...assignForm, location_name: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Full Address & Area *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Plot 18, Inorbit Mall Road, Madhapur, Hyderabad"
                  value={assignForm.address}
                  onChange={(e) => setAssignForm({ ...assignForm, address: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Scheduled Date & Time *
                </label>
                <input
                  type="datetime-local"
                  value={assignForm.scheduled_time}
                  onChange={(e) => setAssignForm({ ...assignForm, scheduled_time: e.target.value })}
                  className="input-field"
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 6 }}>
                  Visit Purpose / Service Type
                </label>
                <input
                  type="text"
                  placeholder="e.g. Field Merchant Verification / QR Audit"
                  value={assignForm.service_type}
                  onChange={(e) => setAssignForm({ ...assignForm, service_type: e.target.value })}
                  className="input-field"
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsAssignModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary"
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  {isSubmitting ? 'Assigning...' : 'Confirm Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Excel Bulk Import Modal */}
      {isExcelModalOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 23, 42, 0.5)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 16,
              padding: 28,
              width: '100%',
              maxWidth: 540,
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid #E2E8F0'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <FileSpreadsheet size={22} color="#059669" />
                <h2 style={{ fontSize: 18, fontWeight: 800, color: '#0F172A', margin: 0 }}>
                  Bulk Location Excel Import
                </h2>
              </div>
              <button
                onClick={() => setIsExcelModalOpen(false)}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            <p style={{ fontSize: 12.5, color: '#475569', lineHeight: 1.5, marginBottom: 16 }}>
              Upload an Excel (.xlsx) or CSV file with bulk location assignments. Match staff using their <b>employee_code</b> (e.g. <code>EMP101</code>).
            </p>

            {/* Template Download Card */}
            <div
              style={{
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 12,
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 20
              }}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 800, color: '#166534' }}>Download Sample Template</div>
                <div style={{ fontSize: 11, color: '#047857' }}>Pre-formatted .xlsx file with column headings</div>
              </div>

              <a
                href={api.getExcelTemplateUrl()}
                target="_blank"
                rel="noreferrer"
                className="btn-emerald"
                style={{ padding: '7px 14px', fontSize: 12, textDecoration: 'none' }}
              >
                <Download size={14} />
                Download Template
              </a>
            </div>

            {/* Result Alert */}
            {importResult && (
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  color: '#065F46',
                  padding: '10px 14px',
                  borderRadius: 10,
                  fontSize: 12.5,
                  fontWeight: 700,
                  marginBottom: 16
                }}
              >
                ✓ {importResult}
              </div>
            )}

            {/* Upload Form */}
            <form onSubmit={handleExcelImport} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#475569', marginBottom: 8 }}>
                  Select File (.xlsx, .xls, .csv) *
                </label>
                <input
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  style={{
                    width: '100%',
                    padding: 10,
                    borderRadius: 10,
                    border: '1.5px dashed #CBD5E1',
                    background: '#F8FAFC',
                    fontSize: 13,
                    color: '#0F172A',
                    cursor: 'pointer'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end', marginTop: 10 }}>
                <button
                  type="button"
                  onClick={() => setIsExcelModalOpen(false)}
                  className="btn-secondary"
                  style={{ padding: '8px 16px', fontSize: 13 }}
                >
                  Close
                </button>
                <button
                  type="submit"
                  disabled={isImporting || !excelFile}
                  className="btn-emerald"
                  style={{ padding: '8px 20px', fontSize: 13 }}
                >
                  <Upload size={15} />
                  {isImporting ? 'Importing File...' : 'Upload & Import'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
