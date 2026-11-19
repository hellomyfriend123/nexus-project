import AdminStatCard from './AdminStatCard';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardStats({ stats, loading }: ReturnType<typeof useAdminDashboard>) {
  const cards = [
    { label: 'Người dùng', value: stats.totalUsers, icon: 'bi-people' },
    { label: 'Đơn hàng', value: stats.totalOrders, icon: 'bi-bag-check' },
    { label: 'Đấu giá đang diễn ra', value: stats.activeAuctions, icon: 'bi-hammer' },
  ];
  return (
    <div className="nx-stat-grid" aria-busy={loading}>
      {cards.map(card => (
        <AdminStatCard
          key={card.label}
          label={card.label}
          value={loading ? 'Đang tải…' : card.value?.toLocaleString('vi-VN') ?? 'Không tải được'}
          unavailable={loading || card.value === null}
          icon={card.icon}
          subtitle={loading ? 'Đang tải dữ liệu…' : card.value === null ? 'Chưa tải được dữ liệu' : undefined}
        />
      ))}
    </div>
  );
}
