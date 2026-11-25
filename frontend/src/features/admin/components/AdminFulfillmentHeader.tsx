import type { useAdminFulfillment } from '../hooks/useAdminFulfillment';

export function AdminFulfillmentHeader({
  loading,
  error,
  loadData,
}: ReturnType<typeof useAdminFulfillment>) {
  return (
    <div className="nx-page-header">
      <div>
        <h1 className="nx-page-title">Quản lý Tồn kho &amp; Kho hàng</h1>
        <p className="nx-page-subtitle">
          Theo dõi số lượng tồn kho và quản lý mạng lưới kho vận hành.
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
        onClick={() => void loadData()}
        disabled={loading}
      >
        <i className={`bi bi-arrow-clockwise ${loading ? 'spin' : ''}`} aria-hidden="true"></i> Làm mới
      </button>
    </div>
  );
}
