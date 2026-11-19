import { AdminDashboardTable } from './AdminDashboardTable';
import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardRecentOrders(model: ReturnType<typeof useAdminDashboard>) {
  return (
    <section className="nx-admin-card" aria-labelledby="recent-orders-title">
      <div className="nx-admin-card-header">
        <h2 className="nx-admin-card-title" id="recent-orders-title">Đơn hàng gần đây</h2>
        <button type="button" className="nx-btn nx-btn-outline nx-btn-sm" onClick={() => model.navigate('/admin/commerce')}>
          Xem tất cả{!model.loading && model.stats.totalOrders !== null ? ` (${model.stats.totalOrders.toLocaleString('vi-VN')})` : ''}
        </button>
      </div>
      <div className="nx-table-container"><AdminDashboardTable {...model} /></div>
    </section>
  );
}
