import { AdminDashboardTable } from './AdminDashboardTable';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardRecentOrders(model: ReturnType<typeof useAdminDashboard>) {
  const { navigate, stats } = model;
  return (
    <div className="nx-admin-card">
      <div className="nx-admin-card-header">
        <h2 className="nx-admin-card-title">
          <i className="bi bi-receipt me-2 text-primary"></i> Đơn hàng gần đây
        </h2>
        <button
          type="button"
          className="nx-btn nx-btn-outline nx-btn-sm"
          onClick={() => navigate('/admin/commerce')}
        >
          Xem tất cả ({stats.totalOrders})
        </button>
      </div>
      <div className="nx-table-container">
        <AdminDashboardTable {...model} />
      </div>
    </div>
  );
}
