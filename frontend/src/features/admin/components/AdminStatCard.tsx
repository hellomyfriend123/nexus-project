interface AdminStatCardProps {
  label: string;
  value: string | number;
  icon: string;
  subtitle?: string;
  unavailable?: boolean;
}

export function AdminStatCard({ label, value, icon, subtitle, unavailable = false }: AdminStatCardProps) {
  return (
    <div className="nx-stat-card">
      <div>
        <div className="nx-stat-label">{label}</div>
        <div className={`nx-stat-val${unavailable ? ' nx-stat-val-unavailable' : ''}`}>{value}</div>
        {subtitle && <div className="nx-admin-stat-note">{subtitle}</div>}
      </div>
      <div className="nx-stat-icon"><i className={`bi ${icon}`} aria-hidden="true" /></div>
    </div>
  );
}
export default AdminStatCard;
