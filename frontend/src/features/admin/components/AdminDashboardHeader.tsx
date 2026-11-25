import type { useAdminDashboard } from '../hooks/useAdminDashboard';

export function AdminDashboardHeader(model: ReturnType<typeof useAdminDashboard>) {
  const { navigate, loading, isUsingRealApi, fetchDashboardData } = model;
  return (
    <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Tổng quan hệ thống</h1>
              <p className="nx-page-subtitle">
                Chào mừng trở lại! Dưới đây là tình hình hoạt động của sàn thương mại Nexus.
                <span
                  style={{
                    marginLeft: '8px',
                    fontSize: '11px',
                    padding: '2px 8px',
                    borderRadius: '12px',
                    backgroundColor: isUsingRealApi ? '#ecfdf5' : '#fef3c7',
                    color: isUsingRealApi ? '#059669' : '#d97706',
                    fontWeight: 600,
                  }}
                >
                  {isUsingRealApi ? '● Live REST API' : '○ Lỗi kết nối API'}
                </span>
              </p>
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                onClick={() => fetchDashboardData()}
                disabled={loading}
              >
                <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`}></i> Làm mới
              </button>
              <button
                type="button"
                className="nx-btn nx-btn-outline"
                onClick={() => navigate('/admin/auctions')}
              >
                <i className="bi bi-hammer"></i> Xem đấu giá
              </button>
            </div>
          </div>
  );
}
