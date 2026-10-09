import React from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  color?: 'emerald' | 'primary' | 'amber' | 'rose' | 'indigo';
  isLive?: boolean;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  subtitle,
  icon,
  color = 'primary',
  isLive = false
}) => {
  const colorMap = {
    emerald: {
      border: '#A7F3D0',
      iconBg: '#ECFDF5',
      iconColor: '#059669',
      glow: '0 4px 20px rgba(16, 185, 129, 0.08)'
    },
    primary: {
      border: '#FDE68A',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      glow: '0 4px 20px rgba(245, 158, 11, 0.1)'
    },
    amber: {
      border: '#FDE68A',
      iconBg: '#FFFBEB',
      iconColor: '#D97706',
      glow: '0 4px 20px rgba(245, 158, 11, 0.1)'
    },
    rose: {
      border: '#FECACA',
      iconBg: '#FEF2F2',
      iconColor: '#DC2626',
      glow: '0 4px 20px rgba(239, 68, 68, 0.08)'
    },
    indigo: {
      border: '#C7D2FE',
      iconBg: '#EEF2FF',
      iconColor: '#4F46E5',
      glow: '0 4px 20px rgba(99, 102, 241, 0.08)'
    }
  };

  const c = colorMap[color];

  return (
    <div
      className="glass-panel"
      style={{
        padding: '20px 24px',
        backgroundColor: '#FFFFFF',
        borderColor: c.border,
        boxShadow: c.glow,
        position: 'relative',
        overflow: 'hidden'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </span>
        <div
          style={{
            width: 38,
            height: 38,
            borderRadius: 10,
            background: c.iconBg,
            color: c.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          {icon}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
        <span style={{ fontSize: 28, fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
          {value}
        </span>
        {isLive && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span className="pulse-dot" />
            <span style={{ fontSize: 11, fontWeight: 800, color: '#059669', textTransform: 'uppercase' }}>Live</span>
          </div>
        )}
      </div>

      {subtitle && (
        <div style={{ fontSize: 12, color: '#94A3B8', marginTop: 4, fontWeight: 500 }}>
          {subtitle}
        </div>
      )}
    </div>
  );
};
