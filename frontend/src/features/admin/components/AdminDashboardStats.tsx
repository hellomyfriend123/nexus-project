import AdminStatCard from './AdminStatCard';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardStats({ stats, loading }: ReturnType<typeof useAdminDashboard>) {
  const cards = [
    {
      label: 'Người dùng',
      value: stats.totalUsers,
      icon: 'bi-people',
      iconBg: '#eff6ff',
      iconColor: '#315bf4',
    },
    {
      label: 'Đơn hàng',
      value: stats.totalOrders,
      icon: 'bi-bag-check',
      iconBg: '#fef3c7',
      iconColor: '#d97706',
    },
    {
      label: 'Phiên đấu giá đang diễn ra',
      value: stats.activeAuctions,
      icon: 'bi-fire',
      iconBg: '#fef2f2',
      iconColor: '#dc2626',
    },
  ];

  return (
    <div className="nx-stat-grid" aria-busy={loading}>
      {cards.map((card) => (
        <AdminStatCard
          key={card.label}
          label={card.label}
          value={loading ? 'Đang tải…' : card.value?.toLocaleString('vi-VN') ?? 'Không tải được'}
          unavailable={loading || card.value === null}
          icon={card.icon}
          iconBg={card.iconBg}
          iconColor={card.iconColor}
          subtitle={loading ? 'Đang tải dữ liệu…' : card.value === null ? 'Chưa tải được dữ liệu' : undefined}
        />
      ))}
    </div>
  );
}
