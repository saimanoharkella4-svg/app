import { Platform } from 'react-native';
import { storage } from './storage';

// API Base URL configuration for ExtraHand FST mobile service
const resolveApiBaseUrl = () => {
  if (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  return 'http://127.0.0.1:8000/api';
};

const API_BASE_URL = resolveApiBaseUrl();

export interface StaffProfile {
  id: number;
  employee_code: string;
  name: string;
  phone: string;
  email: string;
  role: string;
  status: string;
  department?: string;
}

export interface ScheduleItem {
  id: number;
  schedule_code: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  geofence_radius_meters: number;
  planned_start_time: string;
  planned_end_time: string;
  time_window_display: string;
  status: string;
  date_display: string;
  service_type?: string;
}

export interface TrackingStatus {
  staff_id: number;
  employee_code: string;
  name: string;
  is_on_duty: boolean;
  tracking_status?: 'Active' | 'Inactive' | 'Location unavailable';
  session_id: number | null;
  login_time: string | null;
  working_duration: string;
  working_seconds: number;
  today_distance_km: number;
  last_gps_update: string | null;
  last_update_display?: string;
  last_accuracy: number | null;
  last_speed: number | null;
  last_latitude: number | null;
  last_longitude: number | null;
  // Marketing Executive Planned vs Actual Tracking:
  assigned_location?: string;
  assigned_address?: string;
  planned_schedule?: string;
  geofence_radius_meters?: number;
  distance_meters?: number | null;
  current_status?: string; // "At Assigned Location" | "Potential Deviation" | "Awaiting GPS Signal"
  is_deviated?: boolean;
  configured_interval_seconds?: number;
}

export interface TodaySummary {
  date: string;
  working_duration: string;
  working_minutes: number;
  distance_km: number;
  location_count: number;
  jobs_assigned: number;
  jobs_completed: number;
  status: string;
  tracking_status: string;
}

export interface LocationPayload {
  latitude: number;
  longitude: number;
  accuracy?: number;
  speed?: number;
  bearing?: number;
  altitude?: number;
  battery_level?: number;
  timestamp: string;
  is_mock?: boolean;
  client_id?: string;
}

export interface RouteResponse {
  session_id: number;
  staff_id: number;
  staff_name: string;
  employee_code: string;
  date: string;
  login_time: string;
  logout_time: string | null;
  total_distance_km: number;
  status: string;
  points: {
    id: number;
    latitude: number;
    longitude: number;
    accuracy: number | null;
    speed: number | null;
    recorded_at: string;
    is_anomaly: boolean;
  }[];
}

export const mobileStorage = {
  getToken: () => storage.getItem('fst_staff_token') || '',
  setToken: (t: string) => storage.setItem('fst_staff_token', t),
  clearToken: () => storage.removeItem('fst_staff_token')
};

const getHeaders = () => {
  const token = mobileStorage.getToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

export const mobileApi = {
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
    mobileStorage.setToken(data.access_token);
    return data;
  },

  async getProfile(): Promise<StaffProfile> {
    const res = await fetch(`${API_BASE_URL}/auth/me`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Unauthenticated');
    return res.json();
  },

  async startDuty(params: {
    start_latitude?: number;
    start_longitude?: number;
    start_address?: string;
    battery_level?: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/tracking/start`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to start duty session');
    return res.json();
  },

  async stopDuty(params: {
    end_latitude?: number;
    end_longitude?: number;
    end_address?: string;
    battery_level?: number;
  }) {
    const res = await fetch(`${API_BASE_URL}/tracking/stop`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error('Failed to end duty session');
    return res.json();
  },

  async toggleBreak() {
    const res = await fetch(`${API_BASE_URL}/tracking/break`, {
      method: 'POST',
      headers: getHeaders()
    });
    if (!res.ok) throw new Error('Failed to toggle break status');
    return res.json();
  },

  async uploadSingleLocation(location: LocationPayload) {
    const res = await fetch(`${API_BASE_URL}/tracking/location`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(location)
    });
    if (!res.ok) throw new Error('Failed to upload location');
    return res.json();
  },

  async uploadBatch(locations: LocationPayload[]) {
    const res = await fetch(`${API_BASE_URL}/tracking/batch`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ locations })
    });
    if (!res.ok) throw new Error('Failed to upload batch');
    return res.json();
  },

  async getTrackingStatus(): Promise<TrackingStatus> {
    const res = await fetch(`${API_BASE_URL}/tracking/status`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch tracking status');
    return res.json();
  },

  async getTodaySummary(): Promise<TodaySummary> {
    const res = await fetch(`${API_BASE_URL}/tracking/today`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch today summary');
    return res.json();
  },

  async getRoute(sessionId?: number): Promise<RouteResponse> {
    let url = `${API_BASE_URL}/tracking/route`;
    if (sessionId) url += `?session_id=${sessionId}`;
    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch route');
    return res.json();
  },

  async getTodaySchedule(): Promise<ScheduleItem> {
    const res = await fetch(`${API_BASE_URL}/schedule/today`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch today schedule');
    return res.json();
  },

  async getMySchedules(): Promise<ScheduleItem[]> {
    const res = await fetch(`${API_BASE_URL}/schedule/my-schedules`, { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch schedules');
    return res.json();
  },

  async updateScheduleStatus(schedule_id: number, status: string, notes?: string) {
    const res = await fetch(`${API_BASE_URL}/schedule/${schedule_id}/status`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify({ status, notes })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update schedule status');
    }
    return res.json();
  },

  async changePassword(current_password: string, new_password: string) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ current_password, new_password })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'Failed to update password');
    }
    return res.json();
  }
};
