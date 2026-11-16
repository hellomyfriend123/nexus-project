import React from 'react';

interface SellerStatCardProps {
  title: string;
  value: string | number;
  icon: string;
  color?: 'primary' | 'success' | 'warning' | 'danger' | 'info';
  subtitle?: string;
  badge?: string;
}

export function SellerStatCard({
  title,
  value,
  icon,
  color = 'primary',
  subtitle,
  badge,
}: SellerStatCardProps) {
  const colorMap = {
    primary: { bg: '#eff6ff', text: '#315bf4' },
    success: { bg: '#ecfdf5', text: '#10b981' },
    warning: { bg: '#fffbeb', text: '#f59e0b' },
    danger: { bg: '#fef2f2', text: '#ef4444' },
    info: { bg: '#f0f9ff', text: '#0284c7' },
  };

  const current = colorMap[color] || colorMap.primary;

  return (
    <div className="nx-seller-stat-card">
      <div
        className="nx-seller-stat-icon"
        style={{ backgroundColor: current.bg, color: current.text }}
      >
        <i className={`bi ${icon}`}></i>
      </div>
      <div className="nx-seller-stat-info flex-grow-1">
        <div className="d-flex align-items-center justify-content-between">
          <p className="m-0 text-muted" style={{ fontSize: '13px' }}>
            {title}
          </p>
          {badge && (
            <span
              className="badge"
              style={{
                backgroundColor: current.bg,
                color: current.text,
                fontSize: '10px',
                fontWeight: 600,
              }}
            >
              {badge}
            </span>
          )}
        </div>
        <h4 className="mt-1 mb-0 fw-bold">{value}</h4>
        {subtitle && (
          <small className="text-muted" style={{ fontSize: '11px' }}>
            {subtitle}
          </small>
        )}
      </div>
    </div>
  );
}

export default SellerStatCard;
