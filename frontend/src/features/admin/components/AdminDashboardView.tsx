import { AdminDashboardReviewModeration } from './AdminDashboardReviewModeration';
import { AdminDashboardRecentOrders } from './AdminDashboardRecentOrders';
import { AdminDashboardStats } from './AdminDashboardStats';
import { AdminDashboardHeader } from './AdminDashboardHeader';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardView(model: ReturnType<typeof useAdminDashboard>) {
  const { error } = model;
  return (
    <div>
      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      <AdminDashboardHeader {...model} />

      <p className="nx-page-subtitle">MOCK: doanh thu, xu hướng tăng trưởng và số phiên sắp kết thúc là dữ liệu minh họa; backend chưa có API tổng hợp. Danh sách đơn hàng và tổng số dùng REST API; khối chờ duyệt chưa có API hỗ trợ.</p>
      {/* KPI Cards Grid */}
      <AdminDashboardStats {...model} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
        {/* Recent Orders Table */}
        <AdminDashboardRecentOrders {...model} />

        {/* Pending Reviews Moderation */}
        <AdminDashboardReviewModeration {...model} />
      </div>
    </div>
  );
}
