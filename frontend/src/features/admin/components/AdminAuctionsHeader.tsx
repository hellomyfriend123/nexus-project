import type { useAdminAuctions } from '../hooks/useAdminAuctions';

export function AdminAuctionsHeader({
  loading,
  error,
  loadAuctions,
}: ReturnType<typeof useAdminAuctions>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Quản lý Đấu giá trực tuyến</h1>
        <p className="nx-page-subtitle">
          Theo dõi các phiên đấu giá, giá hiện tại, người tham gia trả giá và xử lý sự cố.
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
      <button
        type="button"
        className="nx-btn nx-btn-outline"
        onClick={() => void loadAuctions()}
        disabled={loading}
      >
        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} aria-hidden="true"></i>{' '}
        {loading ? 'Đang tải...' : 'Làm mới'}
      </button>
    </div>
  );
}
