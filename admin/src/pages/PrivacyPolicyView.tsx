import React from 'react';
import { ShieldCheck, Lock, FileText, Server } from 'lucide-react';

export const PrivacyPolicyView: React.FC = () => {
  return (
    <div style={{ padding: 32, background: '#FFFFFF', minHeight: 'calc(100vh - 64px)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 20, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <ShieldCheck size={26} color="#2563EB" /> Privacy Policy
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Last updated: October 9, 2026 | CogniTrack Field Operations Platform
        </p>
      </div>

      <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>1. Data Collection and Location Telemetry</h2>
          <p style={{ margin: 0 }}>
            CogniTrack collects background location data, device battery status, and shift attendance records solely when field executives are actively clocked in for operational duties. Location tracking automatically pauses when an executive logs off or takes an official break.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>2. Use of Information</h2>
          <p style={{ margin: 0 }}>
            Collected telemetry data is utilized exclusively for field assignment dispatch, route optimization, customer visit verification, and attendance shift audits. We do not sell, rent, or trade location telemetry or personal employee data to third parties.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>3. Security & Access Control</h2>
          <p style={{ margin: 0 }}>
            All location telemetry and merchant records are encrypted in transit via TLS 1.3 and at rest using AES-256 database encryption. Strict role-based access controls (RBAC) restrict data access to authorized managers and system administrators.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>4. Data Retention</h2>
          <p style={{ margin: 0 }}>
            Field trajectory breadcrumbs are retained for a default operational window of 3 months, after which location points are automatically archived or purged according to system retention policies.
          </p>
        </section>
      </div>
    </div>
  );
};
