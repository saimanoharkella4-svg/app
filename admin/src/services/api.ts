const resolveApiBaseUrl = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  if (typeof process !== 'undefined' && process.env?.VITE_API_URL) {
    return process.env.VITE_API_URL;
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export interface StaffUser {
  id: number;
  employee_code: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  department?: string;
  region?: string;
}

export interface LiveStaffItem {
  staff_id: number;
  employee_code: string;
  name: string;
  role: string;
  status: string;
  session_id: number | null;
  login_time: string | null;
  working_duration: string | null;
  working_minutes: number | null;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  speed: number | null;
  battery_level: number | null;
  last_update: string | null;
  today_distance_km: number;
  jobs_today: number;
  jobs_completed_today: number;
  current_area: string | null;
}

export interface OverviewStats {
  active_staff_count: number;
  offline_staff_count: number;
  total_staff_count: number;
  jobs_today_count: number;
  completed_jobs_count: number;
  total_distance_today_km: number;
  average_hours_today: number;
}

export interface LocationPoint {
  id: number;
  client_id?: string;
  latitude: number;
  longitude: number;
  accuracy: number | null;
  speed: number | null;
  bearing: number | null;
  altitude: number | null;
  battery_level: number | null;
  is_anomaly: boolean;
  anomaly_reason: string | null;
  recorded_at: string;
}

export interface RouteData {
  session_id: number;
  staff_id: number;
  staff_name: string;
  employee_code: string;
  date: string;
  login_time: string;
  logout_time: string | null;
  total_distance_km: number;
  status: string;
  points: LocationPoint[];
  start_point?: LocationPoint;
  end_point?: LocationPoint;
}

export interface DailySummaryItem {
  id: number;
  staff_id: number;
  staff_name: string;
  employee_code: string;
  date: string;
  login_time: string | null;
  logout_time: string | null;
  working_minutes: number;
  working_hours_formatted: string;
  distance_km: number;
  location_count: number;
  jobs_assigned: number;
  jobs_completed: number;
}

export interface WeeklyDayBreakdown {
  day_name: string;
  date: string;
  working_hours_formatted: string;
  working_minutes: number;
  distance_km: number;
  jobs_completed: number;
}

export interface WeeklySummaryItem {
  id: number;
  staff_id: number;
  staff_name: string;
  employee_code: string;
  week_start: string;
  week_end: string;
  days_worked: number;
  total_hours: number;
  total_hours_formatted: string;
  total_distance: number;
  jobs_assigned: number;
  jobs_completed: number;
  total_jobs_completed?: number;
  total_locations_recorded?: number;
  average_daily_distance: number;
  average_daily_hours: number;
  daily_breakdown?: WeeklyDayBreakdown[];
}

export type DailySummaryRecord = DailySummaryItem;
export type WeeklySummaryRecord = WeeklySummaryItem;

export interface AssignedLocationJob {
  id: number;
  job_number: string;
  customer_name: string;
  customer_phone: string;
  service_type: string;
  address: string;
  latitude: number;
  longitude: number;
  scheduled_time: string;
  status: string;
  staff_id: number | null;
  staff_name: string | null;
  arrival_time: string | null;
  completion_time: string | null;
  time_on_site_minutes: number | null;
  notes: string | null;
  photo_url?: string | null;
  outcome?: string | null;
  verification_status?: string;
  follow_up_required?: boolean;
  region?: string;
}

export type ExtraHandJob = AssignedLocationJob;

export interface AnomalyItem {
  id: number;
  staff_id: number;
  staff_name: string;
  session_id: number;
  anomaly_type: string;
  description: string;
  severity: string;
  detected_at: string;
  reviewed: boolean;
}

export type GpsAnomalyItem = AnomalyItem;

// Token storage helper
export const getAuthToken = () => localStorage.getItem('fst_admin_token') || '';
export const setAuthToken = (token: string) => localStorage.setItem('fst_admin_token', token);
export const removeAuthToken = () => localStorage.removeItem('fst_admin_token');

const authHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const api = {
  async login(employee_code: string, password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ employee_code, password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Login failed');
    }
    const data = await res.json();
    setAuthToken(data.access_token);
    return data;
  },

  async getProfile(): Promise<StaffUser> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Not authenticated');
    return res.json();
  },

  async getOverviewStats(): Promise<OverviewStats> {
    const res = await fetch(`${API_BASE_URL}/admin/overview-stats`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch overview stats');
    return res.json();
  },

  async getLiveStaff(): Promise<LiveStaffItem[]> {
    const res = await fetch(`${API_BASE_URL}/admin/live-staff`, {
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to fetch live staff');
    return res.json();
  },

  async getStaffRoute(staffId: number, targetDate?: string, sessionId?: number): Promise<RouteData> {
    let url = `${API_BASE_URL}/admin/staff/${staffId}/route`;
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    if (sessionId) params.append('session_id', String(sessionId));
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch route');
    return res.json();
  },

  async listStaff(): Promise<StaffUser[]> {
    const res = await fetch(`${API_BASE_URL}/staff`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch staff list');
    const data = await res.json();
    return data.items;
  },

  async createStaff(data: Partial<StaffUser> & { password: string }) {
    const res = await fetch(`${API_BASE_URL}/staff`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to create staff');
    }
    return res.json();
  },

  async getDailyReports(targetDate?: string, staffId?: number): Promise<DailySummaryItem[]> {
    let url = `${API_BASE_URL}/reports/daily`;
    const params = new URLSearchParams();
    if (targetDate) params.append('target_date', targetDate);
    if (staffId) params.append('staff_id', String(staffId));
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch daily reports');
    return res.json();
  },

  async getDailySummaries(targetDate?: string, staffId?: number): Promise<DailySummaryItem[]> {
    return this.getDailyReports(targetDate, staffId);
  },

  async getWeeklyReports(weekStart?: string, staffId?: number): Promise<WeeklySummaryItem[]> {
    let url = `${API_BASE_URL}/reports/weekly`;
    const params = new URLSearchParams();
    if (weekStart) params.append('week_start', weekStart);
    if (staffId) params.append('staff_id', String(staffId));
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch weekly reports');
    return res.json();
  },

  async getWeeklySummaries(weekStart?: string, staffId?: number): Promise<WeeklySummaryItem[]> {
    return this.getWeeklyReports(weekStart, staffId);
  },

  async importExcelSchedules(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const token = getAuthToken();
    const res = await fetch(`${API_BASE_URL}/schedule/import-excel`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      body: formData
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to import Excel file');
    }
    return res.json();
  },

  getExcelTemplateUrl() {
    return `${API_BASE_URL}/schedule/download-template`;
  },

  async assignLocation(data: {
    staff_id: number;
    location_name: string;
    address: string;
    scheduled_time: string;
    service_type?: string;
    notes?: string;
  }) {
    const res = await fetch(`${API_BASE_URL}/schedule/assign`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to assign location');
    }
    return res.json();
  },

  async getJobs(): Promise<AssignedLocationJob[]> {
    const res = await fetch(`${API_BASE_URL}/admin/jobs`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch jobs');
    return res.json();
  },

  async createJob(jobData: any) {
    const res = await fetch(`${API_BASE_URL}/admin/jobs`, {
      method: 'POST',
      headers: authHeaders(),
      body: JSON.stringify(jobData)
    });
    if (!res.ok) throw new Error('Failed to create job');
    return res.json();
  },

  async getAnomalies(): Promise<AnomalyItem[]> {
    const res = await fetch(`${API_BASE_URL}/admin/anomalies`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch anomalies');
    return res.json();
  },

  getExcelExportUrl(targetDate?: string) {
    let url = `${API_BASE_URL}/reports/export/excel`;
    if (targetDate) url += `?target_date=${targetDate}`;
    return url;
  },

  getPdfExportUrl(targetDate?: string) {
    let url = `${API_BASE_URL}/reports/export/pdf`;
    if (targetDate) url += `?target_date=${targetDate}`;
    return url;
  },

  getIndividualStaffWeeklyPdfUrl(staffId: number, weekStart?: string) {
    let url = `${API_BASE_URL}/reports/staff/${staffId}/weekly/pdf`;
    if (weekStart) url += `?week_start=${weekStart}`;
    return url;
  },

  async verifyJobVisit(id: number, verificationStatus: 'APPROVED' | 'REJECTED', notes?: string) {
    let url = `${API_BASE_URL}/admin/jobs/${id}/verify?status_update=${verificationStatus}`;
    if (notes) url += `&notes=${encodeURIComponent(notes)}`;
    const res = await fetch(url, {
      method: 'PUT',
      headers: authHeaders()
    });
    if (!res.ok) throw new Error('Failed to update visit verification');
    return res.json();
  },

  async getAttendanceSTC() {
    const res = await fetch(`${API_BASE_URL}/admin/attendance-stc`, { headers: authHeaders() });
    if (!res.ok) throw new Error('Failed to fetch attendance STC summary');
    return res.json();
  }
};
