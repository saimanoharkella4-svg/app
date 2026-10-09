import React from 'react';
import { FileText, CheckCircle2, AlertCircle } from 'lucide-react';

export const TermsView: React.FC = () => {
  return (
    <div style={{ padding: 32, background: '#FFFFFF', minHeight: 'calc(100vh - 64px)', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ borderBottom: '1px solid #E2E8F0', paddingBottom: 20, marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800, color: '#0F172A', margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
          <FileText size={26} color="#2563EB" /> Terms and Conditions of Service
        </h1>
        <p style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>
          Last updated: October 9, 2026 | CogniTrack Field Operations Platform
        </p>
      </div>

      <div style={{ fontSize: 14, color: '#334155', lineHeight: 1.7, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>1. Acceptable Use Policy</h2>
          <p style={{ margin: 0 }}>
            The CogniTrack platform is intended strictly for authorized enterprise field staff tracking, schedule management, and merchant visit verification. Users agree not to tamper with location sensors, submit fraudulent visit reports, or reverse-engineer API endpoints.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>2. User Credentials & Account Security</h2>
          <p style={{ margin: 0 }}>
            Administrators and executives are responsible for safeguarding login credentials. Shared accounts are strictly prohibited. Any unauthorized account access must be reported immediately to system administrators.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>3. Service Availability and SLA</h2>
          <p style={{ margin: 0 }}>
            CogniTrack targets 99.9% platform availability. Scheduled maintenance windows will be announced in advance through admin broadcasts. We reserve the right to suspend access in cases of security breaches or policy violations.
          </p>
        </section>

        <section>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: '#0F172A', marginBottom: 8 }}>4. Compliance & Location Consent</h2>
          <p style={{ margin: 0 }}>
            By logging in and starting a shift, field staff consent to duty-bound location monitoring. Location tracking ceases immediately upon shift termination.
          </p>
        </section>
      </div>
    </div>
  );
};
