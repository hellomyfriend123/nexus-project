import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardHeader({
  loading,
  error,
  navigate,
  fetchDashboardData,
}: ReturnType<typeof useAdminDashboard>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Tổng quan hệ thống</h1>
        <p className="nx-page-subtitle">
          Chào mừng trở lại! Dưới đây là tình hình hoạt động của sàn thương mại Nexus.
          {error && !loading && (
            <span
              style={{
                marginLeft: '8px',
                fontSize: '11px',
                padding: '2px 8px',
                borderRadius: '12px',
                backgroundColor: '#fef3c7',
                color: '#d97706',
                fontWeight: 600,
              }}
            >
              Chưa thể tải dữ liệu
            </span>
          )}
        </p>
      </div>
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          type="button"
          className="nx-btn nx-btn-outline"
          onClick={() => void fetchDashboardData()}
          disabled={loading}
        >
          <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} aria-hidden="true"></i> Làm mới
        </button>
        <button
          type="button"
          className="nx-btn nx-btn-outline"
          onClick={() => navigate('/admin/auctions')}
        >
          <i className="bi bi-hammer" aria-hidden="true"></i> Xem đấu giá
        </button>
      </div>
    </div>
  );
}
