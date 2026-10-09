import React, { useState, useEffect } from 'react';
import { 
  api, StaffUser, LiveStaffItem, OverviewStats, 
  RouteData, ExtraHandJob, removeAuthToken, getAuthToken 
} from './services/api';
import { adminWs } from './services/websocket';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { StatCard } from './components/StatCard';
import { LiveMap } from './components/LiveMap';
import { RouteMap } from './components/RouteMap';
import { MobileSimulator } from './components/MobileSimulator';
import { StaffManagement } from './pages/StaffManagement';
import { JobsView } from './pages/JobsView';
import { ReportsView } from './pages/ReportsView';
import { AnomaliesView } from './pages/AnomaliesView';
import { LoginView } from './pages/LoginView';
import { DashboardView } from './pages/DashboardView';
import { ExcelImportView } from './pages/ExcelImportView';
import { VisitReportsView } from './pages/VisitReportsView';
import { SettingsView } from './pages/SettingsView';
import { PrivacyPolicyView } from './pages/PrivacyPolicyView';
import { TermsView } from './pages/TermsView';
import { Users, UserX, Briefcase, Navigation, Clock } from 'lucide-react';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<StaffUser | null>(null);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [isWsConnected, setIsWsConnected] = useState(false);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);

  // Operations Data
  const [overviewStats, setOverviewStats] = useState<OverviewStats | null>(null);
  const [liveStaff, setLiveStaff] = useState<LiveStaffItem[]>([]);
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [jobs, setJobs] = useState<ExtraHandJob[]>([]);
  const [selectedRouteData, setSelectedRouteData] = useState<RouteData | null>(null);
  const [selectedRouteStaffId, setSelectedRouteStaffId] = useState<number | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  // Check auth session
  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = getAuthToken();
    if (!token) {
      setIsLoadingAuth(false);
      return;
    }
    try {
      const profile = await api.getProfile();
      setCurrentUser(profile);
      loadDashboardData();
    } catch (e) {
      removeAuthToken();
      setCurrentUser(null);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const loadDashboardData = async () => {
    try {
      const [stats, live, staff, jobItems] = await Promise.all([
        api.getOverviewStats(),
        api.getLiveStaff(),
        api.listStaff(),
        api.getJobs()
      ]);
      setOverviewStats(stats);
      setLiveStaff(live);
      setStaffList(staff);
      setJobs(jobItems);

      // Default load Rahul's route
      const rahul = staff.find((s) => s.employee_code === 'EMP101');
      if (rahul) {
        handleLoadStaffRoute(rahul.id);
      }
    } catch (e) {
      console.error('Error loading dashboard data:', e);
    }
  };

  // WebSocket setup
  useEffect(() => {
    if (!currentUser) return;

    adminWs.connect((connected) => {
      setIsWsConnected(connected);
    });

    const unsubscribe = adminWs.subscribe((msg) => {
      if (msg.type === 'SNAPSHOT' && Array.isArray(msg.data)) {
        // Refresh live list
        api.getLiveStaff().then(setLiveStaff);
        api.getOverviewStats().then(setOverviewStats);
      } else {
        // Real-time delta update
        api.getLiveStaff().then(setLiveStaff);
        api.getOverviewStats().then(setOverviewStats);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleLoadStaffRoute = async (staffId: number) => {
    setIsRouteLoading(true);
    setSelectedRouteStaffId(staffId);
    try {
      const route = await api.getStaffRoute(staffId);
      setSelectedRouteData(route);
    } catch (e) {
      console.error('Failed to load route:', e);
    } finally {
      setIsRouteLoading(false);
    }
  };

  const handleSelectStaffRouteFromMap = (staffId: number) => {
    handleLoadStaffRoute(staffId);
    setCurrentTab('route-history');
  };

  const handleLogout = () => {
    removeAuthToken();
    setCurrentUser(null);
  };

  if (isLoadingAuth) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-light)', color: '#64748B' }}>
        Loading CogniTrack Operations Console...
      </div>
    );
  }

  if (!currentUser) {
    return <LoginView onLoginSuccess={() => checkAuth()} />;
  }

  return (
    <div style={{ width: '100%', minHeight: '100vh', display: 'flex', flexDirection: 'row', background: 'var(--bg-light)' }}>
      {/* Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        user={currentUser}
        onLogout={handleLogout}
        isWsConnected={isWsConnected}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, overflowX: 'hidden' }}>
        {/* Top Header Bar */}
        <Header
          currentTab={currentTab}
          user={currentUser}
          onRefresh={loadDashboardData}
        />

        {/* Main Tab Content */}
        <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'auto' }}>
          {currentTab === 'dashboard' && (
            <DashboardView
              overviewStats={overviewStats}
              liveStaff={liveStaff}
              jobs={jobs}
              onNavigateTab={setCurrentTab}
            />
          )}

          {currentTab === 'live-map' && (
            <LiveMap
              staffList={liveStaff}
              onSelectStaffRoute={handleSelectStaffRouteFromMap}
            />
          )}

          {currentTab === 'staff' && (
            <StaffManagement
              staffList={staffList}
              onRefresh={loadDashboardData}
              onViewRoute={handleSelectStaffRouteFromMap}
            />
          )}

          {currentTab === 'excel-import' && (
            <ExcelImportView
              staffList={staffList}
              onImportSuccess={loadDashboardData}
            />
          )}

          {currentTab === 'route-history' && (
            <div style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 64px)' }}>
              {/* Staff Selector Bar */}
              <div
                style={{
                  height: 54,
                  borderBottom: '1px solid rgba(255,255,255,0.08)',
                  background: 'rgba(15, 23, 42, 0.95)',
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 24px',
                  gap: 16,
                  zIndex: 10
                }}
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>Select Staff Member:</span>
                <select
                  value={selectedRouteStaffId || ''}
                  onChange={(e) => handleLoadStaffRoute(Number(e.target.value))}
                  style={{
                    background: '#090D16',
                    color: '#FFFFFF',
                    border: '1px solid rgba(14, 165, 233, 0.3)',
                    padding: '6px 12px',
                    borderRadius: 8,
                    fontSize: 13,
                    fontWeight: 600,
                    outline: 'none'
                  }}
                >
                  {staffList.filter(s => s.role !== 'ADMIN').map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.employee_code}) - {s.department}
                    </option>
                  ))}
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <RouteMap routeData={selectedRouteData} isLoading={isRouteLoading} />
              </div>
            </div>
          )}

          {currentTab === 'jobs' && (
            <JobsView jobs={jobs} staffList={staffList} onRefresh={loadDashboardData} />
          )}

          {currentTab === 'reports' && (
            <ReportsView />
          )}

          {currentTab === 'visit-reports' && (
            <VisitReportsView />
          )}

          {currentTab === 'settings' && (
            <SettingsView currentUser={currentUser} />
          )}

          {currentTab === 'privacy' && (
            <PrivacyPolicyView />
          )}

          {currentTab === 'terms' && (
            <TermsView />
          )}

          {currentTab === 'anomalies' && (
            <AnomaliesView />
          )}
        </main>
      </div>

      {/* Staff Mobile App Simulator Modal */}
      <MobileSimulator
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
        onLocationSent={() => {
          api.getLiveStaff().then(setLiveStaff);
          api.getOverviewStats().then(setOverviewStats);
          if (selectedRouteStaffId) {
            api.getStaffRoute(selectedRouteStaffId).then(setSelectedRouteData);
          }
        }}
      />
    </div>
  );
};

export default App;
