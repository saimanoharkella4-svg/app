import React, { useState, useRef } from 'react';
import { api } from '../services/api';
import { MapPin, ShieldCheck, Lock, User, ArrowRight, Sparkles, Activity, Radio, ShieldAlert, X, CheckCircle2 } from 'lucide-react';

interface LoginViewProps {
  onLoginSuccess: () => void;
}

export const LoginView: React.FC<LoginViewProps> = ({ onLoginSuccess }) => {
  const [employeeCode, setEmployeeCode] = useState('ADMIN001');
  const [password, setPassword] = useState('Password@123');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const userInputRef = useRef<HTMLInputElement>(null);

  const openSignInModal = () => {
    setIsFormOpen(true);
    setErrorMsg('');
    setTimeout(() => {
      userInputRef.current?.focus();
    }, 150);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg('');
    try {
      await api.login(employeeCode, password);
      onLoginSuccess();
    } catch (err: any) {
      setErrorMsg(err.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      style={{
        width: '100vw',
        minHeight: '100vh',
        backgroundColor: '#0F172A',
        fontFamily: "'Plus Jakarta Sans', system-ui, -apple-system, sans-serif",
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflowX: 'hidden'
      }}
    >
      {/* =========================================================================
          TOP ENTERPRISE NAVBAR
         ========================================================================= */}
      <header
        style={{
          width: '100%',
          padding: '20px 48px',
          boxSizing: 'border-box',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
          background: 'rgba(15, 23, 42, 0.95)',
          backdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        {/* Brand Identity */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <div
            style={{
              width: 42,
              height: 42,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563EB, #06B6D4)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 20px rgba(37, 99, 235, 0.35)'
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2.4">
              <circle cx="12" cy="12" r="9" stroke="rgba(255,255,255,0.4)" strokeWidth="1.6" />
              <circle cx="12" cy="12" r="4" stroke="#06B6D4" strokeWidth="2.2" fill="#06B6D4" fillOpacity="0.3" />
              <path d="M12 2V5" stroke="#FFFFFF" />
              <path d="M12 19V22" stroke="#FFFFFF" />
              <path d="M2 12H5" stroke="#FFFFFF" />
              <path d="M19 12H22" stroke="#FFFFFF" />
            </svg>
          </div>
          <div>
            <h1 style={{ fontSize: 22, fontWeight: 900, color: '#FFFFFF', letterSpacing: '-0.02em', margin: 0 }}>
              Cogni<span style={{ color: '#38BDF8' }}>Track</span>
            </h1>
            <span style={{ fontSize: 10, fontWeight: 700, color: '#94A3B8', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              Enterprise Operations Console
            </span>
          </div>
        </div>

        {/* Top Right Sign In Action Button */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(255, 255, 255, 0.05)', padding: '6px 14px', borderRadius: 8, border: '1px solid rgba(255, 255, 255, 0.1)', fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10B981' }} />
            System Operational
          </div>

          <button
            onClick={openSignInModal}
            style={{
              padding: '10px 22px',
              borderRadius: 8,
              border: 'none',
              background: '#2563EB',
              color: '#FFFFFF',
              fontSize: 13.5,
              fontWeight: 800,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              boxShadow: '0 4px 14px rgba(37, 99, 235, 0.4)',
              transition: 'all 0.2s ease'
            }}
          >
            <Lock size={15} /> Sign In
          </button>
        </div>
      </header>

      {/* =========================================================================
          MAIN HERO LANDING CONTENT & ENTERPRISE SHOWCASE
         ========================================================================= */}
      <main
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 48px',
          boxSizing: 'border-box',
          position: 'relative'
        }}
      >
        {/* Background Ambient Glows */}
        <div
          style={{
            position: 'absolute',
            top: '10%',
            left: '15%',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(37, 99, 235, 0.15) 0%, transparent 70%)',
            filter: 'blur(80px)',
            pointerEvents: 'none'
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '10%',
            right: '15%',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%)',
            filter: 'blur(70px)',
            pointerEvents: 'none'
          }}
        />

        <div style={{ maxWidth: 1100, width: '100%', position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 48, alignItems: 'center' }}>
            
            {/* Left Column: Enterprise Hero Content */}
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(37, 99, 235, 0.15)', border: '1px solid rgba(37, 99, 235, 0.3)', padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 800, color: '#60A5FA', marginBottom: 20 }}>
                <Sparkles size={14} /> ENTERPRISE FIELD TELEMETRY PLATFORM
              </div>

              <h2 style={{ fontSize: 42, fontWeight: 900, color: '#F8FAFC', letterSpacing: '-0.03em', lineHeight: 1.15, margin: '0 0 20px 0' }}>
                Real-Time Field Telemetry & Staff Tracking Portal
              </h2>

              <p style={{ fontSize: 16, color: '#94A3B8', lineHeight: 1.6, margin: '0 0 32px 0' }}>
                Comprehensive admin console for real-time GPS location tracking, live geofence verification, automated audit logs, and executive weekly performance reports.
              </p>

              {/* Main Left "Sign In" Hero Action Button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
                <button
                  onClick={openSignInModal}
                  style={{
                    padding: '14px 32px',
                    borderRadius: 10,
                    border: 'none',
                    background: '#2563EB',
                    color: '#FFFFFF',
                    fontSize: 15,
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    boxShadow: '0 8px 24px rgba(37, 99, 235, 0.4)',
                    transition: 'all 0.2s ease'
                  }}
                >
                  <Lock size={18} /> Sign In to Operations Portal <ArrowRight size={18} />
                </button>
              </div>

              {/* Enterprise KPI Badges */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 16px', borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#38BDF8', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={18} color="#38BDF8" /> 99.9%
                  </div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, marginTop: 4 }}>Telemetry Uptime</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 16px', borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#34D399', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Radio size={18} color="#34D399" /> 60s
                  </div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, marginTop: 4 }}>Live Sync Speed</div>
                </div>

                <div style={{ background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '14px 16px', borderRadius: 12 }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#FBBF24', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <ShieldCheck size={18} color="#FBBF24" /> 200m
                  </div>
                  <div style={{ fontSize: 11, color: '#CBD5E1', fontWeight: 600, marginTop: 4 }}>Geofence Radius</div>
                </div>
              </div>
            </div>

            {/* Right Column: Interactive Capability Cards */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(37, 99, 235, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <MapPin size={20} color="#60A5FA" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Live Telemetry Radar</h3>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Real-time GPS tracking & battery monitoring</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  Monitor active executives on an interactive map, trace shift route history, view battery telemetry, and audit task completions.
                </p>
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', border: '1px solid rgba(255, 255, 255, 0.08)', borderRadius: 16, padding: 24 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(239, 68, 68, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <ShieldAlert size={20} color="#F87171" />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: '#FFFFFF', margin: 0 }}>Automated Anomaly Audits</h3>
                    <span style={{ fontSize: 11, color: '#94A3B8' }}>Instant detection of high-speed GPS jumps</span>
                  </div>
                </div>
                <p style={{ fontSize: 13, color: '#94A3B8', margin: 0, lineHeight: 1.5 }}>
                  Automated verification algorithms flag suspicious speed jumps (&gt;140 km/h), mock locations, and extended off-grid durations.
                </p>
              </div>
            </div>

          </div>
        </div>
      </main>

      {/* =========================================================================
          SIGN IN MODAL DIALOG (Opens when "Sign In" button is clicked)
         ========================================================================= */}
      {isFormOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 100,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24
          }}
          onClick={() => setIsFormOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              width: '100%',
              maxWidth: 440,
              background: '#FFFFFF',
              borderRadius: 16,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
              padding: 32,
              boxSizing: 'border-box',
              position: 'relative'
            }}
          >
            {/* Modal Header & Close Button */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#EEF2FF', border: '1px solid #C7D2FE', color: '#4338CA', padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 800, marginBottom: 8 }}>
                  <Lock size={12} color="#4F46E5" /> ADMINISTRATOR ACCESS
                </div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: '#0F172A', margin: 0 }}>
                  System Sign In
                </h3>
              </div>

              <button
                onClick={() => setIsFormOpen(false)}
                style={{
                  background: '#F1F5F9',
                  border: 'none',
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: '#64748B'
                }}
              >
                <X size={18} />
              </button>
            </div>

            {errorMsg && (
              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: 8,
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  color: '#DC2626',
                  fontSize: 13,
                  fontWeight: 600,
                  marginBottom: 20
                }}
              >
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                  Administrator ID / Employee Code
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <User size={18} color="#6366F1" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
                  <input
                    ref={userInputRef}
                    type="text"
                    required
                    value={employeeCode}
                    onChange={(e) => setEmployeeCode(e.target.value)}
                    style={{
                      paddingLeft: 44,
                      height: 46,
                      borderRadius: 10,
                      fontSize: 14,
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                    placeholder="e.g. ADMIN001"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12.5, fontWeight: 700, color: '#0F172A', display: 'block', marginBottom: 6 }}>
                  Password
                </label>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} color="#6366F1" style={{ position: 'absolute', left: 14, pointerEvents: 'none' }} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      paddingLeft: 44,
                      height: 46,
                      borderRadius: 10,
                      fontSize: 14,
                      border: '1px solid #CBD5E1',
                      fontWeight: 600,
                      width: '100%',
                      boxSizing: 'border-box',
                      outline: 'none',
                      color: '#0F172A'
                    }}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                style={{
                  height: 46,
                  fontSize: 14,
                  fontWeight: 800,
                  marginTop: 6,
                  borderRadius: 10,
                  background: '#2563EB',
                  color: '#FFFFFF',
                  border: 'none',
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(37, 99, 235, 0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8
                }}
              >
                {isLoading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={18} />
              </button>
            </form>

            {/* System Admin Quick Access Badge */}
            <div style={{ marginTop: 24, paddingTop: 18, borderTop: '1px solid #F1F5F9', textAlign: 'center' }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: '#64748B', marginBottom: 8, letterSpacing: '0.05em' }}>
                QUICK SYSTEM ACCESS
              </div>
              <button
                type="button"
                onClick={() => {
                  setEmployeeCode('ADMIN001');
                  setPassword('Password@123');
                }}
                style={{
                  fontSize: 12,
                  padding: '8px 18px',
                  fontWeight: 700,
                  border: '1px solid #2563EB',
                  color: '#1D4ED8',
                  background: '#EFF6FF',
                  borderRadius: 8,
                  cursor: 'pointer'
                }}
              >
                System Admin (ADMIN001)
              </button>
            </div>

            {/* Security Assurance Disclaimer */}
            <div style={{ marginTop: 20, textAlign: 'center', fontSize: 11, color: '#94A3B8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
              <ShieldCheck size={14} color="#059669" />
              256-bit Encrypted Session • Authorized Admin Access Only
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
