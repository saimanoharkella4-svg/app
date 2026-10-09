import React, { useState } from 'react';
import { api, StaffUser } from '../services/api';
import { FileSpreadsheet, UploadCloud, CheckCircle, AlertTriangle, Download, ArrowRight, UserCheck } from 'lucide-react';

interface ExcelImportViewProps {
  staffList: StaffUser[];
  onImportSuccess: () => void;
}

export const ExcelImportView: React.FC<ExcelImportViewProps> = ({ staffList, onImportSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const [targetExecutiveId, setTargetExecutiveId] = useState<number | ''>('');
  const [visitDeadline, setVisitDeadline] = useState<string>('2026-10-10T10:00');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert('Please select an Excel (.xlsx or .csv) file to import.');
      return;
    }
    setIsUploading(true);
    setImportResult(null);
    try {
      const res = await api.importExcelSchedules(selectedFile);
      setImportResult(res);
      onImportSuccess();
    } catch (e: any) {
      alert(e.message || 'Import failed');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div style={{ padding: 28, background: '#F8FAFC', minHeight: 'calc(100vh - 64px)' }}>
      {/* Title */}
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileSpreadsheet size={24} color="#4F46E5" /> Excel Import & Bulk Location Assignment
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', margin: '4px 0 0 0' }}>
          Upload merchant & customer location Excel workbooks, validate columns, and assign target visits to marketing executives.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* Upload Card */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginTop: 0, marginBottom: 16 }}>
            Step 1: Upload Excel Workbook
          </h3>

          <div
            style={{
              border: '2px dashed #CBD5E1',
              borderRadius: 12,
              padding: 32,
              textAlign: 'center',
              background: '#F8FAFC',
              cursor: 'pointer',
              marginBottom: 20
            }}
          >
            <UploadCloud size={40} color="#4F46E5" style={{ marginBottom: 12 }} />
            <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
              {selectedFile ? selectedFile.name : 'Choose or drop Excel file here'}
            </div>
            <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
              Supports .xlsx, .xls, .csv files up to 10MB
            </div>

            <input
              type="file"
              accept=".xlsx, .xls, .csv"
              onChange={handleFileChange}
              style={{ marginTop: 16 }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#334155', marginBottom: 6 }}>
              Default Assignee Executive (Optional Batch Override):
            </label>
            <select
              value={targetExecutiveId}
              onChange={e => setTargetExecutiveId(e.target.value ? Number(e.target.value) : '')}
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 8,
                border: '1px solid #CBD5E1',
                fontSize: 13,
                fontWeight: 600,
                outline: 'none',
                background: '#FFFFFF'
              }}
            >
              <option value="">Auto-assign based on Excel column</option>
              {staffList.filter(s => s.role !== 'ADMIN').map(s => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.employee_code}) - {s.region || 'Hyderabad'}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading}
            style={{
              width: '100%',
              padding: '12px',
              borderRadius: 8,
              border: 'none',
              background: isUploading ? '#94A3B8' : '#4F46E5',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 700,
              cursor: isUploading ? 'default' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            {isUploading ? 'Validating & Importing...' : 'Validate & Batch Import Locations'} <ArrowRight size={16} />
          </button>
        </div>

        {/* Template & Specs Card */}
        <div style={{ background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(0,0,0,0.03)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', margin: 0 }}>
              Excel Template Specifications
            </h3>
            <a
              href={api.getExcelTemplateUrl()}
              download
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                borderRadius: 6,
                background: '#EEF2FF',
                color: '#4338CA',
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
                border: '1px solid #C7D2FE'
              }}
            >
              <Download size={14} /> Download Sample Excel
            </a>
          </div>

          <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.5 }}>
            Your Excel file must contain the following required headers for automated validation and coordinate geocoding:
          </p>

          <div style={{ background: '#F8FAFC', padding: 14, borderRadius: 8, fontSize: 12, fontFamily: 'monospace', color: '#334155', border: '1px solid #E2E8F0', marginBottom: 16 }}>
            <strong>Customer Name | Phone | Service Type | Address | Latitude | Longitude | Scheduled Time</strong>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 12, color: '#475569' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="#10B981" /> <strong>Validation:</strong> Checks missing headers, lat/lon bounds, and phone formats.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="#10B981" /> <strong>Duplicate Removal:</strong> Ignores duplicate location addresses for the same date.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <CheckCircle size={15} color="#10B981" /> <strong>Notification:</strong> Pushes new target assignments directly to field app.
            </div>
          </div>
        </div>
      </div>

      {/* Import Result Table */}
      {importResult && (
        <div style={{ marginTop: 28, background: '#FFFFFF', padding: 24, borderRadius: 12, border: '1px solid #DCFCE7' }}>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: '#166534', marginTop: 0, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
            <CheckCircle size={20} color="#166534" /> Import Complete ({importResult.imported_count || importResult.length || 0} Locations Created)
          </h3>
          <p style={{ fontSize: 13, color: '#334155', margin: 0 }}>
            Location schedules have been successfully validated and assigned to the selected marketing executives!
          </p>
        </div>
      )}
    </div>
  );
};
