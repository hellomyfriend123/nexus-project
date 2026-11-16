interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  trend?: {
    value: string;
    isPositive: boolean;
  };
  subtitle?: string;
}

export function AdminStatCard({
  label,
  value,
  icon,
  iconBg = '#eff6ff',
  iconColor = '#315bf4',
  trend,
  subtitle,
}: AdminStatCardProps) {
  return (
    <div className="nx-stat-card">
      <div>
        <div className="nx-stat-label">{label}</div>
        <div className="nx-stat-val">{value}</div>
        {trend && (
          <div style={{ fontSize: '12px', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ color: trend.isPositive ? '#059669' : '#dc2626', fontWeight: 600 }}>
              <i className={`bi bi-arrow-${trend.isPositive ? 'up' : 'down'}-short`}></i>
              {trend.value}
            </span>
            <span style={{ color: '#94a3b8' }}>so với tháng trước</span>
          </div>
        )}
        {subtitle && !trend && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="nx-stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
        <i className={`bi ${icon}`}></i>
      </div>
    </div>
  );
}

export default AdminStatCard;
