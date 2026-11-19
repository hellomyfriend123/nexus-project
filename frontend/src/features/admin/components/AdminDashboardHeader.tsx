import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardHeader({ loading, fetchDashboardData }: ReturnType<typeof useAdminDashboard>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Tổng quan</h1>
        <p className="nx-page-subtitle">Theo dõi người dùng, đơn hàng và các phiên đấu giá.</p>
      </div>
      <button type="button" className="nx-btn nx-btn-outline" onClick={() => void fetchDashboardData()} disabled={loading}>
        <i className="bi bi-arrow-clockwise" aria-hidden="true" /> {loading ? 'Đang tải…' : 'Làm mới'}
      </button>
    </div>
  );
}
