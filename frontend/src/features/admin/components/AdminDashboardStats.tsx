import { dashboardPresentationMock } from '../services/dashboard.mock';
import AdminStatCard from '../components/AdminStatCard';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardStats(model: ReturnType<typeof useAdminDashboard>) {
  const { stats, formatCurrency } = model;
  return (
    <div className="nx-stat-grid">
      <AdminStatCard
        label="Tổng doanh thu (MOCK)"
        value={formatCurrency(stats.totalRevenue)}
        icon="bi-cash-coin"
        iconBg="#ecfdf5"
        iconColor="#059669"
        trend={{ value: dashboardPresentationMock.revenueTrend, isPositive: true }}
      />
      <AdminStatCard
        label="Tổng người dùng"
        value={stats.totalUsers.toLocaleString()}
        icon="bi-people"
        iconBg="#eff6ff"
        iconColor="#315bf4"
        trend={{ value: dashboardPresentationMock.usersTrend, isPositive: true }}
      />
      <AdminStatCard
        label="Đơn hàng"
        value={stats.totalOrders}
        icon="bi-bag-check"
        iconBg="#fef3c7"
        iconColor="#d97706"
        trend={{ value: dashboardPresentationMock.ordersTrend, isPositive: true }}
      />
      <AdminStatCard
        label="Phiên đấu giá đang diễn ra"
        value={stats.activeAuctions}
        icon="bi-fire"
        iconBg="#fef2f2"
        iconColor="#dc2626"
        subtitle={dashboardPresentationMock.endingToday + ' (MOCK)'}
      />
    </div>
  );
}
