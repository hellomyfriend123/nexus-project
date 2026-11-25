interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  iconBg?: string;
  iconColor?: string;
  subtitle?: string;
  unavailable?: boolean;
}

export function AdminStatCard({
  label,
  value,
  icon,
  iconBg = '#eff6ff',
  iconColor = '#315bf4',
  subtitle,
  unavailable = false,
}: AdminStatCardProps) {
  return (
    <div className="nx-stat-card">
      <div>
        <div className="nx-stat-label">{label}</div>
        <div className={`nx-stat-val${unavailable ? ' nx-stat-val-unavailable' : ''}`}>{value}</div>
        {subtitle && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
            {subtitle}
          </div>
        )}
      </div>

      <div className="nx-stat-icon" style={{ backgroundColor: iconBg, color: iconColor }}>
        <i className={`bi ${icon}`} aria-hidden="true"></i>
      </div>
    </div>
  );
}

export default AdminStatCard;
