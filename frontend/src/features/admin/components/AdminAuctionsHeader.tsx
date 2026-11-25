import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsHeader(model: ReturnType<typeof useAdminAuctions>) {
  const { loading, isUsingRealApi, loadAuctions } = model;
  return (
    <div className="nx-page-header">
            <div>
              <h1 className="nx-page-title">Quản trị Đấu giá trực tuyến (FR-57)</h1>
              <p className="nx-page-subtitle">
                Kết nối REST API: <code>/api/v1/admin/auction/auctions</code>
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
            <button
              type="button"
              className="nx-btn nx-btn-outline"
              onClick={loadAuctions}
              disabled={loading}
            >
              <i className="bi bi-arrow-clockwise me-1"></i> {loading ? 'Đang tải...' : 'Làm mới'}
            </button>
          </div>
  );
}
